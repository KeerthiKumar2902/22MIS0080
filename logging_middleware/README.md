# Logging Middleware

Reusable centralized logging middleware.

## Usage

```javascript
const { Log } = require('./logger');

async function doWork() {
    const response = await Log("backend", "info", "service", "Fetching data");
    if (!response.success) {
        console.error("Failed to log:", response.error);
    }
}
```

## Environment Variables

Ensure these are set in your `.env` file or environment:

```env
AUTH_TOKEN=your_auth_token_here
EVALUATION_SERVICE_URL=http://4.224.186.213/evaluation-service
```

## Supported Values

- **Stacks**: `backend`, `frontend`
- **Levels**: `debug`, `info`, `warn`, `error`, `fatal`
- **Packages**:
  - Backend: `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`
  - Frontend: `api`, `component`, `hook`, `page`, `state`, `style`
  - Common: `auth`, `config`, `middleware`, `utils`
