# Digital Wardrobe Frontend

React, TypeScript, Vite and React Query frontend for the NestJS/MariaDB application. Sign-up and sign-in use an HttpOnly session cookie; the browser includes it on API requests but JavaScript cannot read it. A shared custom resource hook manages loading, errors, cache and retry behavior.

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

- Public: `/`, `/about`, `/login`, `/register`
- Protected: `/app/dashboard`, `/app/wardrobe`, `/app/wardrobe/:id`, `/app/categories`, `/app/outfits`
- Short aliases: `/dashboard`, `/wardrobe`, `/categories`, `/outfits` (redirect to protected pages)

## Configuration

The API base defaults to `/api`. Set `VITE_API_URL` in an ignored `frontend/.env` to override it; see `.env.example`. Do not put database credentials or JWT secrets in frontend variables.

## Commands

```bash
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run preview
```

For deployment, configure a same-origin `/api` reverse proxy to NestJS and strip the `/api` prefix.

## API Coverage and Limitations

- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/session` and `POST /api/auth/logout`.
- User profile: `GET` and `PATCH /api/user/me`.
- Categories: authenticated GET for all users; POST, PATCH and DELETE require the `admin` role.
- Clothing, outfits and outfit items: authenticated CRUD; clothing and outfits belong to the signed-in user.
- Clothing upload: authenticated Cloudinary upload for JPEG, PNG and WebP, limited to 5 MB.
- Clothing filters/pagination: category, season, type; 24 results per page by default and at most 100 per request.
- Clothing fields: `category_id`, `name`, `color`, `size`, `image_url`, `season` and `clothing_type`.

Deletion relies on database foreign-key cascades. Apply the updated SQL schema to new databases or migrate existing foreign keys before relying on cascade behavior.
