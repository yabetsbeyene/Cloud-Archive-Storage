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
├── api/           Authenticated Axios client + resource API modules
├── features/auth/ Authentication client, state, and types
├── components/    Shared layout and UI components
├── layouts/       Application layouts
├── pages/         Route pages
├── routes/        Protected routes
└── types/         Domain types matching backend DTOs

netlify.toml       Netlify build config (monorepo-aware) + SPA redirect rule
```

## Run locally

Backend:

```powershell
cd backend
docker compose up -d
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

## Deploying the frontend to Netlify

**The frontend cannot function in production until the backend and Keycloak
are also deployed somewhere publicly reachable over HTTPS.** Deploying only
the frontend gives you a working *page*, but login and all data calls will
fail until the steps below are done.

### 1. Repo structure Netlify needs to understand
This is a monorepo — the actual frontend app lives in `frontend/`, not the
repo root. `netlify.toml` (already included, at the repo root) tells Netlify:
- `base = "frontend"` — build from this subfolder
- `command = "npm run build"`
- `publish = "dist"`
- a catch-all redirect so client-side routes (`/documents`, `/categories`,
  etc.) don't 404 on refresh or direct visit — required for any React Router
  app deployed as a static site

If you're setting this up in Netlify's UI instead of relying on
`netlify.toml`, set **Base directory** to `frontend`, **Build command** to
`npm run build`, **Publish directory** to `frontend/dist`.

### 2. Environment variables — set these in Netlify's dashboard, not in a committed `.env`
Site settings → Environment variables:
```
VITE_API_BASE_URL=https://your-deployed-backend.example.com/api
VITE_KEYCLOAK_URL=https://your-deployed-keycloak.example.com
VITE_KEYCLOAK_REALM=digital-archive
VITE_KEYCLOAK_CLIENT_ID=archive-frontend
```
`.env` is gitignored on purpose — never commit real deployment URLs or
secrets. `.env.example` documents the shape only.

### 3. Backend CORS must allow your Netlify domain
`SecurityConfig.java` reads allowed origins from `app.cors.allowed-origins`
(env var `CORS_ALLOWED_ORIGINS`), comma-separated. On your backend host, set:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-app.netlify.app
```
Without this, the browser blocks every API call from the deployed frontend
even though the backend itself is running fine — CORS is enforced client-side
by the browser, so `curl`/Postman tests won't reveal this problem.

### 4. Keycloak client config must allow your Netlify domain
In the Keycloak admin console, on the `archive-frontend` client:
- **Valid redirect URIs**: add `https://your-app.netlify.app/*`
- **Web origins**: add `https://your-app.netlify.app`

Without this, Keycloak will refuse to redirect back to your deployed site
after login.

## Current status

Implemented:

- Login, logout, token refresh, protected routes, responsive layout
- Backend CRUD APIs for categories, departments, users, and documents
- File versions (upload/download), workflow transitions, audit writing
- PostgreSQL schema and Flyway migrations
- Frontend: Categories and Departments pages fully wired to the backend
  (TanStack Query, forms, validation, create/edit/delete)

Not yet implemented:

- Documents, versions, and workflow pages (backend APIs exist, frontend UI
  doesn't yet)
- Read APIs for audit logs and workflow history
- Document notes and dashboard statistics APIs
- Frontend tests
