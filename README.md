# Digital Archive & Records Management System

Full-stack archive system built with React, Spring Boot, PostgreSQL, and
Keycloak.

## Local deployment

The complete application runs locally with Docker Compose:

- React frontend served by Nginx
- Spring Boot API
- Keycloak
- Application PostgreSQL database
- Keycloak PostgreSQL database
- Persistent Docker volumes for databases and uploaded documents

### Requirements

- Docker Desktop
- At least 4 GB of memory available to Docker

### Start everything

From the repository root:

```powershell
docker compose up --build -d
```

The first build can take several minutes because Docker downloads the Java,
Node, Nginx, Keycloak, and PostgreSQL images.

Open the complete stack through one address:

- Application: `http://localhost:5173`
- API health: `http://localhost:5173/actuator/health`
- Keycloak: `http://localhost:5173/auth`
- Keycloak readiness: `http://localhost:5173/auth/health/ready`

### Initial Keycloak administration

Open `http://localhost:5173/auth/admin` and sign in with:

```text
Username: admin
Password: admin
```

These credentials are for local development only.

The `digital-archive` realm and `archive-frontend` client are imported
automatically. Two local development users are included:

```text
admin.user / password123
dept.user / password123
```

They have the `ADMIN` and `DEPT_USER` roles respectively. You can also create
users in the `digital-archive` realm and assign one or more roles:

- `ADMIN`
- `ARCHIVIST`
- `MANAGER`
- `DEPT_USER`
- `VIEWER`

### Check status and logs

```powershell
docker compose ps
docker compose logs -f keycloak
docker compose logs -f backend
```

### Stop the application

```powershell
docker compose down
```

Data remains in Docker volumes after stopping.

To completely reset all local databases, users, and uploaded files:

```powershell
docker compose down -v
```

The reset command permanently deletes the local Docker volumes.

## Local ports

| Component | Host port |
|---|---:|
| Frontend | 5173 |
| Application PostgreSQL | 5533 |

The API, Keycloak, and Keycloak PostgreSQL database are intentionally available
only through the internal Docker network. Nginx exposes the UI, API, and
authentication server together on port `5173`.

## Development without containerizing the frontend

You can still run the frontend development server:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Start only the supporting services with:

```powershell
docker compose up -d postgres-app postgres-keycloak keycloak
```

Then run the backend with Maven using the application database on port `5533`.
