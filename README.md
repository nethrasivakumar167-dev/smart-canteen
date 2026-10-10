# 🍽️ SMART CANTEEN — Full-Stack Preorder & Management Platform

> **"Skip the Queue. Eat Smarter."**  
> A high-performance, real-time campus canteen preordering, smart queue dispatch, and kitchen management platform.

---

## 🌟 Overview & Architecture

Smart Canteen is engineered as a production-grade multi-role SaaS platform specifically designed for educational institutions, colleges, and enterprise food courts. It eliminates congestion during peak lunch and breakfast hours through real-time queue calculation, scheduled pre-ordering, digital pickup verification, dynamic wait time estimation, and staff kitchen management.

```
┌─────────────────────────────────────────────────────────┐
│                    SMART CANTEEN                        │
│          Students • Faculty • Visitors • Staff          │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
          REST API (Axios)            Socket.IO
                │                         │
┌───────────────▼─────────────────────────▼───────────────┐
│                  EXPRESS.JS BACKEND                     │
│    JWT Auth • RBAC • Order Engine • Socket Broadcast    │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
       Prisma ORM (PostgreSQL)       AI Feedback Adapter
                │                         │
┌───────────────▼─────────────┐   ┌───────▼───────────────┐
│     PostgreSQL Database     │   │  Optional AI Provider │
│  Users, Orders, Items, etc. │   │ (Gemini / Mock)       │
└─────────────────────────────┘   └───────────────────────┘
```

---

## 🚀 Key Features

* **Real-Time Preordering & Order Flow**:
  - Student order creation inside Prisma transaction.
  - Server-side validation of item & category availability.
  - Unique order IDs (`SC-XXXXXX`).
  - Cash & mock payment integration.
* **Server-Enforced Order Lifecycle**:
  - `RECEIVED` → `PREPARING` → `READY_TO_PICK` → `DELIVERED`.
  - Server-side delivery verification requiring `READY_TO_PICK` status before marking `DELIVERED`.
* **Real-Time WebSockets**:
  - Authenticated Socket.IO with JWT verification and user/role rooms (`user:id`, `role:STAFF`, `role:ADMIN`).
  - Real-time event broadcasting (`order-created`, `order-status-updated`, `availability-updated`).
* **Role-Based Access Control (RBAC)**:
  - `STUDENT`: Browse menu, cart management, order creation, order tracking, rating/feedback submission for delivered orders.
  - `STAFF`: Kitchen Display System (KDS), menu item/category availability toggles, delivery verification.
  - `ADMIN`: User provisioning, master order logs, PostgreSQL analytics (revenue, order counts, status breakdown, top items), optional failure-safe AI feedback summary.
* **Failure-Safe AI Integration**:
  - Optional AI feedback summary adapter (`GeminiAIFeedbackProvider` / `MockAIFeedbackProvider`).
  - Environment-driven configuration (`AI_PROVIDER`, `GEMINI_API_KEY`). Safe fallback when API key is unconfigured or call fails.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, TypeScript 6, Tailwind CSS 3, React Router 7, Zustand, Axios, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod, JWT, bcryptjs, Socket.IO, Helmet, Morgan, Vitest, Supertest |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Design & Styling** | Custom Design System, HSL Color Palette, Modern Typography, Responsive Mobile-First Layout |

---

## 📋 API Overview

### Public & Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Public student registration
- `POST /api/auth/login` — Universal login (supports portal parameter)
- `POST /api/auth/student/login` — Student portal login
- `POST /api/auth/staff/login` — Staff portal login
- `POST /api/auth/admin/login` — Admin portal login
- `POST /api/auth/logout` — Client sign-out acknowledgement; bearer JWTs remain valid until expiry

### Public Menu Routes (`/api`)
- `GET /api/categories` — List available categories
- `GET /api/menu` — Search & list available menu items
- `GET /api/menu/:id` — Get menu item details

### Student Routes (`/api/student`) — *Requires STUDENT Role (admins may access order endpoints)*
- `POST /api/student/orders` — Create preorder inside Prisma transaction
- `GET /api/student/orders` — Get student order history
- `GET /api/student/orders/:id` — Get specific order details
- `POST /api/student/orders/:id/feedback` — Submit rating and comment for completed (`DELIVERED`) order

### Staff Routes (`/api/staff`) — *Requires STAFF or ADMIN Role*
- `GET /api/staff/orders` — Get active kitchen orders
- `PATCH /api/staff/orders/:id/status` — Enforce order status transition (`RECEIVED` → `PREPARING` → `READY_TO_PICK` → `DELIVERED`)
- `POST /api/staff/verify-delivery` — Verify an `orderNumber` or `id` and mark the order delivered
- `GET /api/staff/menu-status` — Get menu item availability
- `PATCH /api/staff/menu-status/:id` — Toggle item availability
- `PATCH /api/staff/categories/:id/availability` — Toggle category availability

### Admin Routes (`/api/admin`) — *Requires ADMIN Role*
- `GET /api/admin/overview-stats` — PostgreSQL analytics (revenue, order status breakdown, top items)
- `GET /api/admin/users` — User directory
- `POST /api/admin/users` — Provision staff or admin user account
- `GET /api/admin/orders` — Master transaction ledger
- `GET /api/admin/feedback` — List student order ratings & reviews
- `GET /api/admin/feedback/summary` — Get a daily cached feedback summary; `?refresh=true` requests a rate-limited refresh
- `POST /api/admin/cooking-tips/recompute` — Recompute staff cooking tips from recent per-item feedback

---

## 🔑 Environment Variables (Names Only)

### Backend Environment Variables (`backend/.env`)
- `NODE_ENV` (e.g. `development`, `test`, `production`)
- `PORT` (e.g. `5000`)
- `CLIENT_URL` (e.g. `http://localhost:5173`)
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (Minimum 32 characters long)
- `JWT_EXPIRES_IN` (e.g. `7d`)
- `AI_PROVIDER` (`mock` or `gemini`)
- `GEMINI_API_KEY` (Optional Gemini API key)
- `DEMO_PASSWORD` (Required only when running the non-production database seed)

### Frontend Environment Variables (`frontend/.env`)
- `VITE_API_URL` (Backend HTTP API origin)
- `VITE_SOCKET_URL` (Backend Socket.IO origin)

---

## ⚙️ Local Setup & Database Initialization

### 1. Prerequisites
- Node.js (v20.19+ or v22.12+)
- npm (v9+)
- PostgreSQL (v14+) running locally or via Docker

### 2. Database Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Start Backend Development Server
```bash
cd backend
npm run dev
```
Backend server runs on `http://localhost:5000`

### 4. Start Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Frontend client runs on `http://localhost:5173`

---

## 🧪 Running Tests & Build Verification

```bash
# Run backend Vitest test suites (61 tests)
cd backend
npm test

# Run frontend TypeScript typecheck & production build
cd frontend
npm run build
```

---

## 🚢 Production Deployment Steps

1. **Database Migration**:
   Run `npx prisma migrate deploy` against the target production PostgreSQL instance.
2. **Environment Variables**:
   Set all required backend environment variables (`NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET` >= 32 chars, `CLIENT_URL`). Set `VITE_API_URL` to the publicly reachable backend API origin before building the frontend image.
3. **Backend Production Start**:
   Compile backend using `npm run build` and run `npm start`; the start script runs `prisma migrate deploy` before starting the server. The Docker image uses this same start script.
4. **Frontend Static Production Build**:
   Build the frontend bundle using `npm run build` inside `frontend/` and serve static assets via Nginx or CDN. Ensure CORS `CLIENT_URL` matches the frontend domain.