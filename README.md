# Digital Archive & Records Management System

Full-stack archive system using Spring Boot, React, PostgreSQL, and Keycloak.

## Structure

```text
backend/
├── controller/    REST APIs
├── service/       Documents, workflow, files, and auditing
├── repository/    Database access
├── domain/        JPA entities and enums
├── dto/           API request models
├── db/migration/  Flyway database migrations
├── keycloak/      Realm configuration
└── docker-compose.yml

frontend/src/
├── api/           Authenticated Axios client
├── features/auth/ Authentication client, state, and types
├── components/    Shared layout components
├── layouts/       Application layouts
├── pages/         Route pages
└── routes/        Protected routes
```

## Current status

Implemented:

- Login, logout, token refresh, protected routes, and responsive layout
- Backend CRUD APIs for categories, departments, and users
- Document service, file versions, workflow transitions, and audit writing
- PostgreSQL schema and Flyway migrations

Not implemented:

- Frontend pages are not connected to the backend
- Document CRUD controller
- Read APIs for audit logs and workflow history
- Document notes and dashboard APIs
- Role-based access restrictions and frontend tests

## Run locally

Backend:

```powershell
cd backend
docker compose up -d
$env:DB_PORT = "5533"
$env:FILE_STORAGE_LOCATION = "./storage"
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Keycloak: `http://localhost:8081`

Development users: `admin.user / password123` and `dept.user / password123`.
