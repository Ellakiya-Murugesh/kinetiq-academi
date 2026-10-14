# Backend deployment and email configuration

## Runtime and deployment shape

The project has a Vite frontend and a separate Express/MongoDB API. Deploy the
frontend build output (`frontend/dist/`) to the frontend host, and run `npm run start:api`
as a persistent Node.js backend service. Building or deploying only the Vite
frontend does not start the API.

- Use Node.js 22.12 or newer in the 22.x line, or Node.js 24.x. Local development
  is pinned by `.nvmrc`; `package.json` declares the supported runtime.
- Frontend build: `npm ci` followed by `npm run build`.
- Backend start: `npm ci` followed by `npm run start:api`.
- Set `PORT` as required by the backend host. The API binds to `0.0.0.0` in
  production.
- The production build uses `VITE_API_BASE_URL=https://kinetiq-academi-api.onrender.com`
  to send API requests to the backend. This is a public build-time URL, not a
  secret. Override it in the frontend host's build environment only when using a
  different backend.
- Set backend `APP_ORIGIN` to
  `https://gentle-caramel-c38a2b.netlify.app` for CORS and `FRONTEND_URL` to
  that same HTTPS origin for email links. The production frontend origin is also
  explicitly allowed by the backend.
- `GET /health` checks MongoDB with a live ping and returns HTTP 200 only when
  the database is reachable; it returns HTTP 503 when MongoDB is unavailable.
  The existing `GET /api/health` path remains available as an alias. The API
  does not serve a page at `/`.

The Render dashboard's production settings are not available in this workspace.
Do not use the sample values below as production settings.

## Backend environment variables

Set these only in the backend's private environment-variable settings and in the
ignored local `.env` file. Never use `VITE_` for credentials.

```dotenv
MONGODB_URI=mongodb+srv://<encoded-user>:<encoded-password>@<atlas-cluster>/<database>?retryWrites=true&w=majority
MONGODB_DB_NAME=<database-name>
JWT_SECRET=<long-random-secret>
PORT=5000
APP_ORIGIN=https://<actual-frontend-domain>
FRONTEND_URL=https://<actual-frontend-domain>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=kinetiqacademi@gmail.com
SMTP_PASS=<google-generated-app-password>
EMAIL_FROM=kinetiqacademi@gmail.com
```

`SMTP_PASS` must be a Google App Password, not the normal account password.
Enable 2-Step Verification on the Google account, then create an App Password
from the account's Security settings. Add it directly to the backend secret
store or local `.env`; do not paste it into chat, source control, logs, or a
frontend setting. Gmail must permit authenticated sending from
`kinetiqacademi@gmail.com`.

MongoDB credentials containing URI-reserved characters must be percent-encoded.
Keep TLS certificate verification enabled. In Atlas Network Access, allow the
backend host's documented outbound IP address or static egress range. Do not
use a broad public allowlist as a permanent workaround.

## Notification behavior

Registration, enrollment, payment submission, payment verification/rejection,
and applicable enrollment status events create MongoDB outbox records in the
same transaction as the underlying database change. The backend worker sends
individual messages to the email address on the student's MongoDB record.
SMTP failures leave the student/payment record intact and the outbox entry
available for retry. Authenticated administrators can test SMTP using their
own registered address and retry failed messages from Payment Management.

The outbox is at-least-once: stable notification IDs and message IDs prevent
ordinary duplicate submissions, but SMTP cannot guarantee exactly-once delivery
if a connection is lost after the provider accepts a message and before the
backend records the acknowledgment.

## Testing after deployment

1. Set all private backend variables, including the Google App Password, the
   actual HTTPS `FRONTEND_URL`, and the Atlas allowlist.
2. Sign in to the admin dashboard and open Payment Management. Use **Test SMTP
   and email my admin account**. It verifies SMTP authentication and queues a
   test message to the authenticated administrator's stored email.
3. Check that address's inbox and spam folder and verify the corresponding
   outbox status is `sent`.
4. In a non-production test environment, register a new test student, create a
   course enrollment, submit its UPI payment notice, and verify/reject it from
   the admin dashboard. Confirm every message is addressed only to the
   corresponding registered student and that refreshing does not create a
   second event.
5. Test failure/retry with an invalid App Password only in a staging
   environment. Restore the valid credential and retry the recorded event.

The project cannot set variables in a hosting provider account from this
workspace. Add them in the backend service's private environment settings, not
in the static frontend deployment.
