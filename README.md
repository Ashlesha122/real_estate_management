# EstateFlow — Real Estate Management Platform

> Modern, full-stack real estate platform connecting property seekers directly with owners and licensed brokers with zero brokerage options, transparent listings, and automated visit scheduling.

---

## 📑 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Listing Status State Machine](#listing-status-state-machine)
6. [Local Environment & Database Setup](#local-environment--database-setup)
   - [Option A: Direct Windows PostgreSQL + PostGIS (Recommended without Docker)](#option-a-direct-windows-postgresql--postgis-recommended-without-docker)
   - [Option B: Docker Compose](#option-b-docker-compose)
7. [Running Migrations & Seeds](#running-migrations--seeds)
8. [Running the Application](#running-the-application)
9. [Running Tests](#running-tests)
10. [API Map](#api-map)

---

## 🏛️ Architecture Overview

EstateFlow is organized as an npm workspaces monorepo:

```
real_estate_management/
├── client/     # Frontend (React 18 + Vite + TypeScript + Tailwind CSS)
├── server/     # Backend (Node.js + Express + PostGIS + TypeScript)
├── shared/     # Shared contracts, enums, schemas, and TypeScript types
├── .env        # Root environment configuration
└── package.json# Monorepo workspace configuration
```

### Core Architecture Highlights:
- **Spatial Search Engine**: Powered by PostGIS spatial queries (`ST_DWithin`, `ST_MakePoint`, `ST_MakeEnvelope`) for accurate radius search and dynamic bounding-box queries on interactive maps.
- **Zero-Brokerage & Broker-Assisted Modes**: Support for direct owner listings (0% commission) as well as broker assignment workflows.
- **Role-Based Access Control (RBAC)**: Fine-grained access control for `BUYER`, `OWNER`, and `BROKER` roles.
- **Listing Status Machine**: Controlled lifecycle transitions (`DRAFT` → `ACTIVE` → `UNDER_OFFER` → `SOLD` / `RENTED` / `INACTIVE`) with complete historical audit logs.
- **Integrated CRM & Lead Pipeline**: Kanban stage progression (`NEW` → `SITE_VISIT_SCHEDULED` → `NEGOTIATION` → `CLOSED` / `DROPPED`) with timestamped notes and activity tracking.
- **Notification Engine**: In-app notifications with unread counts and pluggable SMS / WhatsApp messaging drivers (console mock in development, Twilio in production).

---

## ✨ Key Features

### For Buyers & Tenants:
- **Explore & Filter**: Search by city, locality, budget, BHK, furnishing status, amenities, and toggle **Zero Brokerage Only**.
- **Interactive Map**: Split map/grid and full map exploration with MapLibre GL and OpenStreetMap.
- **Compare Properties**: Side-by-side comparison of up to 4 properties with price/sq.ft analytics.
- **Direct Owner Connect**: Send inquiries with preferred contact modes (WhatsApp, Phone, Email).
- **Tour Scheduling**: Book in-person walkthroughs or virtual video tours.
- **Wishlist & Saved Searches**: Save properties and configure alerts for new matching listings.

### For Property Owners:
- **Multi-Step Listing Builder**: 5-step intuitive wizard with per-step validation (Basics, Specs, Location with coordinates, Media gallery, Review & Publish).
- **Owner Dashboard & Analytics**: Track total views, inquiry velocity, and active listings.
- **Leads CRM Pipeline**: Visual Kanban board to advance buyer inquiries through inspection, negotiation, and closing stages.
- **Digital Lease & Sale Records**: Record executed lease contracts, tenant details, and sale deeds.
- **Broker Assignment**: Delegate listings to verified broker partners.

### For Licensed Brokers:
- **Broker Partner Hub**: Manage all assigned properties across multiple owners.
- **Appointment Queue**: Review, confirm, and reschedule site inspection requests.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript 5, Tailwind CSS, Lucide Icons, Sonner, MapLibre GL |
| **Backend** | Express 4, TypeScript, Node.js (v20+ / v22+), Multer, Bcryptjs, JsonWebToken, Pino |
| **Database** | PostgreSQL 15+ with PostGIS spatial extension, node-pg-migrate |
| **Testing** | Vitest (unit & integration), Supertest, Playwright (E2E) |

---

## 🔄 Listing Status State Machine

```
              ┌─────────┐
              │  DRAFT  │
              └────┬────┘
                   │ (Publish)
                   ▼
┌───────────┐ ◄─────────► ┌─────────────┐
│ INACTIVE  │             │   ACTIVE    │
└───────────┘ ◄────────── └──────┬──────┘
                                 │
                                 ▼
                          ┌─────────────┐
                          │ UNDER_OFFER │
                          └──────┬──────┘
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
              ┌─────────┐                 ┌─────────┐
              │  SOLD   │                 │ RENTED  │
              └─────────┘                 └─────────┘
```

---

## 💾 Local Environment & Database Setup

### Option A: Direct Windows PostgreSQL + PostGIS (Recommended without Docker)

If Docker is not installed on your machine, install PostgreSQL and PostGIS directly on Windows:

1. **Install PostgreSQL**:
   - Download the Windows installer from [PostgreSQL Official Downloads](https://www.postgresql.org/download/windows/) (or install via `winget install PostgreSQL.PostgreSQL.16`).
   - During installation, enable **Stack Builder**.

2. **Install PostGIS via Stack Builder**:
   - Open Stack Builder, choose your PostgreSQL installation, and under **Spatial Extensions**, check **PostGIS Bundle**.
   - Complete the PostGIS installation.

3. **Create the Database & User**:
   Open **SQL Shell (psql)** or **pgAdmin** and run:
   ```sql
   CREATE USER estateflow WITH PASSWORD 'estateflow_dev';
   CREATE DATABASE estateflow OWNER estateflow;
   GRANT ALL PRIVILEGES ON DATABASE estateflow TO estateflow;

   \c estateflow
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

4. **Verify `.env` configuration**:
   Ensure `DATABASE_URL` in `.env` matches:
   ```env
   DATABASE_URL=postgresql://estateflow:estateflow_dev@localhost:5432/estateflow
   ```

### Option B: Docker Compose

If Docker is installed:
```bash
docker-compose up -d
```

---

## 🚀 Running Migrations & Seeds

From the project root:

```bash
# 1. Run database migrations (creates 15 tables, indexes & spatial geometry)
npm run db:migrate

# 2. Seed database with 40 realistic listings across major Indian metro cities
npm run db:seed

# 3. (Optional) Run performance seed generator (10,000 listings)
npm run db:seed:perf

# 4. (Optional) Run spatial query performance benchmark
npm run db:benchmark
```

---

## 💻 Running the Application

### Start Development Server (Frontend + Backend concurrently):
```bash
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:3000](http://localhost:3000)
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **API Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Building for Production:
```bash
npm run build
```

---

## 🧪 Running Tests

### Server Unit & Integration Tests (Vitest)
```bash
npm run test --workspace=server
```

Runs 33+ comprehensive test suites covering:
- Authentication & JWT token issuance
- Listing state machine transitions
- Lead pipeline stages
- RBAC authorization
- Pagination utilities
- Mock messaging providers
- Notifications API
- Property publishing & CRUD validation

### Frontend Playwright E2E Tests
```bash
npm run test:e2e --workspace=client
```

---

## 🗺️ API Map

| Group | Endpoint | Method | Auth | Roles |
|---|---|---|---|---|
| **Auth** | `/api/v1/auth/register` | POST | — | — |
| | `/api/v1/auth/login` | POST | — | — |
| | `/api/v1/auth/refresh` | POST | Cookie | ALL |
| | `/api/v1/auth/logout` | POST | JWT | ALL |
| | `/api/v1/auth/verify-otp` | POST | JWT | ALL |
| | `/api/v1/auth/resend-otp` | POST | JWT | ALL |
| | `/api/v1/auth/change-password` | POST | JWT | ALL |
| **Profile** | `/api/v1/users/me` | GET / PATCH | JWT | ALL |
| | `/api/v1/users/me/avatar` | POST | JWT | ALL |
| **Properties** | `/api/v1/properties` | POST | JWT | OWNER |
| | `/api/v1/properties/:id` | GET / PATCH / DELETE | JWT | OWNER / BROKER |
| | `/api/v1/properties/:id/publish` | POST | JWT | OWNER |
| | `/api/v1/properties/:id/status` | PATCH | JWT | OWNER / BROKER |
| | `/api/v1/properties/:id/media` | POST / DELETE | JWT | OWNER / BROKER |
| | `/api/v1/properties/:id/media/reorder` | PATCH | JWT | OWNER / BROKER |
| | `/api/v1/properties/my` | GET | JWT | OWNER |
| | `/api/v1/properties/assigned` | GET | JWT | BROKER |
| **Search** | `/api/v1/search` | GET | — | ALL |
| | `/api/v1/search/bbox` | GET | — | ALL |
| | `/api/v1/properties/:id/detail` | GET | — | ALL |
| **Wishlist** | `/api/v1/wishlist` | GET / POST / DELETE | JWT | BUYER |
| | `/api/v1/wishlist/compare` | GET | JWT | BUYER |
| **Saved Searches** | `/api/v1/saved-searches` | GET / POST / DELETE | JWT | BUYER |
| **Brokers** | `/api/v1/brokers` | GET | JWT | OWNER |
| **Inquiries & CRM** | `/api/v1/inquiries` | POST | JWT | BUYER |
| | `/api/v1/inquiries/my` | GET | JWT | BUYER |
| | `/api/v1/leads` | GET | JWT | OWNER / BROKER |
| | `/api/v1/leads/:id` | GET / PATCH | JWT | OWNER / BROKER |
| | `/api/v1/leads/:id/notes` | GET / POST | JWT | OWNER / BROKER |
| | `/api/v1/leads/:id/activities` | GET | JWT | OWNER / BROKER |
| **Visits** | `/api/v1/visits` | POST | JWT | BUYER |
| | `/api/v1/visits/:id` | PATCH | JWT | ALL |
| | `/api/v1/visits/my` | GET | JWT | BUYER |
| | `/api/v1/visits/handler` | GET | JWT | OWNER / BROKER |
| **Availability** | `/api/v1/availability/rules` | GET / PUT | JWT | OWNER / BROKER |
| | `/api/v1/availability/blocks` | GET / POST / DELETE | JWT | OWNER / BROKER |
| | `/api/v1/availability/:handlerId/slots` | GET | JWT | BUYER |
| **Lease Records** | `/api/v1/lease-records` | GET / POST | JWT | OWNER |
| | `/api/v1/lease-records/:id` | GET / PATCH | JWT | OWNER |
| **Notifications** | `/api/v1/notifications` | GET | JWT | ALL |
| | `/api/v1/notifications/read` | POST | JWT | ALL |
| | `/api/v1/notifications/unread-count` | GET | JWT | ALL |
