# Smart Canteen

Smart Canteen is a campus food preordering and canteen-management application. Students browse the menu, reserve a pickup slot, place and track orders, and leave feedback. Staff manage kitchen order status and menu availability. Admins manage accounts and view operational and feedback summaries.

## Stack

- Frontend: React 19, TypeScript 6, Vite 8, Tailwind CSS 3, React Router 7, Zustand, Axios
- Backend: Node.js, Express 4, TypeScript, Zod, Prisma, bcryptjs, JWT, Socket.IO
- Database: PostgreSQL 15 (Docker image)
- Tests: Vitest and Supertest (backend); TypeScript and Vite production build (frontend)

## Features by role

- **Student:** browse menu and categories, manage favorites, place cash or mock-online orders, choose a pickup slot, view order history/status, and submit feedback for delivered orders. Student APIs also provide recommendations and chat.
- **Staff:** view kitchen orders, transition orders through `RECEIVED`, `PREPARING`, `READY_TO_PICK`, and `DELIVERED`, verify delivery using an order ID or number, and change menu-item/category availability.
- **Admin:** access staff functions, provision staff/admin accounts, view order and sales analytics, inspect feedback, and retrieve AI-assisted feedback summaries and cooking tips.

## Repository layout

```text
backend/
  prisma/       Prisma schema, migrations, seed, menu catalogue
  scripts/      create-admin and live walkthrough scripts
  src/          Express routes, middleware, services, and configuration
  tests/        Vitest API and service tests
frontend/
  src/          React app, components, pages, API clients, and stores
  scripts/      Frontend build-time asset manifest generator
scripts/        Repository development helpers
```

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- Docker Desktop with Docker Compose, or a PostgreSQL server

## Environment variable names

The checked-in templates are `/.env.example`, `/backend/.env.example`, and `/frontend/.env.example`. Copy the relevant template to `.env` in the same directory, then provide appropriate local values. Do not commit `.env` files.

- Root/Docker template: `POSTGRES_PASSWORD`, `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL`
- Backend template: `PORT`, `NODE_ENV`, `CLIENT_URL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GEMINI_API_KEY`, `AI_PROVIDER`, `GEMINI_MODEL`, `DEMO_PASSWORD`, `MENU_TIME_WINDOWS`, `PICKUP_SLOT_STRICT`
- Frontend template: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_APP_NAME`
- Optional walkthrough override: `API_BASE_URL`

The backend reads its variables through the Zod-validated backend configuration. `AI_PROVIDER` accepts `mock` or `gemini`; Gemini features require `GEMINI_API_KEY` and `GEMINI_MODEL`. The frontend uses `VITE_API_URL` and `VITE_SOCKET_URL` for API and Socket.IO connections.

## Local setup

1. Install dependencies:

   ```sh
   cd backend
   npm ci
   cd ../frontend
   npm ci
   ```

2. Configure the root and backend environment files using the templates. The root Compose configuration reads its PostgreSQL and Docker service settings from the root `.env`; the local backend reads `backend/.env`.

3. Start PostgreSQL with Docker Compose:

   ```sh
   docker compose up -d postgres
   ```

   The container is published on `localhost:5433` and uses PostgreSQL's default container port `5432`. Set the backend `DATABASE_URL` to connect to the published host port.

4. Create/update the database and seed the demo menu and accounts:

   ```sh
   cd backend
   npx prisma generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

   Seeding is for non-production environments and requires `DEMO_PASSWORD`.

5. In separate terminals, start the backend and frontend:

   ```sh
   cd backend
   npm run dev
   ```

   ```sh
   cd frontend
   npm run dev
   ```

## Demo accounts

The seed creates `student@demo.com`, `staff@demo.com`, and `admin@demo.com` with their corresponding roles. All seeded accounts use the value configured by `DEMO_PASSWORD`; no fixed password is documented here.

## Operational scripts

Create an initial production admin or staff account with the backend TypeScript runner. Supply only name, email, and role as command-line arguments; the script prompts for a hidden password unless `ADMIN_PASSWORD` is set in the environment. Passwords must contain 12–72 characters. The script refuses duplicate email addresses.

```sh
cd backend
npm run create-admin -- "Campus Admin" admin@example.edu ADMIN
```

Run the live walkthrough only while the backend and database are already running and the demo staff/admin accounts exist. It uses the real HTTP API and database, creates a unique throwaway student and order, prompts for the order ID before delivery, and uses `DEMO_PASSWORD` or a hidden prompt for demo logins. It does not remove the throwaway data.

```sh
cd backend
npm run walkthrough
```

## Tests and builds

```sh
cd backend
npx tsc --noEmit
npm test
```

```sh
cd frontend
npm run build
```

`npm run build` in the backend generates the Prisma client and compiles TypeScript. In production, `npm start` runs `prisma migrate deploy` before starting the compiled server.
