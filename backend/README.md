# Digital Wardrobe API

NestJS REST API for the Digital Wardrobe full-stack project. See the [root README](../README.md) for the project overview, setup, architecture, database, security, API capabilities, testing, and limitations.

## Requirements and setup

- Node.js 24.9 or newer
- MariaDB initialized with `sql/digital_wardrobe.sql`, or an existing database updated with the migrations under `sql/migrations/`
- `backend/.env`, based on `backend/.env.example`

Required configuration: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and a random `JWT_SECRET` of at least 32 characters. Development uploads use local storage under `backend/uploads` by default. Production image uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Keep secrets out of source control and frontend environment variables.

## Run

From the repository root:

```bash
npm --prefix backend run start:dev
```

The API listens on port `3000` by default. The Vite development server proxies `/api` to this API and removes the `/api` prefix. In VS Code, the `Run Digital Wardrobe` task starts MariaDB, the API, and the frontend.

## API capabilities

- Cookie-based JWT authentication with database-backed, revocable sessions
- bcrypt password hashing, current-user profile, password changes that revoke all sessions, CSRF checks, and role authorization
- Shared categories; category mutations require the `admin` role
- Owner-scoped CRUD for clothing, outfits, outfit items, wear logs, and outfit plans
- Clothing search/filter/sort with pagination; calendar plans are queried by a validated date range
- Per-user dashboard, seasonal outfit recommendations, and clothing-care reminders
- Development-local image storage or production Cloudinary upload for signature-validated JPEG/PNG/WebP files up to 5 MB

Local development images are served from an authenticated, owner-scoped route and stored in `backend/uploads`. Production requires Cloudinary credentials. Compose keeps development uploads in the `wardrobe-image-data` volume; set `NODE_ENV=production` and configure Cloudinary before a production deployment.

## Commands

```bash
npm --prefix backend run lint
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e
npm --prefix backend run build
```

The HTTP integration tests use a fixed test identity and mocked repositories; they do not require MariaDB or replace browser E2E tests. Repository-wide commands are documented in the [root README](../README.md).
