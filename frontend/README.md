# Digital Wardrobe Frontend

React 19, TypeScript, Vite and TanStack React Query frontend for the NestJS/MariaDB application. Authentication uses an HttpOnly session cookie; the browser sends it with API requests, but JavaScript cannot read it. The shared resource hook manages loading, errors, cache and retry behavior.

## Run

Use Node.js 24.9 or later. Initialize MariaDB with `sql/digital_wardrobe.sql`, configure `backend/.env` from `backend/.env.example`, and start the backend:

```bash
npm --prefix backend install
npm --prefix backend run start:dev
```

In another terminal, start the frontend:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Vite serves `http://localhost:5173` and proxies `/api` to NestJS at `http://127.0.0.1:3000`, removing the `/api` prefix.

## Routes

- Public: `/`, `/about`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected: `/app/dashboard`, `/app/wardrobe`, `/app/wardrobe/:id`, `/app/categories`, `/app/outfits`, `/app/planner`, `/app/profile`, `/app/admin/users` (admin only)
- Legacy redirects: `/dashboard`, `/wardrobe`, `/wardrobe/:id`, `/categories`, `/outfits`

## Configuration

The API base defaults to `/api`. Set `VITE_API_URL` in an ignored `frontend/.env` to override it; see `.env.example`. Do not put database credentials or JWT secrets in frontend variables.

## Commands

```bash
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run preview
npm --prefix frontend run test:e2e
```

For deployment, configure a same-origin `/api` reverse proxy to NestJS and strip the `/api` prefix. Production must use HTTPS so the session cookie's `Secure` flag works.

## API coverage and limitations

- Authentication: registration, login, session check, logout, password change and password-reset request/confirmation (`/api/auth/*`).
- Profile and administration: read/update the current user (`/api/user/me`); paginated user listing, role changes and account deletion require admin access (`/api/user/admin/*`).
- Categories: authenticated reads; create, update and delete require the `admin` role.
- Wardrobe: owner-scoped CRUD for clothing, outfits and outfit items.
- Images: authenticated JPEG, PNG and WebP upload, up to 5 MB. Development stores images locally; production can use authenticated Cloudinary storage when configured. Reads are served through owner-checked API routes.
- Activity: dashboard, personal recommendations, wear logs, outfit plans and clothing-care updates (`/api/activity/*`).
- Clothing search and pagination: filter by category, season and type; search name, color and size; 24 results per page by default and at most 100 per request.

Recommendations use explicit rules, not AI/ML. Calendar and care reminders are shown in the application; push/email reminders and external calendar synchronization are not implemented.

See the [root README](../README.md) for the complete API table, setup, security notes, database migrations, test-environment safety and known limitations.
