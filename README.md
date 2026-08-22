# Digital Archive

Digital Archive is a full-stack records management system for controlled
document storage, review, approval, archiving, and audit history.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS
- Spring Boot 3, Java 21, Spring Security, Spring Data JPA
- Keycloak for authentication and role management
- PostgreSQL for application and Keycloak data
- Docker Compose for local full-stack execution

## Main Features

- Keycloak login with role-based access
- Role-aware dashboards and review queues
- Document creation, filtering, preview, upload, download, and soft delete
- Workflow states: `SUBMITTED -> UNDER_REVIEW -> APPROVED -> ARCHIVED`
- Admin-created documents archive automatically
- User invitation emails with secure password setup links
- Password policy: 8+ characters with uppercase, lowercase, and a number
- Department, category, note, workflow-history, audit-log, and dashboard APIs
- Seven-day audit retention for key actions only
- Per-account theme preference and profile picture support

## Local Setup

Create `.env` from `.env.example`, then replace every required secret value.
The real `.env` file is ignored by Git.

```powershell
docker compose up -d --build
```

Open the application at:

```text
http://localhost:5173
```

Local Mailpit inbox:

```text
http://localhost:8025
```

## Environment

Important variables:

- `APP_PUBLIC_URL`: public frontend URL, for example `http://localhost:5173`
- `DB_PASSWORD`: application database password
- `KEYCLOAK_DB_PASSWORD`: Keycloak database password
- `KEYCLOAK_ADMIN_PASSWORD`: Keycloak bootstrap admin password
- `KEYCLOAK_ADMIN_CLIENT_SECRET`: backend service-account client secret
- `SMTP_*`: invitation email provider settings

Do not commit `.env`, SMTP passwords, database passwords, app passwords, or
personal admin credentials.

## Deployment Notes

The backend and Keycloak images each include a `deployment-entrypoint.sh`.
These files are required:

- `backend/deployment-entrypoint.sh` adapts hosted database and Keycloak URL
  variables before Spring Boot starts.
- `backend/keycloak/deployment-entrypoint.sh` prepares the realm import and
  keeps SMTP and password policy settings synchronized on restart.

Removing these scripts can break hosted deployment and email invitation setup.

For hosted deployments, set `APP_PUBLIC_URL` to the real frontend URL and set
the matching backend, Keycloak, database, and SMTP secrets in the provider's
environment settings.

## Useful Commands

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f keycloak
docker compose down
```

To remove local Docker volumes:

```powershell
docker compose down -v
```

That deletes local databases and uploaded files.

## Project Structure

```text
.
|-- backend/
|   |-- keycloak/      Keycloak image, realm, and email theme
|   |-- src/           Spring Boot source and Flyway migrations
|   |-- Dockerfile
|   `-- deployment-entrypoint.sh
|-- frontend/
|   |-- public/        Static files, favicon, and Keycloak SSO helper
|   |-- src/           React application
|   `-- Dockerfile
|-- .env.example
|-- .gitignore
`-- docker-compose.yml
```
