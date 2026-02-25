# PRS Builder — Architecture Design Document

> **Last Updated:** February 25, 2026  
> **Stack:** Rails 8 API · GraphQL · React 19 / React Router v7 · PostgreSQL

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Backend — Rails API](#3-backend--rails-api)
   - [Entry Point & Routing](#31-entry-point--routing)
   - [Authentication](#32-authentication)
   - [Admin Panel](#33-admin-panel)
   - [Background Jobs](#34-background-jobs)
   - [Services](#35-services)
4. [Data Layer — PostgreSQL Models](#4-data-layer--postgresql-models)
   - [Entity Relationships](#41-entity-relationships)
   - [Model Summary](#42-model-summary)
5. [GraphQL API Layer](#5-graphql-api-layer)
   - [Schema](#51-schema)
   - [Query Types](#52-query-types)
   - [Mutation Types](#53-mutation-types)
   - [Context & Authorization](#54-context--authorization)
6. [Frontend — React Application](#6-frontend--react-application)
   - [Tech Stack](#61-tech-stack)
   - [Application Shell & Providers](#62-application-shell--providers)
   - [Routing](#63-routing)
   - [Global State & Context](#64-global-state--context)
   - [GraphQL on the Client](#65-graphql-on-the-client)
   - [Pages / Route Components](#66-pages--route-components)
   - [Shared Components](#67-shared-components)
7. [Deployment & Infrastructure](#7-deployment--infrastructure)
8. [Data Flow — End-to-End Request Lifecycle](#8-data-flow--end-to-end-request-lifecycle)
9. [Key Design Decisions](#9-key-design-decisions)
10. [Scalability Plans & Trade-offs](#10-scalability-plans--trade-offs)

---

## 1. Overview

PRS Builder is a full-stack application for precision rifle shooters to:

- **Build** and manage rifle component builds (chassis, barrel, trigger, scope, etc.)
- **Track ballistics** with profile creation and trajectory (DOPE) table generation
- **Buy and sell** gear through an integrated marketplace
- **Message** other users about listings
- **Browse** a component and manufacturer catalog seeded from real retailer data

The stack is split into two deployable units:

| Unit | Technology | Hosted On |
|------|-----------|-----------|
| **API** | Rails 8.1 (API-only mode) + GraphQL | Heroku |
| **Frontend** | React 19 + React Router v7 + Apollo Client | Netlify |

They communicate exclusively through a **single GraphQL endpoint** at `POST /graphql`.

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      User's Browser                      │
│                                                          │
│   ┌─────────────────────────────────────────────────┐   │
│   │         React App  (Netlify CDN)                │   │
│   │                                                 │   │
│   │  AuthProvider  BuildCartProvider  ApolloClient  │   │
│   │         │               │              │        │   │
│   │         └───────────────┴──────────────┘        │   │
│   │                         │                       │   │
│   │         React Router v7 Routes / Pages          │   │
│   └─────────────────────────┬───────────────────────┘   │
│                             │ HTTPS POST /graphql        │
│                             │ Bearer <JWT Token>         │
└─────────────────────────────┼───────────────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │   Rails 8 API  (Heroku)         │
              │                                 │
              │   Rack::CORS middleware         │
              │         │                       │
              │   GraphqlController#execute     │
              │         │                       │
              │   PrsBuilderApiSchema           │
              │    ├── QueryType                │
              │    └── MutationType             │
              │         │                       │
              │   ApplicationController         │
              │   (JWT decode → current_user)   │
              │         │                       │
              │   ActiveRecord Models           │
              │         │                       │
              │   Solid Queue (Background Jobs) │
              └───────────────┬────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │        PostgreSQL               │
              │   (Heroku Postgres)             │
              └────────────────────────────────┘
```

---

## 3. Backend — Rails API

### 3.1 Entry Point & Routing

Rails runs in **API-only mode** (`ActionController::API`). All routes are minimal by design:

```
POST   /graphql          ← All API operations (queries + mutations)
GET    /graphiql         ← Interactive GraphQL IDE (dev + opt-in production)
GET    /up               ← Health check for load balancers
namespace /admin         ← Traditional HTML admin panel (Devise session auth)
```

Every feature—authentication, data fetching, data mutation—flows through the single `/graphql` endpoint. This keeps the client simple: one URL, one protocol.

### 3.2 Authentication

Authentication uses **Devise + devise-jwt** with the **JTI Matcher** revocation strategy.

**How it works:**

1. Client calls `loginUser` or `registerUser` GraphQL mutation.
2. Rails creates/validates the user and returns a signed **JWT** (HS256).
3. The JWT is stored in **`localStorage`** on the client.
4. Every subsequent GraphQL request includes `Authorization: Bearer <token>` in the header.
5. `ApplicationController#current_user` decodes the token, validates the `jti` (JWT ID) against the database, and sets `@current_user`.
6. The resolved `current_user` is passed into the GraphQL `context` hash so every resolver and mutation can access it.

**Token revocation:** The `jti` column on `users` is a unique token identifier. Logging out regenerates the `jti`, invalidating all existing tokens without needing a blocklist.

**Google OAuth** is also supported via `google_oauth_login` mutation — the client sends a Google ID token, the backend verifies it and finds-or-creates the user.

```
GraphQL Mutation → Rails → JWT issued → Client stores token
Every request   → Rails decodes JWT → current_user populated in context
```

### 3.3 Admin Panel

A traditional Rails admin panel lives at `/admin`. It uses **Devise session-based auth** (separate from the JWT flow) and serves HTML views for:

- Dashboard
- Users (index, show, edit, update, destroy)
- Components (full CRUD)
- Manufacturers (full CRUD)
- Builds (index, show, destroy)

This panel is for internal use only and is not part of the public API.

### 3.4 Background Jobs

Jobs run via **Solid Queue** (Rails 8's built-in queue backend, database-backed). No Redis needed.

| Job | Purpose | Schedule |
|-----|---------|----------|
| `SyncProductsJob` | Scrapes product data from known precision rifle retailers and upserts into Components + Manufacturers | Daily at 8am UTC (3am EST) |
| `SyncSingleRetailerJob` | Same as above but for a single retailer — used for manual re-runs | On demand |
| `PopulateImagesJob` | Backfill image URLs for existing components | On demand |

The recurring schedule is defined in `config/recurring.yml` and managed by Solid Queue.

### 3.5 Services

| Service | Responsibility |
|---------|---------------|
| `BallisticCalculator` | **Physics engine.** Point-mass trajectory model implementing G1/G7 drag models. Numerically integrates equations of motion to produce drop (inches, MOA, Mils), windage, velocity, and energy at each distance step. Used by the `GenerateDopeTable` mutation. |
| `ProductScraper` | Scrapes product data (name, price, image, category) from precision rifle retailer websites and maps them to internal component types. |

---

## 4. Data Layer — PostgreSQL Models

### 4.1 Entity Relationships

```
User
 ├── has_many Builds
 │    ├── has_many BuildComponents
 │    │    └── belongs_to Component
 │    │         └── belongs_to Manufacturer
 │    └── has_many BallisticProfiles
 │         ├── belongs_to Projectile
 │         ├── has_many BallisticDrops
 │         └── has_many LoadTests
 ├── has_many Listings
 │    ├── belongs_to Component
 │    └── belongs_to BuildComponent (optional)
 ├── has_many Conversations (as buyer)
 └── has_many Conversations (as seller)
      └── has_many Messages
           └── belongs_to User
```

### 4.2 Model Summary

#### `User`
Central auth model. Uses Devise + JWT. Stores profile info, role (user/admin), OAuth provider, `jti` for token revocation, and JSONB columns for `social_links` and `notification_preferences`.

#### `Build`
A named rifle build owned by a user. Has a `discipline` (prs, nrl, benchrest, etc.) and calculated aggregate fields: `total_weight_oz`, `total_cost_cents`, `new_cost_cents`. Totals are recomputed via `calculate_totals!` whenever components change.

#### `BuildComponent`
Join table between `Build` and `Component`. Adds `position` (where the component sits in the build), `owned` (bool — do they already own it?), and a `specs` JSONB column for component-specific overrides.

#### `Component`
A gun part — scope, barrel, trigger, chassis, etc. Belongs to a `Manufacturer`. Has `type` (category string, not STI), `weight_oz`, `msrp_cents`, `image_url`, `discontinued` flag, and a `specs` JSONB column for flexible attributes. The `type` column uses a defined list of 15 categories (`TYPES` constant).

#### `Manufacturer`
A brand (e.g., MDT, Nightforce). Has `name`, `country`, `website`, `image_url`. Components belong to manufacturers.

#### `BallisticProfile`
All the inputs needed for trajectory calculation: cartridge name, bullet BC (G1 or G7), muzzle velocity, zero distance, barrel length, atmospheric conditions (temp, pressure, humidity, altitude, wind). Belongs to a Build and optionally a Projectile.

#### `BallisticDrop`
A single data point in a DOPE table. Stores drop and windage values in inches, MOA, and Mils, plus velocity, energy, and time-of-flight at a given `distance_yards`. Has a unique index on `(ballistic_profile_id, distance_yards)`.

#### `Projectile`
Catalog of bullets. Stores manufacturer, name, weight (grains), caliber (inches), BC G1/G7, bullet type, and recommended twist rate. Used as a reference when building a ballistic profile.

#### `LoadTest`
Records from real-world load development: charge weight (grains), distance, group size (inches and MOA), velocity, and notes. Belongs to a `BallisticProfile`.

#### `Listing`
A marketplace item. Has `title`, `description`, `listing_type` (showcase or for_sale), `status` (active/sold/archived), `condition`, `price_cents`, `location`, `contact_info`, `image_url`. Belongs to a User and a Component. Optionally linked to a `BuildComponent` so users can list parts directly from their builds.

#### `Conversation`
Ties a `buyer`, `seller`, and a `Listing` together. Has a unique index on `(listing_id, buyer_id)` to prevent duplicate threads. Tracks `last_message_at` for sorting.

#### `Message`
A single chat message inside a Conversation. Has `body`, `read` (boolean), and belongs to both a `Conversation` and the sending `User`.

---

## 5. GraphQL API Layer

### 5.1 Schema

The schema is defined in `PrsBuilderApiSchema` (`app/graphql/prs_builder_api_schema.rb`). It wires together the QueryType and MutationType and uses `GraphQL::Dataloader` for N+1 protection. Max query token limit is 5,000.

### 5.2 Query Types

All read operations are fields on `Types::QueryType`:

| Field | Auth Required | Description |
|-------|:---:|-------------|
| `components` | ✗ | List components with search, type, manufacturer, active-only filters + pagination |
| `component(id)` | ✗ | Single component |
| `componentTypes` | ✗ | Enum of all 15 component categories |
| `manufacturers` | ✗ | List manufacturers with name search |
| `manufacturer(id)` | ✗ | Single manufacturer |
| `builds` | ✓ | Current user's builds with search + discipline filter |
| `build(id)` | ✓ | Single build (scoped to current user) |
| `currentUser` | ✓ | Authenticated user's full profile |
| `projectiles` | ✗ | Bullet catalog filtered by caliber or manufacturer |
| `projectileManufacturers` | ✗ | List of projectile brands |
| `cartridgeDiameters` | ✗ | Cartridge name → diameter map |
| `calibers` | ✗ | Supported PRS/long-range calibers |
| `disciplines` | ✗ | Supported shooting disciplines |
| `ballisticProfiles(buildId)` | ✓ | All profiles for a build |
| `ballisticProfile(id)` | ✓ | Single profile with drop data |
| `listings` | ✗ | Active marketplace listings with type/search filters + pagination |
| `listing(id)` | ✗ | Single active listing |
| `myListings` | ✓ | Current user's listings (all statuses) |
| `myConversations` | ✓ | All conversations for current user |
| `conversation(id)` | ✓ | Single conversation (must be a participant) |
| `myUnreadCount` | ✓ | Count of unread messages across all conversations |

### 5.3 Mutation Types

All write operations are fields on `Types::MutationType`:

| Group | Mutations |
|-------|-----------|
| **Auth** | `registerUser`, `loginUser`, `googleOauthLogin` |
| **Account** | `updateUserProfile`, `changePassword`, `deleteAccount` |
| **Builds** | `createBuild`, `updateBuild`, `deleteBuild` |
| **Build Components** | `addComponentToBuild`, `updateBuildComponent`, `removeComponentFromBuild` |
| **Ballistic Profiles** | `createBallisticProfile`, `updateBallisticProfile`, `deleteBallisticProfile` |
| **Ballistic Drops** | `upsertBallisticDrop`, `deleteBallisticDrop`, `bulkUpsertBallisticDrops` |
| **Ballistics Calc** | `generateDopeTable` — invokes `BallisticCalculator` service and persists results |
| **Load Tests** | `upsertLoadTest`, `deleteLoadTest` |
| **Marketplace** | `createListing`, `updateListing`, `deleteListing` |
| **Messaging** | `startConversation`, `sendMessage`, `markConversationRead` |

### 5.4 Context & Authorization

Every GraphQL request executes with a `context` hash:

```ruby
context: {
  current_user: current_user,   # nil if unauthenticated
  request:      request,
  response:     response
}
```

Resolvers and mutations that require auth guard themselves with:

```ruby
return [] unless context[:current_user]
```

Pundit is available for policy-based authorization where needed.

---

## 6. Frontend — React Application

### 6.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Routing | React Router v7 (file-based routes config) |
| GraphQL client | Apollo Client v4 |
| Styling | Tailwind CSS v4 |
| Build tool | Vite 7 |
| Auth | JWT via localStorage + Google OAuth (`@react-oauth/google`) |
| Hosting | Netlify (static + SSR-capable build) |

### 6.2 Application Shell & Providers

`root.tsx` is the application shell. It wraps the entire app in a nested provider tree:

```tsx
<GoogleOAuthProvider>          // Google OAuth SDK
  <ApolloProvider>             // GraphQL client available everywhere
    <AuthProvider>             // Current user state & auth actions
      <BuildCartProvider>      // Build component cart state
        <Outlet />             // Page content here
        <BuildCartDrawer />    // Slide-over drawer (always mounted)
      </BuildCartProvider>
    </AuthProvider>
  </ApolloProvider>
</GoogleOAuthProvider>
```

This ensures every page has access to auth, cart state, and GraphQL without prop drilling.

### 6.3 Routing

Routes are defined declaratively in `app/routes.ts`:

```
/                          → home.tsx
/login                     → login.tsx
/register                  → register.tsx
/components                → components.tsx
/components/:id            → component-detail.tsx
/manufacturers             → manufacturers.tsx
/manufacturers/:id         → manufacturer-detail.tsx
/builds                    → builds.tsx
/builds/:id                → build-detail.tsx
/builds/:id/ballistics     → build-ballistics.tsx
/builds/:id/ballistics/:profileId → dope-card.tsx
/marketplace               → marketplace.tsx
/marketplace/:id           → marketplace-listing.tsx
/messages                  → messages.tsx
/messages/:id              → messages-conversation.tsx
/account                   → account/index.tsx
/account/profile           → account/profile.tsx
/account/security          → account/security.tsx
/account/preferences       → account/preferences.tsx
```

### 6.4 Global State & Context

#### `AuthContext` (`lib/auth-context.tsx`)
Manages authentication state for the entire app.

**State it holds:**
- `user` — current user object (or `null`)
- `isAuthenticated` — boolean
- `isLoading` — true while verifying token on load

**Actions it exposes:**
- `login(email, password)` — calls `loginUser` mutation, stores JWT, sets user
- `loginWithGoogle(idToken)` — calls `googleOauthLogin` mutation
- `register(data)` — calls `registerUser` mutation
- `logout()` — removes JWT from localStorage, clears Apollo cache, resets user
- `refetchUser()` — re-fetches `currentUser` query to sync profile changes
- `updateUser(partial)` — optimistic local update to user state

On app load, if a JWT exists in `localStorage`, it fires `GET_CURRENT_USER` to validate and restore session.

#### `BuildCartContext` (`lib/build-cart-context.tsx`)
A lightweight cart for staging components before adding them to a build.

**State it holds:**
- `cartItems` — array of `CartComponent` objects (persisted to `localStorage`)
- `isOpen` — controls the drawer visibility

**Actions it exposes:**
- `addToCart`, `removeFromCart`, `clearCart`, `isInCart`
- `openCart`, `closeCart`, `toggleCart`

### 6.5 GraphQL on the Client

#### Apollo Client Setup (`lib/apollo-client.ts`)

Two links are composed:

1. **`authLink`** — intercepts every request and injects `Authorization: Bearer <token>` from `localStorage`.
2. **`httpLink`** — sends the request to `VITE_API_URL/graphql`.

The `InMemoryCache` is configured with merge policies for `builds` and `components` queries to prevent stale list data on re-fetch.

#### GraphQL Operations (`lib/graphql-operations.ts`)

All queries and mutations are defined as typed `gql` documents in a single file. This gives one canonical source of truth for all GraphQL operations used across the app.

### 6.6 Pages / Route Components

| Route | Key Responsibilities |
|-------|---------------------|
| `home.tsx` | Landing page / dashboard |
| `login.tsx` | Email/password + Google OAuth sign-in form |
| `register.tsx` | User registration form |
| `components.tsx` | Searchable, filterable component catalog. Table view on desktop, card view on mobile. "Add to Cart" dispatches to BuildCartContext. |
| `component-detail.tsx` | Single component detail with specs, manufacturer info, marketplace listings for that part |
| `manufacturers.tsx` | Manufacturer catalog with search. Logo/image display. |
| `manufacturer-detail.tsx` | Manufacturer profile with their component catalog |
| `builds.tsx` | Current user's builds list. Create new build modal. |
| `build-detail.tsx` | Full build view: component list, weight/cost totals, owned/wanted breakdown. Add/remove components. |
| `build-ballistics.tsx` | List of ballistic profiles for a build. Create new profile. Trigger DOPE table generation. |
| `dope-card.tsx` | Renders the generated trajectory table (drop & windage at each distance in inches/MOA/Mils) |
| `marketplace.tsx` | Public listing grid with type filter (showcase / for sale) and search. |
| `marketplace-listing.tsx` | Single listing detail. "Contact Seller" triggers `startConversation` mutation. |
| `messages.tsx` | Conversation inbox list with unread indicators. |
| `messages-conversation.tsx` | Real-time-feeling message thread. Send messages via `sendMessage` mutation. Marks read via `markConversationRead`. |
| `account/index.tsx` | Account overview / profile summary |
| `account/profile.tsx` | Edit profile fields (name, bio, location, avatar, etc.) |
| `account/security.tsx` | Change password form |
| `account/preferences.tsx` | Notification preferences toggles |

### 6.7 Shared Components

| Component | Purpose |
|-----------|---------|
| `AppNav.tsx` | Top navigation bar. Shows auth state (login/logout), links to main sections, unread message badge (polls `myUnreadCount` query every 30s). |
| `BuildCartDrawer.tsx` | Slide-over panel listing staged cart components. "Add to Build" flow initiates `addComponentToBuild` mutations. |
| `Pagination.tsx` | Reusable page controls used on paginated lists (components, marketplace). |

---

## 7. Deployment & Infrastructure

```
┌────────────────────────────┐    ┌────────────────────────────┐
│  Netlify                   │    │  Heroku                    │
│                            │    │                            │
│  React Frontend            │    │  Rails 8 API               │
│  - Vite build              │◄───┤  - Puma web server         │
│  - CDN distribution        │    │  - Solid Queue workers     │
│  - VITE_API_URL env var    │    │  - Solid Cache             │
│  - VITE_GOOGLE_CLIENT_ID   │    │  - Solid Cable             │
└────────────────────────────┘    │                            │
                                  │  Heroku Postgres           │
                                  │  (PostgreSQL database)     │
                                  └────────────────────────────┘
```

**CORS** is configured in `config/initializers/cors.rb` to allow:
- `localhost:5173` in development
- The `FRONTEND_URL` env var (Netlify production URL) in production
- Any `*.netlify.app` subdomain in production (for deploy previews)

**Environment Variables:**

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DEVISE_JWT_SECRET_KEY` | Rails | Signs JWT tokens |
| `FRONTEND_URL` | Rails CORS | Whitelists production frontend |
| `ENABLE_GRAPHIQL` | Rails | Enables GraphiQL in production |
| `VITE_API_URL` | Frontend | GraphQL endpoint base URL |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Google OAuth client ID |

---

## 8. Data Flow — End-to-End Request Lifecycle

Here's a concrete example tracing a user adding a component to a build:

```
1. USER ACTION
   User clicks "Add to Build" on a component in the Components page.

2. FRONTEND (components.tsx)
   Dispatches addToCart(component) → BuildCartContext updates state.
   BuildCartDrawer opens with the component listed.
   User selects a build and clicks "Confirm Add."

3. APOLLO CLIENT
   Calls addComponentToBuild mutation from graphql-operations.ts.
   authLink injects Authorization: Bearer <jwt> header.
   POST https://api.prsbuilder.com/graphql
   Body: { query: "mutation AddComponentToBuild...", variables: { buildId, componentId } }

4. RAILS — GraphqlController#execute
   Receives request.
   ApplicationController#current_user decodes JWT:
     - Extracts sub (user ID) and jti from payload
     - Queries: SELECT * FROM users WHERE id=? AND jti=?
     - Sets @current_user
   Passes current_user into GraphQL context.

5. GRAPHQL — Mutations::AddComponentToBuild
   Validates current_user is present.
   Finds build scoped to current_user.builds.
   Creates BuildComponent record.
   Calls build.calculate_totals! to update weight and cost.
   Returns the updated Build object.

6. APOLLO CLIENT
   Receives response, updates InMemoryCache.
   build-detail.tsx re-renders automatically via cache reactivity.

7. USER SEES
   Build detail page updates with the new component, new total weight, new total cost.
```

---

## 9. Key Design Decisions

### Single GraphQL Endpoint
All API communication goes through `POST /graphql`. This avoids REST versioning problems, gives the client precise control over what data it fetches (no over/under-fetching), and makes it easy to add new capabilities without new routes.

### JWT in localStorage (not HttpOnly cookies)
Chosen for simplicity with a cross-origin SPA + API setup. The trade-off is XSS exposure vs. CSRF complexity. The `jti` column provides server-side revocation capability.

### Solid Queue / Cache / Cable (No Redis)
Rails 8's built-in database-backed queue means one fewer infrastructure dependency. Background jobs, caching, and ActionCable all run against PostgreSQL. Acceptable for current scale.

### `type` Column on Components (No STI)
`Component.inheritance_column = nil` disables Rails STI. The `type` field is used as a plain category string rather than a class discriminator. This avoids a complex class hierarchy for what is fundamentally just a category filter.

### JSONB `specs` Column on Components and BuildComponents
Flexible key-value specs per component without requiring schema migrations for every new attribute. GIN index on `components.specs` supports fast JSON queries.

### Physics-Based Ballistic Calculator (No External API)
The `BallisticCalculator` service implements a real point-mass trajectory model in pure Ruby (G1/G7 drag tables, numerical integration). This keeps ballistic calculation offline-capable, free, and fully auditable.

### Build Cart as Client-Side State
The "build cart" (staging components before creating a build) is entirely managed in `BuildCartContext` and `localStorage`. No server round-trips until the user confirms. This keeps the UX fast and reduces unnecessary API calls.

---

## 10. Scalability Plans & Trade-offs

### Current Bottlenecks to Watch

#### N+1 Queries
GraphQL's nested resolver model can produce N+1 queries without care. `GraphQL::Dataloader` is enabled in the schema to batch-load associations. As the catalog grows, fields like `listings` (which resolve `user`, `component`, and `manufacturer` per row) should be progressively migrated to Dataloader sources if query times degrade.

#### Polling for Unread Messages
`AppNav` polls `myUnreadCount` every 30 seconds. This is simple and works fine at low scale but adds unnecessary load as concurrent users grow. The natural upgrade path is ActionCable (already included via Solid Cable) — swapping the poll for a WebSocket subscription would eliminate this overhead entirely.

#### Ballistic Calculator on the Web Dyno
`GenerateDopeTable` runs `BallisticCalculator` synchronously inside the web request. For typical profiles (1500 yards, 25-yard steps) this is fast enough (~5–15ms in Ruby). If users request very high-resolution tables or the calc is extended significantly, it should be moved to a background job with a polling/subscription response pattern.

---

### Scaling the Backend (Heroku → Beyond)

| Concern | Current Approach | Scale-Up Path |
|---------|-----------------|---------------|
| **Web concurrency** | Puma multi-threaded, single dyno | Add dynos (horizontal scale), tune Puma thread/worker count |
| **Job processing** | Solid Queue (DB-backed) on same dyno | Separate worker dynos; migrate to Redis-backed queue (Sidekiq) if throughput demands it |
| **Caching** | Solid Cache (DB-backed) | Migrate to Redis for lower-latency cache lookups at higher traffic |
| **Database** | Single Heroku Postgres instance | Add read replicas for analytics/reporting queries; connection pooling via PgBouncer |
| **Real-time messaging** | Solid Cable (DB-backed) | Migrate to Redis-backed ActionCable adapter for pub/sub at scale |
| **Retailer scraping** | Sequential HTTP requests in a single job | Parallelize with multiple jobs per retailer; rate-limit per domain |

The Solid Queue/Cache/Cable stack was chosen specifically because it eliminates external service dependencies at current scale. The migration path to Redis-backed equivalents (Sidekiq, Redis Cache, Redis ActionCable) is well-trodden and straightforward when the time comes — it's mostly a Gemfile and config swap.

---

### Scaling the Frontend (Netlify)

Netlify handles CDN distribution automatically. The main frontend scaling concerns are:

- **Apollo cache invalidation** — as data changes more frequently (active marketplace, busy messages), cache TTLs and `fetchPolicy` settings per query will need tuning to balance freshness vs. server load.
- **Bundle size** — currently a single bundle. If the app grows significantly, React Router v7's route-based code splitting can lazy-load routes on demand, keeping initial load fast.
- **SSR vs. CSR** — the app currently renders client-side. React Router v7 supports full SSR (already configured in the Vite/Netlify setup). Enabling SSR for public pages (marketplace, component catalog) would improve SEO and perceived performance with zero architectural changes.

---

### Key Trade-off Summary

| Decision | Benefit | Cost / Risk |
|----------|---------|-------------|
| Single GraphQL endpoint | Simple client, flexible queries, no versioning | Harder to cache at HTTP layer; requires discipline to avoid overfetching |
| JWT in localStorage | Easy cross-origin SPA auth | XSS can steal tokens; mitigated by `jti` revocation and short-lived tokens |
| Solid Queue (no Redis) | Zero extra infrastructure, simpler ops | Higher DB load under heavy job volume; less throughput than Redis-backed queues |
| Polling for unread count | Zero infrastructure (no WebSockets needed now) | Wastes requests at scale; easily replaced with ActionCable subscription |
| JSONB `specs` on components | Schema flexibility without migrations | No enforced structure; queries on nested keys less readable than typed columns |
| Physics calc in-process | Free, auditable, no API dependency | CPU-bound on web dyno; needs offloading if calc complexity increases |
| Client-side build cart | Instant UX, zero server load | Cart is lost if localStorage is cleared; no cross-device persistence |
