# Campus Notification System Design

## STAGE 1 — REST API Design

### 1. Introduction
The campus notification platform serves as a critical, real-time communication bridge between the administration and the student body. It ensures students receive prompt updates regarding academic placements, exam results, and campus events. Because the system must handle large bursts of traffic (e.g., during placement seasons or result declarations) and requires immediate delivery mechanisms, the architecture prioritizes scalability, robust filtering, and seamless real-time pushing alongside traditional REST interfaces.

### 2. API Design

**Authentication Assumptions:**
All API endpoints assume the user is pre-authorized. Requests must include a standard `Authorization: Bearer <token>` header containing a valid JSON Web Token (JWT). The JWT payload inherently contains the `studentID` and their respective role, avoiding the need to pass sensitive identifiers in the request body.

#### Endpoint 1: Fetch Notifications
- **Method:** `GET`
- **Path:** `/notifications`
- **Purpose:** Retrieves a paginated list of notifications for the authenticated student. 
- **Query Params:** None (defaults applied)
- **Headers:** `Authorization: Bearer <token>`
- **Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "ID": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "Type": "Result",
      "Message": "Your mid-semester grades are now available.",
      "Timestamp": "2026-05-16T10:00:00Z",
      "isRead": false
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

#### Endpoint 2: Filtered Fetch
- **Method:** `GET`
- **Path:** `/notifications?type=Placement&page=1&limit=10`
- **Purpose:** Allows clients to filter their inbox by specific notification types and handle pagination to reduce payload sizes.
- **Query Params:** `type` (enum: Placement, Result, Event), `page` (integer), `limit` (integer)
- **Headers:** `Authorization: Bearer <token>`
- **Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "ID": "9ab18fa9-efde-4ded-9f83-727c2d826669",
      "Type": "Placement",
      "Message": "CSX Corporation has shortlisted your profile.",
      "Timestamp": "2026-05-15T14:30:00Z",
      "isRead": true
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10
  }
}
```

#### Endpoint 3: Mark as Read
- **Method:** `PATCH`
- **Path:** `/notifications/:id/read`
- **Purpose:** Updates the `isRead` status of a specific notification to true. `PATCH` is chosen over `PUT` because we are applying a partial update rather than replacing the entire resource.
- **Headers:** `Authorization: Bearer <token>`
- **Example Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### Endpoint 4: Fetch Unread Count
- **Method:** `GET`
- **Path:** `/notifications/unread-count`
- **Purpose:** Highly optimized endpoint specifically for rendering the "notification badge" count on the frontend UI without fetching large data payloads.
- **Headers:** `Authorization: Bearer <token>`
- **Example Response:**
```json
{
  "success": true,
  "unreadCount": 12
}
```

### 3. Notification Schema
The fundamental Notification object contains the following fields:
- **ID (UUID v4):** A globally unique identifier for precise targeted updates. Better than auto-incrementing integers for security (prevents IDor enumeration attacks).
- **Type (String Enum):** Strictly typed to `Placement`, `Result`, or `Event` for filtering and priority sorting.
- **Message (String):** The primary content payload of the notification.
- **Timestamp (ISO 8601 Date String):** Standardized UTC timestamp for chronological sorting.
- **isRead (Boolean):** Tracks whether the user has interacted with or seen the notification.
- **studentID (String/UUID):** The foreign key linking the notification to a specific student.

### 4. Real-time Design
Polling the REST API every few seconds is highly inefficient and creates an unnecessary database load. Real-time mechanisms are absolutely necessary for time-sensitive alerts like placement interview links.
- **WebSockets:** A persistent, bi-directional communication protocol. Ideal if the client also needs to rapidly send events back to the server (e.g., chat applications).
- **Server-Sent Events (SSE):** A unidirectional connection where the server pushes updates to the client over standard HTTP. **SSE is the optimal choice here** because notifications inherently flow strictly from Server → Client. It requires less overhead than WebSockets, supports automatic reconnection natively, and bypasses many corporate firewall issues.

### 5. Design Decisions
- **Pagination:** Mandatory for `/notifications`. Serving thousands of notifications in one payload will crash mobile clients and saturate server memory. Offset-based or cursor-based pagination mitigates this.
- **Filtering:** Done strictly at the database query level, allowing users to easily isolate critical Placement updates from generic Event updates.
- **Unread Counts:** Isolated into its own endpoint because checking the count happens on every page load or UI mount, making it the highest throughput query.
- **Scalability Considerations:** As volume increases, the architecture will need to shift from monolithic DB queries to utilizing Redis caches for unread counts, and message brokers (Kafka/RabbitMQ) to handle massive notification creation spikes without blocking the main event loop.

---

## STAGE 2 — Database Design

### 1. Persistent Database Structure & Justification
For the initial phases of this campus notification system, **PostgreSQL** is chosen over NoSQL. 

**SQL vs. NoSQL Comparison:**
- *NoSQL (e.g., MongoDB, Cassandra)* excels at massive horizontal scalability and schema flexibility. It is often chosen for notifications at hyper-scale because notifications are mostly immutable, independent events.
- *SQL (e.g., PostgreSQL)* excels at strict data integrity, relationships, and structured queries.

**Why PostgreSQL initially?**
In a campus context (e.g., 50,000 students), the data volume is highly predictable and easily fits within a vertically scaled RDBMS. Notifications heavily rely on relational filtering (fetching based on student cohorts, departments, or graduation years). PostgreSQL offers excellent indexing mechanisms, JSONB support if schemas slightly shift, and ensures strict consistency out of the box.

### 2. Example SQL Table Definitions

```sql
CREATE TABLE Students (
    studentID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rollNo VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE notif_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE Notifications (
    notificationID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studentID UUID NOT NULL,
    type notif_type NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_student
        FOREIGN KEY(studentID) 
        REFERENCES Students(studentID)
        ON DELETE CASCADE
);
```

### 3. Relationships & Normalization
The schema adheres to 3rd Normal Form. There is a `1-to-Many` relationship between `Students` and `Notifications`. The `ON DELETE CASCADE` ensures that if a student is removed from the system, their localized notifications are safely wiped, preventing orphaned rows.

### 4. Indexing Strategy
At a baseline, foreign keys (`studentID`) must be indexed because notifications are almost exclusively fetched in the context of a specific student inbox. Additionally, compound indexes will be strictly necessary for combining `studentID`, `isRead`, and `createdAt` as data grows.

### 5. Future Scaling Concerns
As the table reaches multi-millions of rows, writes (especially global "Notify All" blasts) will lock indexes and degrade performance. 
- **Partitioning:** The `Notifications` table will eventually need time-based table partitioning (e.g., partitioning by Month). Old notifications can be archived to cold storage.
- **Redis Caching:** The `/unread-count` endpoint will destroy DB performance if queried dynamically on every page load. We will implement Redis. When a notification is created, we increment a Redis key (`unread:studentID`). When marked read, we decrement it. The API fetches directly from RAM in $O(1)$ time, skipping PostgreSQL entirely.

---

## STAGE 3 — Query Optimization

### 1. Analyzing the Slow Query
**Given Query:**
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Why it becomes slow at scale:**
With 50,000 students and 5,000,000 notifications, a database without proper indexing must perform a **Full Table Scan**. It physically reads every single one of the 5 million rows from disk to check if `studentID = 1042` and `isRead = false`. 

**The Cost of Sorting:**
Even if it finds the subset of rows, the `ORDER BY createdAt DESC` forces the database to hold those rows in memory, perform a costly sort operation, and then return them. This completely tanks CPU and memory resources under concurrent user load.

### 2. Indexing Tradeoffs
**Why not index every column?**
Adding an index creates a shadow data structure (usually a B-Tree). While this speeds up `SELECT` reads, it actively hurts `INSERT`, `UPDATE`, and `DELETE` operations because the database must update the main table *and* synchronously rewrite every attached B-Tree. Furthermore, indexes consume heavy disk and RAM space. Indexing every column is a severe anti-pattern resulting in heavy write-latency.

### 3. The Optimized Solution
We need a **Compound Index** covering the exact fields used in the `WHERE` and `ORDER BY` clauses.

**Add Optimized Index:**
```sql
CREATE INDEX idx_notifications_student_unread
ON notifications(studentID, isRead, createdAt DESC);
```

**How it improves lookup & optimization:**
1. **Targeted Lookup:** The DB traverses the B-Tree instantly jumping to the exact block containing `studentID = 1042`. It completely skips the other 49,999 students.
2. **Pre-filtered:** Since `isRead` is the second node in the index, it instantly narrows down only the unread nodes.
3. **Pre-sorted (ORDER BY Optimization):** Because `createdAt DESC` is structurally baked into the index tree, the resulting data is *already sorted* on disk. The database entirely bypasses the memory-heavy sort operation and just streams the index nodes directly back to the client.

### 4. Additional Task Query
*Find all students who received placement notifications in the last 7 days.*

```sql
SELECT DISTINCT s.studentID, s.name, s.email
FROM Students s
JOIN Notifications n ON s.studentID = n.studentID
WHERE n.type = 'Placement' 
  AND n.createdAt >= CURRENT_DATE - INTERVAL '7 days';
```

---

## STAGE 4 — Database Overload Problem

### 1. The Scenario
Notifications are fetched on every page load and the database is overloaded.

### 2. Causes of Overload
When thousands of students navigate through the campus portal, fetching their inbox on every single route change or page load results in the following:
- **Repeated Queries:** The exact same SQL query (`SELECT ... WHERE studentID = ?`) is executed redundantly for data that has not changed.
- **High Read Traffic:** The sheer volume of concurrent connections exhausts the database connection pool, starving critical write operations and bringing the primary database to a crawl.
- **Scalability Problems:** Vertically scaling the database (adding more RAM/CPU) only delays the inevitable. A database is not designed to serve high-frequency, mostly-static read traffic directly to clients.

### 3. Solutions

#### Redis Caching
- **How it improves performance:** Redis stores data in-memory, returning responses in sub-milliseconds compared to disk-based DB lookups. Fetching unread counts or recent notifications skips the database entirely.
- **Tradeoffs:** Introduces infrastructure complexity and requires strict cache invalidation logic.
- **Memory Considerations:** RAM is expensive. We must cache only active students and evict stale data using TTLs (Time-To-Live).
- **Consistency Considerations:** High risk of "stale reads" if the cache isn't properly invalidated after a notification is read or generated.

#### Pagination
- **How it improves performance:** Instead of returning 500 notifications, the server only processes and sends 10 at a time using `LIMIT` and `OFFSET`.
- **Tradeoffs:** Offset pagination gets slower on deeper pages. Cursor-based pagination is faster but harder to implement.
- **Memory Considerations:** Drastically reduces JSON parsing overhead on the server and memory footprint on the client device.
- **Consistency Considerations:** New notifications arriving during pagination can shift offsets, causing duplicate items on the next page.

#### Lazy Loading
- **How it improves performance:** Only loads the notification icon count initially. The full list is only queried if the user explicitly clicks the notification bell.
- **Tradeoffs:** Adds slight UI latency when opening the inbox menu.
- **Memory Considerations:** Frees up massive client-side memory since the DOM isn't bloated with hidden notification data.
- **Consistency Considerations:** UI state might lag slightly until expanded.

#### WebSocket Push Updates / SSE
- **How it improves performance:** Replaces continuous frontend polling. The server actively pushes updates over a single persistent TCP connection.
- **Tradeoffs:** High server memory usage to maintain thousands of open sockets. Load balancers must support sticky sessions or external pub/sub backends.
- **Memory Considerations:** Requires Node.js/Go backend to handle connection state efficiently.
- **Consistency Considerations:** High real-time consistency, eliminating the refresh to see updates problem.

#### CDN/Static Optimization
- **How it improves performance:** Static assets (icons, HTML, CSS for the notification bell) are served from Edge nodes, reducing server load.
- **Tradeoffs:** Less applicable to dynamic JSON notification payloads, which cannot be statically cached globally.
- **Consistency Considerations:** Only useful for the static UI wrapper, not the data itself.

#### Background Synchronization
- **How it improves performance:** Service Workers cache notifications in the browser and sync quietly in the background, minimizing main-thread blocking.
- **Tradeoffs:** Requires HTTPS and complex browser API implementations.
- **Consistency Considerations:** Excellent for offline-first support, but requires robust conflict resolution.

---

## STAGE 5 — Massive Notification Delivery

### 1. The Scenario
50,000 students must receive notifications simultaneously. Current pseudocode is sequential and unreliable.

### 2. Shortcomings of Sequential Architecture
If the backend attempts to loop through 50,000 students (`for student in students: sendEmail(student)`), the process will block the entire server thread. 
- **Partial Failure:** If the loop fails at student #24,000 (e.g., due to an SMTP timeout), the remaining 26,000 students never receive the alert, and it's nearly impossible to know where to resume safely.
- **Decoupling Necessity:** Email delivery relies on 3rd party APIs (SendGrid/AWS SES) which have rate limits and network latency. Database insertions are fast. Tying them together in the same synchronous transaction causes massive bottlenecks.

### 3. Redesigned Event-Driven Architecture
To handle simultaneous mass delivery securely, we must shift to a heavily decoupled, asynchronous architecture using **Message Brokers** (e.g., RabbitMQ, Kafka, or BullMQ).

- **Queues:** Instead of sending the notification directly, the main server pushes a job (e.g., `{ type: 'email', target: 'student@...', message: '...' }`) to a Message Queue. This returns a fast `200 OK` to the administrator.
- **Workers:** Independent background Node.js processes (Workers) consume jobs from the queue at a controlled pace, adhering to API rate limits.
- **Asynchronous Processing:** The main API server is immediately freed up to handle web traffic, while workers tirelessly process emails in the background.
- **Retries & Dead-Letter Queues:** If a worker hits a transient error (e.g., SMTP timeout), the broker automatically retries the job later. If it repeatedly fails, the job is shifted to a **Dead-Letter Queue (DLQ)** for manual engineering review without blocking the pipeline.

### 4. Improved Architecture Pseudocode

```javascript
// --- Producer (Main API Server) ---
async function broadcastNotification(cohortId, message) {
    const students = await db.getStudents(cohortId);
    
    // Decoupled: Push to Queue, do NOT process here
    const jobs = students.map(student => ({
        studentId: student.id,
        email: student.email,
        message: message
    }));
    
    await BullMQ.addBulk('notification-queue', jobs);
    return { success: true, message: "Broadcast queued" };
}

// --- Consumer (Background Worker) ---
BullMQ.process('notification-queue', async (job) => {
    const { studentId, email, message } = job.data;
    
    // Idempotency check: Ensure we haven't already sent this
    if (await Redis.exists(`sent:${job.id}`)) return;
    
    // Perform decoupled operations
    await db.insertNotification(studentId, message);
    await emailProvider.send(email, message);
    
    // Mark as completed
    await Redis.set(`sent:${job.id}`, true, 'EX', 86400); // Expire in 1 day
});
```

### 5. Idempotency & Retry Handling
In distributed architectures, messages might be delivered more than once (At-Least-Once delivery). The worker flow incorporates **Idempotency**—a mechanism (like a unique job hash stored in Redis) ensuring that even if the worker accidentally processes the same job twice due to a network glitch, the student will never receive duplicate emails or database rows.
