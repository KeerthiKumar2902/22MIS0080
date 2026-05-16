# Backend Evaluation

Solution for the backend track assignment.

## Directory Structure
- `logging_middleware/`: Reusable logging package integrated across the application.
- `vehicle_maintenance_scheduler/`: Script to find the optimal set of tasks for depot mechanics (0/1 Knapsack approach).
- `notification_app_be/`: Priority Inbox implementation (Stage 6).
- `notification_system_design.md`: Answers for the theoretical DB and API design stages (Stages 1-5).

## Getting Started
Ensure you have Node.js installed. Create a `.env` file in the root directory and specify any required secrets (e.g. `AUTH_TOKEN`).

```bash
# Install dependencies in individual folders
cd logging_middleware && npm install
cd ../vehicle_maintenance_scheduler && npm install
cd ../notification_app_be && npm install
```
