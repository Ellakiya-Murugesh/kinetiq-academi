# Kinetiq Academi

Existing React/Vite and Express/MongoDB applications organized as npm workspaces.
The shared brand module remains in `shared/` because both applications import it.

## Project layout

- `frontend/` - React application, Vite, public assets, and frontend configuration.
- `backend/` - Express API, MongoDB access, routes, middleware, scripts, and tests.
- `shared/` - small modules intentionally shared by the frontend and backend.
- `package.json` and `package-lock.json` - root npm workspace and deployment entry points.

## Local development

Use Node.js 22.12+ in the 22.x line or Node.js 24.x. Install dependencies from
the repository root:

```sh
npm ci
```
Copy `frontend/.env.example` to `frontend/.env` and set
`VITE_API_BASE_URL` if the frontend should call a remote API. When developing
against the local API, leave it blank or unset; Vite proxies `/api` to
`http://127.0.0.1:5000`.

Configure backend variables from `backend/.env.example` in the ignored
repository-root `.env` file. Verify the MongoDB database and cluster target
before starting the API: database startup initializes indexes and may update
schema metadata. Never copy production credentials into frontend environment
files or commit real `.env` values.

```sh
npm run dev
```

This starts the frontend at `http://127.0.0.1:5173` and the API on the configured
`PORT` (default `5000`). The backend reads local variables from the repository
root `.env`; the backend package can also be started from its workspace through
the root command `npm run start:api`.

## Build and tests

```sh
npm run build
npm test
```

The frontend build writes `frontend/dist/`. Backend tests use mocked/in-memory
fixtures where configured and do not provision users or connect to production.
Live MongoDB, SMTP, and authenticated end-to-end checks require their respective
private test services and credentials.

The existing local-data migration utility is available as
`npm run migrate:local-data-to-mongodb`. It writes to the MongoDB target from
the repository-root `.env`; verify that target before running it. Do not point
it at production unless you intentionally mean to migrate records there.

## Deployment

Keep the repository root as the Netlify and Render repository root so the
workspace lockfile and root commands are available.

- **Netlify:** build command `npm run build`; publish directory
  `frontend/dist`. Set `VITE_API_BASE_URL` to the deployed Render API origin at
  build time.
- **Render:** build command `npm ci`; start command `npm run start:api`.
  Configure MongoDB, JWT, CORS, SMTP, and other backend variables in Render's
  private environment settings. Keep existing production values and secrets
  unchanged when updating the service configuration.

The backend listens on `PORT` and binds to `0.0.0.0`. The Vercel configuration,
if used, is in `frontend/vercel.json`.

## Rollback

Before deployment, review `git status` and commit the completed refactor as one
change. If rollback is needed after that commit, use `git revert <refactor-commit>`
to produce a reversible rollback commit. This preserves history and avoids
discarding unrelated work. Restore the corresponding prior Netlify and Render
root/build/start settings if they were changed in the hosting dashboards.
