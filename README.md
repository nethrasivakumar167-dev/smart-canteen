# 🍽️ SMART CANTEEN — Full-Stack Preorder & Management Platform

> **"Skip the Queue. Eat Smarter."**  
> A high-performance, real-time campus canteen preordering, smart queue dispatch, and kitchen management platform.

---

## 🌟 Overview & Architecture

Smart Canteen is engineered as a production-grade multi-role SaaS platform specifically designed for educational institutions, colleges, and enterprise food courts. It eliminates congestion during peak lunch and breakfast hours through real-time queue calculation, scheduled pre-ordering, digital QR pickup verification, dynamic wait time estimation, inventory recipe linkage, and smart recommendations.

```
┌─────────────────────────────────────────────────────────┐
│                    SMART CANTEEN                        │
│          Students • Faculty • Visitors • Staff          │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
         REST API (Axios)             WebSockets
                │                         │
┌───────────────▼─────────────────────────▼───────────────┐
│                  EXPRESS.JS BACKEND                     │
│    JWT Auth • RBAC • Order Engine • Inventory Recipes   │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
       Prisma ORM (PostgreSQL)       AI Service Adapter
                │                         │
┌───────────────▼─────────────┐   ┌───────▼───────────────┐
│     PostgreSQL Database     │   │ LLM / Natural Search  │
│  Users, Orders, Items, etc. │   │ Recommendations Engine│
└─────────────────────────────┘   └───────────────────────┘
```

---

## 🚀 Key Features

* **Real-Time Preordering & Smart Queue**: Estimated preparation calculation, live queue rank (`#4 in kitchen queue`), and estimated ready timestamps.
* **Instant Digital QR Pickup Pass**: Secure server-validated QR tokens for counterfeit-proof order handover.
* **Role-Based Access Control (RBAC)**:
  * `STUDENT` & `FACULTY`: Pre-order, dietary filter, favorites, wallet/points loyalty, order history, review system.
  * `VISITOR / GUEST`: Instant phone/name guest checkout mode without institutional credentials.
  * `STAFF`: Touch-optimized Kitchen Display System (KDS) with `NEW`, `PREPARING`, `READY`, and `COMPLETED` swimlanes.
  * `ADMIN`: Revenue analytics, hourly peak demand heatmap, item pricing/availability toggle, user audits.
* **Inventory & Recipe Deductions**: Automatic ingredient depletion based on order items.
* **AI Food Assistant & Natural Query**: Intelligent meal suggestions based on budget, preparation speed, and dietary preferences.
* **Dark / Light Theme & Tamil Localization Ready**: Designed with modern typography, glassmorphism, responsive mobile-first UI.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Zustand, Axios, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod, JWT, bcryptjs, Socket.IO, Helmet, Morgan |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Styling & Design** | Custom Design System, Plus Jakarta Sans & Outfit Fonts, Dark Mode |
| **DevOps & Tooling** | Docker, Docker Compose, TypeScript strict mode |

---

## 👥 Demo Accounts

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Student** | `student@demo.com` | `password123` | Preorder, Favorites, Cart, Live Queue |
| **Faculty** | `faculty@demo.com` | `password123` | Preorder, Priority Slots, Loyalty |
| **Staff** | `staff@demo.com` | `password123` | Kitchen Display System, QR Scanner |
| **Admin** | `admin@demo.com` | `password123` | Master Analytics, Menu & Inventory Control |

---

## 🏃 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v20+)
- npm (v10+)
- PostgreSQL (v15+) or Docker

### 2. Using Docker Compose (Recommended)
```bash
# Copy environment template and fill in secrets
cp .env.example .env
# Edit .env with secure values (generate with: openssl rand -hex 32)

# Start all services
docker compose up -d

# Run database migrations and seed
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Services will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Health Check: `http://localhost:5000/api/health`

### 3. Manual Setup (Without Docker)

#### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, QR_SECRET (min 32 chars, no placeholders)
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```
Runs at: `http://localhost:5000`

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs at: `http://localhost:5173`

---

## 📂 Project Structure

```text
App/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/   # UI components, cards, navbar, modals
│   │   ├── layouts/      # MainLayout, AuthLayout, DashboardLayout
│   │   ├── pages/        # Home, Menu, FoodDetails, Cart, Auth
│   │   ├── store/        # Zustand state stores (cart, auth, theme)
│   │   ├── services/     # Axios API service instances
│   │   ├── types/        # TypeScript models and DTO interfaces
│   │   └── utils/        # Price helpers, time formatters
│   ├── nginx.conf        # Nginx config for production (SPA fallback)
│   ├── index.html
│   └── package.json
├── backend/              # Node.js + Express + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma # PostgreSQL relational data model
│   │   └── seed.ts       # Database seeder with Indian canteen menu
│   ├── src/
│   │   ├── config/       # Environment validation (Zod)
│   │   ├── middleware/   # JWT auth, RBAC, error handlers
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Business logic & AI adapters
│   │   ├── tests/        # Vitest + Supertest integration tests
│   │   ├── app.ts        # Express app factory
│   │   ├── server.ts     # HTTP server + Socket.IO bootstrap
│   │   └── socket.ts     # Socket.IO initialization
│   └── package.json
├── docker-compose.yml    # Containerized environment (uses root .env)
├── .env.example          # Root environment template
├── backend/.env.example  # Backend environment template
└── README.md
```

---

## 🛣️ Development Roadmap

- [x] **Phase 1**: Architecture, monorepo foundation, Prisma models, core UI design system & routes (`/`, `/menu`, `/menu/:id`, `/cart`, `/login`, `/register`).
- [x] **Phase 2**: Real JWT Authentication, PostgreSQL seed data & Prisma migration, Protected routes, Rate limiting, Docker foundation.
- [ ] **Phase 3**: End-to-end Preorder engine, Checkout, dynamic wait time estimation, QR generation.
- [ ] **Phase 4**: Staff Kitchen Display System (KDS) & Live Queue tracking.
- [ ] **Phase 5**: Inventory management, automatic recipe stock depletion, waste tracking.
- [ ] **Phase 6**: Admin Analytics Dashboard, peak-hour heatmap, menu management.
- [ ] **Phase 7**: QR pickup scanner, reviews & ratings, loyalty points, coupons.
- [ ] **Phase 8**: AI Food Assistant & natural language menu query engine.
- [ ] **Phase 9**: PWA configuration, dark mode refinement, bilingual Tamil support.
- [ ] **Phase 10**: E2E validation, Docker integration, production hardening.