<div align="center">

# 🎯 Loadout Lab

**The precision rifle builder & ballistics platform for competitive shooters**

[![CI](https://github.com/danieldvorkin/loadout-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/danieldvorkin/loadout-lab/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/12cc177d-6235-49af-9c7b-649aa516be5a/deploy-status)](https://app.netlify.com/projects/loadout-ai/deploys)

[Live App](https://loadoutlab-api-3a7851c775ad.herokuapp.com/) · [Report Bug](https://github.com/danieldvorkin/loadout-lab/issues) · [Request Feature](https://github.com/danieldvorkin/loadout-lab/issues)

</div>

---

## Overview

Loadout Lab is a full-stack web application for precision rifle enthusiasts. Build your dream rifle piece by piece, calculate ballistics, track load development data, and buy/sell components on the marketplace — all in one place.

## ✨ Features

### 🔧 Build Your Rifle
- Create and manage rifle builds with a drag-and-drop component system
- Browse a catalog of real components (barrels, actions, stocks, triggers, optics, and more) synced from retailers
- Track component costs, weights, and ownership status
- Cost calculator with real-time totals for new and owned parts

### 📊 Ballistics & DOPE Cards
- Create ballistic profiles with environmental conditions (altitude, temperature, humidity, wind)
- Compute drop tables using G1/G7 ballistic coefficients
- Generate printable DOPE (Data on Previous Engagements) cards
- Log load test results — group size, velocity, and charge weight tracking

### 🏪 Marketplace
- List components for sale or trade with other users
- Filter by condition, price, and component type
- Built-in messaging system for buyer/seller conversations
- Unread message badges and real-time notification indicators

### 👤 User Profiles
- Email/password and Google OAuth authentication
- Customizable profile with avatar, bio, social links, and preferred discipline
- Notification preferences and account management

### 🛡️ Admin Panel
- Server-rendered admin dashboard at `/admin`
- Manage users, components, manufacturers, and builds
- CRUD operations with image support

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (SPA)                     │
│          React 19 · React Router v7 · Tailwind v4    │
│              Apollo Client · TypeScript               │
├─────────────────────────────────────────────────────┤
│                   GraphQL API Layer                   │
│                    graphql-ruby                       │
├─────────────────────────────────────────────────────┤
│                  Backend (API + Admin)                │
│           Rails 8.1 · Devise JWT · Pundit            │
├─────────────────────────────────────────────────────┤
│                     Data Layer                        │
│     PostgreSQL · Solid Queue · Solid Cache/Cable     │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router v7, TypeScript, Tailwind CSS v4, Apollo Client |
| **API** | GraphQL (graphql-ruby) with 28+ mutations and typed resolvers |
| **Backend** | Ruby on Rails 8.1 (API mode + admin views) |
| **Auth** | Devise + JWT tokens, Google OAuth 2.0 |
| **Database** | PostgreSQL with JSONB columns and GIN indexes |
| **Background Jobs** | Solid Queue with recurring schedules |
| **Caching** | Solid Cache |
| **Web Server** | Puma + Thruster |
| **CI/CD** | GitHub Actions → auto-deploy to Heroku |

### Data Model

```
Users ──< Builds ──< BuildComponents >── Components >── Manufacturers
              │
              └──< BallisticProfiles ──< BallisticDrops
                        │
                        ├──< LoadTests
                        └──> Projectiles

Users ──< Listings >── Components
              │
              └──< Conversations ──< Messages
```

---

## 🚀 Getting Started

### Prerequisites

- **Ruby** 3.3+ (see `.ruby-version`)
- **Node.js** 20+
- **PostgreSQL** 14+
- **Bundler** 2.0+

### Installation

```bash
# Clone the repository
git clone https://github.com/danieldvorkin/loadout-lab.git
cd loadout-lab

# Install backend dependencies
bundle install

# Install frontend dependencies
cd app/frontend && npm install && cd ../..

# Set up the database
bin/rails db:create db:migrate db:seed

# Configure frontend environment
cp app/frontend/.env.example app/frontend/.env
# Edit .env with your VITE_API_URL and VITE_GOOGLE_CLIENT_ID
```

### Running Locally

```bash
# Start both backend and frontend with a single command
bin/dev

# Or run them separately:
bin/rails server -p 3000          # Backend API on :3000
cd app/frontend && npm run dev    # Frontend on :5173
```

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Frontend SPA |
| `http://localhost:3000/graphql` | GraphQL API endpoint |
| `http://localhost:3000/graphiql` | Interactive GraphQL IDE |
| `http://localhost:3000/admin` | Admin panel |

---

## 🧪 Testing

```bash
# Run the full test suite
bundle exec rspec

# Run with verbose output
bundle exec rspec --format documentation

# Run a specific spec file
bundle exec rspec spec/models/build_spec.rb

# Run the full CI check locally
bin/ci
```

### CI Pipeline

The GitHub Actions workflow runs on every push to `main` and on pull requests:

| Job | Description |
|-----|-------------|
| **scan_ruby** | Brakeman security analysis + bundler-audit |
| **lint** | RuboCop style enforcement |
| **test** | RSpec suite against PostgreSQL |
| **frontend** | TypeScript type-check + Vite production build |
| **deploy** | Auto-deploy to Heroku (main branch only, gated on all above) |

---

## 📡 GraphQL API

All client-server communication goes through a single GraphQL endpoint at `POST /graphql`.

<details>
<summary><strong>Queries</strong></summary>

- `currentUser` — Authenticated user profile
- `builds` / `build(id)` — User rifle builds
- `components` / `component(id)` — Component catalog with filtering
- `manufacturers` / `manufacturer(id)` — Manufacturer directory
- `ballisticProfile(id)` — Ballistic profile with drops
- `listings` / `listing(id)` — Marketplace listings
- `conversations` / `conversation(id)` — User messages
- `projectiles` — Projectile database with BC data

</details>

<details>
<summary><strong>Mutations (28+)</strong></summary>

**Auth:** `registerUser`, `loginUser`, `googleOauthLogin`, `changePassword`, `deleteAccount`

**Builds:** `createBuild`, `updateBuild`, `deleteBuild`, `addComponentToBuild`, `removeComponentFromBuild`, `updateBuildComponent`

**Ballistics:** `createBallisticProfile`, `updateBallisticProfile`, `deleteBallisticProfile`, `upsertBallisticDrop`, `bulkUpsertBallisticDrops`, `deleteBallisticDrop`, `generateDopeTable`

**Load Testing:** `upsertLoadTest`, `deleteLoadTest`

**Marketplace:** `createListing`, `updateListing`, `deleteListing`, `startConversation`, `sendMessage`, `markConversationRead`

**Profile:** `updateUserProfile`

</details>

---

## 🔑 Authentication

### JWT Token Flow
1. User logs in via `loginUser` or `googleOauthLogin` mutation
2. Server returns a JWT in the response `Authorization` header
3. Client stores the token and sends it with every request as `Authorization: Bearer <token>`
4. Token is invalidated on logout via JTI (JWT ID) rotation

### Google OAuth Setup

1. Create credentials in the [Google Cloud Console](https://console.developers.google.com/) → **APIs & Services → Credentials → OAuth 2.0 Client ID**
2. Set authorized JavaScript origins (e.g., `http://localhost:5173`)
3. Add `VITE_GOOGLE_CLIENT_ID=your-client-id` to `app/frontend/.env`

The backend verifies the access token server-side via Google's userinfo API — no client secret is needed in the frontend.

---

## ⚙️ Background Jobs

Powered by [Solid Queue](https://github.com/rails/solid_queue) with database-backed persistence.

| Job | Schedule | Description |
|-----|----------|-------------|
| `SyncProductsJob` | Daily at 3am EST | Syncs component catalog from retailer APIs |
| `PopulateImagesJob` | On demand | Backfills component/manufacturer images |
| `SyncSingleRetailerJob` | On demand | Syncs products from a specific retailer |

---

## 🚢 Deployment

### Heroku (Production)

Deployment is automated via GitHub Actions. On every push to `main`, after all CI checks pass, the app is deployed using the Heroku Build API.

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `HEROKU_API_KEY` | Heroku API token (`heroku auth:token`) |

**Required Heroku Config Vars:**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Heroku Postgres addon) |
| `RAILS_MASTER_KEY` | Decrypts `credentials.yml.enc` |
| `ENABLE_GRAPHIQL` | Set to `"true"` to enable GraphiQL in production |

### Manual Deploy

```bash
# Local deploy (runs tests first, then pushes)
bin/deploy
```

---

## 📁 Project Structure

```
├── app/
│   ├── controllers/        # GraphQL endpoint + Admin controllers
│   ├── frontend/           # React SPA (React Router v7 + Tailwind)
│   │   ├── app/
│   │   │   ├── components/ # Shared UI components (AppNav, etc.)
│   │   │   ├── lib/        # Auth context, Apollo client, GraphQL queries
│   │   │   └── routes/     # Page components (builds, marketplace, etc.)
│   │   └── public/         # Static assets
│   ├── graphql/
│   │   ├── mutations/      # 28+ GraphQL mutations
│   │   ├── resolvers/      # Query resolvers
│   │   └── types/          # GraphQL type definitions
│   ├── jobs/               # Background jobs (Solid Queue)
│   ├── models/             # ActiveRecord models
│   ├── services/           # Business logic (ballistic calculator, scrapers)
│   └── views/admin/        # Server-rendered admin panel (ERB)
├── config/
│   ├── routes.rb           # API + Admin routes
│   └── recurring.yml       # Scheduled job definitions
├── db/
│   ├── migrate/            # Database migrations
│   ├── schema.rb           # Current schema
│   └── seeds/              # Seed data (components, manufacturers)
├── spec/                   # RSpec test suite
└── .github/workflows/      # CI/CD pipeline
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all checks pass (`bin/ci`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

This project is private and not licensed for public use.

---

<div align="center">
  <sub>Built with ☕ and 🎯 for the precision shooting community</sub>
</div>
