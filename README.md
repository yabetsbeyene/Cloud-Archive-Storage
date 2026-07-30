# Digital Archive & Records Management System

Full-stack archive system built with React, Spring Boot, PostgreSQL, and
Keycloak.

## Project structure

```text
frontend/              React + Vite user interface
backend/               Spring Boot API
backend/keycloak/      Production Keycloak image and realm import
render.yaml            Render API, Keycloak, databases, and storage
vercel.json            Vercel frontend build and SPA routing
```

## Run locally

Start PostgreSQL and Keycloak:

```powershell
cd backend
docker compose up -d
```

Start the backend:

```powershell
cd backend
mvn spring-boot:run
```

Start the frontend:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Keycloak: `http://localhost:8081`

The production realm does not contain default application users or committed
passwords. Create users and assign realm roles from the Keycloak admin console.

## Deploy the backend stack to Render

The root `render.yaml` Blueprint creates:

- `digital-archive-keycloak`
- `digital-archive-api`
- `digital-archive-keycloak-db`
- `digital-archive-app-db`
- A persistent disk for uploaded documents

The API uses a paid `starter` web service because Render persistent disks are
not available to free web services. Change the plan or replace filesystem
storage with object storage if needed.

1. Push this repository to GitHub or GitLab.
2. In Render, create a new **Blueprint** from the repository.
3. Render reads `render.yaml`.
4. Enter these prompted values:

```text
KC_BOOTSTRAP_ADMIN_USERNAME=<strong temporary admin username>
KC_BOOTSTRAP_ADMIN_PASSWORD=<strong temporary admin password>
FRONTEND_URL=https://your-project.vercel.app
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
```

`FRONTEND_URL` is used to generate the Keycloak redirect URI and web origin.
`CORS_ALLOWED_ORIGINS` can contain multiple comma-separated origins.

The API database URL, credentials, Keycloak issuer URL, health checks, port,
and persistent storage location are wired automatically by the Blueprint.
Flyway applies the database migrations when the API starts.

## Deploy the frontend to Vercel

1. Import the same repository into Vercel.
2. Leave the project root at the repository root.
3. Vercel reads `vercel.json` and builds the app from `frontend/`.
4. Add these production environment variables:

```text
VITE_API_BASE_URL=https://digital-archive-api.onrender.com/api
VITE_KEYCLOAK_URL=https://digital-archive-keycloak.onrender.com
VITE_KEYCLOAK_REALM=digital-archive
VITE_KEYCLOAK_CLIENT_ID=archive-frontend
```

Use the actual Render hostnames if Render changes either service name. Redeploy
the Vercel project after adding or changing any `VITE_` variable because Vite
embeds them during the build.

If the final Vercel URL differs from the value entered when creating the Render
Blueprint, update `CORS_ALLOWED_ORIGINS` and redeploy the API. Also update the
`archive-frontend` client's **Valid redirect URIs** and **Web origins** in the
Keycloak admin console. Startup realm imports do not overwrite an existing
realm.

## Deployment verification

After all services are live:

1. Open `https://<keycloak-host>/health/ready`.
2. Open `https://<api-host>/actuator/health`.
3. Open the Vercel URL and confirm it redirects to Keycloak.
4. Create an application user in the `digital-archive` realm and assign an
   appropriate role such as `ADMIN`.
5. Sign in and verify API requests from the browser do not show CORS errors.
6. Upload and download a file, then redeploy the API and confirm the file
   remains available.

## Current application scope

Implemented:

- Keycloak login, logout, token refresh, and protected routes
- Category and department management interfaces
- Backend APIs for users, categories, departments, versions, and workflow
- Document service, file storage, auditing, Flyway migrations, and PostgreSQL
- Render and Vercel deployment configuration

Still product work rather than deployment work:

- Document list, upload, detail, version, and workflow user interfaces
- Dashboard statistics
- User-management and audit-log user interfaces
- Read APIs for audit logs and workflow history
- Automated frontend and backend tests
