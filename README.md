# Digital Archive

A full-stack document and records management system built with React, Spring
Boot, PostgreSQL, and Keycloak.

## What is implemented

- Keycloak login and role-based access control
- Role-specific dashboards and review queues
- Document creation, search, filtering, editing, and soft deletion
- File version upload and secure download
- Document workflow and history:
  `SUBMITTED → UNDER_REVIEW → APPROVED → ARCHIVED`
- Administrator-created documents are archived automatically
- Category and department management restricted to administrators
- User creation, role assignment, department assignment, and deactivation
- Automatic account invitation emails with expiring password-setup links
- Simple secure password policy: 8+ characters with uppercase, lowercase, and a number
- Authorized in-app previews for PDF, image, and plain-text document versions
- Administrator account deactivation and permanent personal-data deletion
- Automatic synchronization between Keycloak and application users
- Uploader name, email, and department snapshots on documents
- Document notes, workflow-history, audit-log, and dashboard APIs
- Audit log with actor, department, resource, category, action, and details
- Per-account light, dark, and system theme preferences
- Optional per-user profile pictures with validated upload, initials fallback,
  replacement, and removal
- Interactive account menu with profile details and secure sign-out
- Account profile and password settings
- Database migrations, transaction boundaries, DTO responses, and consistent
  API errors

## Technology

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, TanStack Query
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA
- Authentication: Keycloak
- Databases: PostgreSQL 16
- Local deployment: Docker Compose and Nginx

## Run locally

Requirements:

- Docker Desktop
- At least 4 GB of memory available to Docker

From the project root, run:

```powershell
docker compose up -d --build
```

The first build may take several minutes. Open the complete application at:

```text
http://localhost:5173
```

The frontend, backend API, and Keycloak are all available through this address.

## Demo accounts


These credentials are for local development only.

## User invitation email

When an administrator creates a user, the system:

1. Creates the Keycloak account and archive profile.
2. Assigns the selected role and department.
3. Creates no administrator-visible password.
4. Emails a signed, expiring Keycloak link for email verification and private
   password setup.

The invitation includes the username, role, and department. It intentionally
contains no password; only the user sets their private password.

Audit history records important document and account events only, including
document creation, upload, view, download, workflow submission/review,
approval, rejection, archival, and administrator user creation/deletion.
Entries older than seven days are removed automatically.

Local emails are captured by Mailpit:

```text
http://localhost:8025
```

Mailpit does not forward messages to real inboxes. To enable real delivery,
copy `.env.example` to `.env`, replace the SMTP values with credentials from
your email provider, and recreate Keycloak:

```powershell
Copy-Item .env.example .env
docker compose up -d --build --force-recreate keycloak
```

Keycloak synchronizes these SMTP values into the existing realm at every
startup, so changing providers does not require deleting users or realm data.
Use an app-specific SMTP password when your provider supports one, and never
commit `.env`.

 
Non-administrator documents are submitted for review automatically.
Administrators can start review, managers can approve or reject, and
administrators or archivists can archive approved documents.

## Useful commands

```powershell
# Show running services
docker compose ps

# Follow backend logs
docker compose logs -f backend

# Follow Keycloak logs
docker compose logs -f keycloak

# Stop the application while keeping its data
docker compose down
```

To permanently delete the local databases, users, and uploaded files:

```powershell
docker compose down -v
```

Use the last command carefully because Docker volumes cannot be recovered after
they are removed.

## Data storage

PostgreSQL data and uploaded files are stored in persistent Docker volumes.
Uploaded document versions are stored in:

```text
Container path: /app/storage
Docker volume: insaprojectcleaned_archive_file_storage
```

Archiving changes the document status and archive timestamp. It does not move or
delete the uploaded file.

## Project structure

```text
.
├── backend/
│   ├── keycloak/       Keycloak image and realm configuration
│   └── src/            Spring Boot source and database migrations
├── frontend/
│   ├── public/         Static authentication files
│   └── src/            React application
└── docker-compose.yml  Complete local stack
```

## Local services

| Service | Address |
|---|---|
| Application | `http://localhost:5173` |
| Backend health | `http://localhost:5173/actuator/health` |
| Keycloak | `http://localhost:5173/auth` |
| Local email inbox | `http://localhost:8025` |
| Application PostgreSQL | `localhost:5533` |

The backend and Keycloak databases are not intended to be exposed publicly.
