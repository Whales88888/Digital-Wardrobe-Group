# Digital Wardrobe Frontend

React, TypeScript and Vite frontend for the existing Express/MariaDB application. Wardrobe records come from the repository's REST API; the UI does not use mock business data.

## Run

Start MariaDB if it is stopped, then run Express from the repository root:

```bash
cp -n .env.example .env
sudo service mariadb start
node backend/server.js
```

For a manual setup, replace the `.env` placeholders with unique local credentials first. A fresh devcontainer generates a random ignored `.env` when none exists. The frontend never receives the database password.

In another terminal:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Vite serves `http://localhost:5173` and proxies `/api` to Express at `http://127.0.0.1:9000`.

## Routes

- Public: `/`, `/about`
- Management: `/app/dashboard`, `/app/wardrobe`, `/app/wardrobe/:id`, `/app/categories`, `/app/outfits`
- Short aliases: `/dashboard`, `/wardrobe`, `/categories`, `/outfits`

## Configuration

The API base defaults to `/api`. Set `VITE_API_URL` in an ignored `frontend/.env` to override it; see `.env.example`. Do not put database credentials in frontend variables.

## Commands

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run preview
```

For deployment, configure a same-origin `/api` reverse proxy to Express. The current Express server does not enable CORS.

## API Coverage and Limitations

- Users: `GET /api/users` supplies existing owner IDs for forms. No authentication API is available.
- Categories: GET, POST, PUT and DELETE.
- Clothing: GET list/detail, POST, PUT and DELETE.
- Outfits: GET list/detail, POST, PUT and DELETE.
- Outfit Items: GET list/detail, POST, PUT and DELETE.

Clothing fields are `name`, `category_id`, `user_id`, `color`, `size` and `image_url`. Season, timestamps, image upload and per-user authorization are not supported by the current schema/API. See the repository root README for the full architecture and acceptance results.

The Express API has no cascade-delete/transaction endpoint. The frontend removes linked Outfit Items before deleting Clothing or Outfit records and attempts to restore links if a later request fails. This multi-request sequence is not atomic; verify relationships after a reported rollback failure.
