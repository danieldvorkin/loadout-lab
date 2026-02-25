# PRS Builder — API Reference

> **Version:** 1.0  
> **Last Updated:** February 25, 2026  
> **Protocol:** GraphQL over HTTP

---

## Table of Contents

1. [Overview](#1-overview)
2. [Base URL](#2-base-url)
3. [Authentication](#3-authentication)
4. [Making Requests](#4-making-requests)
5. [Error Handling](#5-error-handling)
6. [Queries](#6-queries)
7. [Mutations](#7-mutations)
8. [Type Reference](#8-type-reference)

---

## 1. Overview

The PRS Builder API is a **GraphQL API**. All operations — reads and writes — go through a single endpoint using `POST`. There is no REST API.

Benefits for clients:
- Request only the fields you need (no over-fetching)
- Compose multiple resources in one round-trip (no under-fetching)
- Strongly typed schema — use introspection or GraphiQL to explore

**Interactive IDE:** `GET /graphiql` — available in development and when `ENABLE_GRAPHIQL=true` in production.

---

## 2. Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://prs-builder-api.herokuapp.com` |
| Development | `http://localhost:3000` |

All requests go to:
```
POST <BASE_URL>/graphql
```

---

## 3. Authentication

The API uses **JWT Bearer tokens**.

### Getting a Token

Call the `loginUser` or `registerUser` mutation. The response includes a `token` field. Store it — you'll need it for all authenticated requests.

Google OAuth is also supported via `googleOauthLogin`.

### Using a Token

Include the token in the `Authorization` header on every request:

```
Authorization: Bearer <your_jwt_token>
```

### Token Revocation

Tokens are tied to a `jti` (JWT ID) stored in the database. Logging out (`logout` clears the client-side token — regenerating `jti` server-side on next login) invalidates old tokens. There is no explicit server-side logout mutation — simply discard the token on the client.

### Which operations require auth?

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public — no token needed |
| 🔒 | Requires a valid JWT token |

---

## 4. Making Requests

### Request Format

```
POST /graphql
Content-Type: application/json
Authorization: Bearer <token>   (when required)

{
  "query": "query { ... }",
  "variables": { ... },
  "operationName": "OptionalNameIfMultipleOps"
}
```

### Example — Fetch Listings (curl)

```bash
curl -X POST https://prs-builder-api.herokuapp.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetListings($limit: Int) { listings(limit: $limit) { id title priceCents user { username } component { name } } }",
    "variables": { "limit": 20 }
  }'
```

### Example — Login (curl)

```bash
curl -X POST https://prs-builder-api.herokuapp.com/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation Login($email: String!, $password: String!) { loginUser(email: $email, password: $password) { token user { id email username } errors } }",
    "variables": { "email": "shooter@example.com", "password": "hunter2" }
  }'
```

---

## 5. Error Handling

### GraphQL Errors (validation / field errors)

Returned in the top-level `errors` array:

```json
{
  "errors": [
    {
      "message": "You need to sign in or sign up before continuing.",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["currentUser"]
    }
  ],
  "data": { "currentUser": null }
}
```

### Mutation Errors (business logic errors)

Most mutations return an `errors: [String]` field alongside the data. Check this field:

```json
{
  "data": {
    "loginUser": {
      "token": null,
      "user": null,
      "errors": ["Invalid email or password"]
    }
  }
}
```

### HTTP Errors

| Status | Meaning |
|--------|---------|
| `200` | Always returned for GraphQL responses (even on error) |
| `500` | Server-side exception (development only — includes backtrace) |

---

## 6. Queries

### 🔓 `components`

Fetch the component catalog with optional filtering and pagination.

```graphql
query GetComponents(
  $search: String
  $type: String
  $manufacturerId: ID
  $activeOnly: Boolean
  $limit: Int
  $offset: Int
) {
  components(
    search: $search
    type: $type
    manufacturerId: $manufacturerId
    activeOnly: $activeOnly
    limit: $limit
    offset: $offset
  ) {
    id
    name
    type
    weightOz
    msrpCents
    imageUrl
    discontinued
    manufacturer {
      id
      name
    }
  }
}
```

| Argument | Type | Description |
|----------|------|-------------|
| `search` | `String` | Case-insensitive name search |
| `type` | `String` | Filter by category (see `componentTypes`) |
| `manufacturerId` | `ID` | Filter by manufacturer |
| `activeOnly` | `Boolean` | Exclude discontinued components |
| `limit` | `Int` | Max results to return |
| `offset` | `Int` | Pagination offset |

---

### 🔓 `component(id: ID!)`

Fetch a single component by ID.

```graphql
query GetComponent($id: ID!) {
  component(id: $id) {
    id
    name
    type
    weightOz
    msrpCents
    imageUrl
    specs
    manufacturer { id name website }
  }
}
```

---

### 🔓 `componentTypes`

Returns the list of valid component category strings.

```graphql
query { componentTypes }
```

**Response:** `["action", "barrel", "stock", "chassis", "trigger", "scope", "mount", "rings", "bipod", "muzzle_device", "grip", "magazine", "buttpad", "cheek_riser", "other"]`

---

### 🔓 `manufacturers`

Fetch manufacturers with optional search.

```graphql
query GetManufacturers($search: String, $limit: Int) {
  manufacturers(search: $search, limit: $limit) {
    id
    name
    country
    website
    imageUrl
    components { id name type }
  }
}
```

---

### 🔓 `manufacturer(id: ID!)`

Fetch a single manufacturer by ID.

---

### 🔒 `builds`

Fetch the current user's builds.

```graphql
query GetBuilds($search: String, $discipline: String) {
  builds(search: $search, discipline: $discipline) {
    id
    name
    discipline
    totalWeightOz
    totalCostCents
    newCostCents
    ownedCostCents
    buildComponents {
      id
      position
      owned
      component { id name type weightOz msrpCents imageUrl manufacturer { name } }
    }
    createdAt
  }
}
```

| Argument | Type | Description |
|----------|------|-------------|
| `search` | `String` | Filter builds by name |
| `discipline` | `String` | Filter by discipline (prs, nrl, benchrest, f-class, tactical, hunting) |

---

### 🔒 `build(id: ID!)`

Fetch a single build (scoped to current user).

---

### 🔒 `currentUser`

Fetch the authenticated user's full profile.

```graphql
query GetCurrentUser {
  currentUser {
    id
    email
    username
    fullName
    phoneNumber
    bio
    location
    avatarUrl
    preferredDiscipline
    website
    socialLinks
    notificationPreferences
    role
    isAdmin
    buildsCount
    createdAt
  }
}
```

---

### 🔓 `projectiles`

Fetch the projectile catalog.

```graphql
query GetProjectiles($caliber: String, $manufacturer: String) {
  projectiles(caliber: $caliber, manufacturer: $manufacturer) {
    id
    name
    manufacturer
    weightGrains
    caliberInches
    bcG1
    bcG7
    bulletType
    recommendedTwist
  }
}
```

| Argument | Type | Description |
|----------|------|-------------|
| `caliber` | `String` | Cartridge name e.g. `"6.5 Creedmoor"` — maps to a diameter |
| `caliberInches` | `Float` | Filter by exact bullet diameter |
| `manufacturer` | `String` | Filter by projectile manufacturer name |

---

### 🔓 `projectileManufacturers`

Returns a list of projectile manufacturer name strings.

---

### 🔓 `cartridgeDiameters`

Returns a JSON map of cartridge names to bullet diameters (inches). Useful for populating caliber dropdowns.

---

### 🔓 `calibers`

Returns the list of supported PRS/long-range caliber strings.

---

### 🔓 `disciplines`

Returns the list of supported shooting discipline strings.

---

### 🔒 `ballisticProfiles(buildId: ID!)`

Fetch all ballistic profiles for a build (ordered newest first).

```graphql
query GetBallisticProfiles($buildId: ID!) {
  ballisticProfiles(buildId: $buildId) {
    id
    name
    caliber
    muzzleVelocityFps
    zeroDistanceYards
    bulletWeightGrains
    bulletBc
    bcType
    ballisticDrops {
      distanceYards
      dropInches
      dropMoa
      dropMils
      windageInches
      windageMoa
      windageMils
      velocityFps
      energyFtLbs
      timeOfFlightSec
    }
    loadTests {
      id
      chargeGrains
      distanceYards
      velocityFps
      groupSizeInches
      groupSizeMoa
      notes
    }
  }
}
```

---

### 🔒 `ballisticProfile(id: ID!)`

Fetch a single ballistic profile with all drop and load test data.

---

### 🔓 `listings`

Fetch active marketplace listings.

```graphql
query GetListings($listingType: String, $search: String, $limit: Int, $offset: Int) {
  listings(listingType: $listingType, search: $search, limit: $limit, offset: $offset) {
    id
    title
    description
    listingType
    status
    condition
    priceCents
    location
    imageUrl
    createdAt
    user { id username avatarUrl location }
    component { id name type imageUrl manufacturer { name } }
  }
}
```

| Argument | Type | Description |
|----------|------|-------------|
| `listingType` | `String` | `"showcase"` or `"for_sale"` |
| `search` | `String` | Search by listing title or component name |
| `limit` | `Int` | Default: 50 |
| `offset` | `Int` | Default: 0 |

---

### 🔓 `listing(id: ID!)`

Fetch a single active listing.

---

### 🔒 `myListings`

Fetch all listings belonging to the current user (all statuses — active, sold, removed).

---

### 🔒 `myConversations`

Fetch all conversations for the current user, ordered by most recent activity.

```graphql
query GetMyConversations {
  myConversations {
    id
    lastMessageAt
    unreadCount
    listing { id title }
    buyer { id username avatarUrl }
    seller { id username avatarUrl }
    latestMessage { id body createdAt user { username } }
  }
}
```

---

### 🔒 `conversation(id: ID!)`

Fetch a single full conversation thread. Returns `null` if the current user is not a participant.

```graphql
query GetConversation($id: ID!) {
  conversation(id: $id) {
    id
    listing { id title }
    buyer { id username }
    seller { id username }
    messages {
      id
      body
      read
      createdAt
      user { id username avatarUrl }
    }
  }
}
```

---

### 🔒 `myUnreadCount`

Returns the total number of unread messages across all the user's conversations. Used for the navigation badge.

```graphql
query GetMyUnreadCount {
  myUnreadCount
}
```

---

## 7. Mutations

### Auth

#### 🔓 `registerUser`

```graphql
mutation Register(
  $email: String!
  $password: String!
  $passwordConfirmation: String!
  $username: String!
  $fullName: String
  $phoneNumber: String
) {
  registerUser(
    email: $email
    password: $password
    passwordConfirmation: $passwordConfirmation
    username: $username
    fullName: $fullName
    phoneNumber: $phoneNumber
  ) {
    token
    user { id email username }
    errors
  }
}
```

#### 🔓 `loginUser`

```graphql
mutation Login($email: String!, $password: String!) {
  loginUser(email: $email, password: $password) {
    token
    user { id email username role isAdmin }
    errors
  }
}
```

#### 🔓 `googleOauthLogin`

```graphql
mutation GoogleLogin($idToken: String!) {
  googleOauthLogin(idToken: $idToken) {
    token
    user { id email username }
    errors
  }
}
```

---

### User Account

#### 🔒 `updateUserProfile`

```graphql
mutation UpdateProfile(
  $fullName: String
  $username: String
  $bio: String
  $location: String
  $avatarUrl: String
  $preferredDiscipline: String
  $website: String
  $phoneNumber: String
  $dateOfBirth: ISO8601Date
  $socialLinks: JSON
  $notificationPreferences: JSON
) {
  updateUserProfile(...) {
    user { id username fullName bio location avatarUrl }
    errors
  }
}
```

#### 🔒 `changePassword`

```graphql
mutation ChangePassword(
  $currentPassword: String!
  $newPassword: String!
  $newPasswordConfirmation: String!
) {
  changePassword(
    currentPassword: $currentPassword
    newPassword: $newPassword
    newPasswordConfirmation: $newPasswordConfirmation
  ) {
    success
    errors
  }
}
```

#### 🔒 `deleteAccount`

```graphql
mutation DeleteAccount($password: String!) {
  deleteAccount(password: $password) {
    success
    errors
  }
}
```

---

### Builds

#### 🔒 `createBuild`

```graphql
mutation CreateBuild($name: String!, $discipline: String) {
  createBuild(name: $name, discipline: $discipline) {
    build { id name discipline }
    errors
  }
}
```

#### 🔒 `updateBuild`

```graphql
mutation UpdateBuild($id: ID!, $name: String, $discipline: String) {
  updateBuild(id: $id, name: $name, discipline: $discipline) {
    build { id name discipline }
    errors
  }
}
```

#### 🔒 `deleteBuild`

```graphql
mutation DeleteBuild($id: ID!) {
  deleteBuild(id: $id) {
    success
    errors
  }
}
```

---

### Build Components

#### 🔒 `addComponentToBuild`

```graphql
mutation AddComponent($buildId: ID!, $componentId: ID!, $position: String, $owned: Boolean) {
  addComponentToBuild(
    buildId: $buildId
    componentId: $componentId
    position: $position
    owned: $owned
  ) {
    build {
      id totalWeightOz totalCostCents newCostCents
      buildComponents { id position owned component { id name } }
    }
    errors
  }
}
```

#### 🔒 `updateBuildComponent`

Update `position`, `owned`, or `specs` on a build component.

```graphql
mutation UpdateBuildComponent($id: ID!, $position: String, $owned: Boolean, $specs: JSON) {
  updateBuildComponent(id: $id, position: $position, owned: $owned, specs: $specs) {
    buildComponent { id position owned specs }
    errors
  }
}
```

#### 🔒 `removeComponentFromBuild`

```graphql
mutation RemoveComponent($id: ID!) {
  removeComponentFromBuild(id: $id) {
    build { id totalWeightOz totalCostCents }
    errors
  }
}
```

---

### Ballistic Profiles

#### 🔒 `createBallisticProfile`

```graphql
mutation CreateProfile(
  $buildId: ID!
  $name: String!
  $caliber: String!
  $muzzleVelocityFps: Int!
  $bulletWeightGrains: Float!
  $bulletBc: Float!
  $bcType: String
  $zeroDistanceYards: Int
  $sightHeightInches: Float
  $projectileId: ID
  $temperatureF: Int
  $altitudeFeet: Int
  $windSpeedMph: Int
  $windAngleDegrees: Int
) {
  createBallisticProfile(
    buildId: $buildId
    name: $name
    caliber: $caliber
    muzzleVelocityFps: $muzzleVelocityFps
    bulletWeightGrains: $bulletWeightGrains
    bulletBc: $bulletBc
    bcType: $bcType
    zeroDistanceYards: $zeroDistanceYards
    sightHeightInches: $sightHeightInches
    projectileId: $projectileId
    temperatureF: $temperatureF
    altitudeFeet: $altitudeFeet
    windSpeedMph: $windSpeedMph
    windAngleDegrees: $windAngleDegrees
  ) {
    ballisticProfile { id name caliber }
    errors
  }
}
```

#### 🔒 `updateBallisticProfile`

Same arguments as `createBallisticProfile` plus `id: ID!`, minus `buildId`. Returns `{ ballisticProfile, errors }`.

#### 🔒 `deleteBallisticProfile`

```graphql
mutation DeleteProfile($id: ID!) {
  deleteBallisticProfile(id: $id) {
    success
    errors
  }
}
```

---

### Ballistic Calculator

#### 🔒 `generateDopeTable`

Runs the physics-based trajectory calculator for a ballistic profile and persists the results as `BallisticDrop` records.

```graphql
mutation GenerateDope($profileId: ID!, $maxDistance: Int, $step: Int) {
  generateDopeTable(profileId: $profileId, maxDistance: $maxDistance, step: $step) {
    ballisticProfile {
      id
      ballisticDrops {
        distanceYards
        dropInches dropMoa dropMils
        windageInches windageMoa windageMils
        velocityFps energyFtLbs timeOfFlightSec
      }
    }
    errors
  }
}
```

| Argument | Default | Description |
|----------|---------|-------------|
| `profileId` | required | Profile to calculate for |
| `maxDistance` | `1500` | Maximum range in yards |
| `step` | `25` | Output interval in yards |

---

### Ballistic Drops

#### 🔒 `upsertBallisticDrop`

Insert or update a single drop data point (identified by `profileId` + `distanceYards`).

#### 🔒 `bulkUpsertBallisticDrops`

Insert or update multiple drop data points in one call. Accepts an array of drop inputs.

#### 🔒 `deleteBallisticDrop`

```graphql
mutation DeleteDrop($id: ID!) {
  deleteBallisticDrop(id: $id) { success errors }
}
```

---

### Load Tests

#### 🔒 `upsertLoadTest`

Insert or update a load development data point for a ballistic profile.

```graphql
mutation UpsertLoadTest(
  $ballisticProfileId: ID!
  $chargeGrains: Float!
  $distanceYards: Int
  $velocityFps: Int
  $groupSizeInches: Float
  $notes: String
) {
  upsertLoadTest(...) {
    loadTest { id chargeGrains velocityFps groupSizeInches groupSizeMoa }
    errors
  }
}
```

#### 🔒 `deleteLoadTest`

```graphql
mutation DeleteLoadTest($id: ID!) {
  deleteLoadTest(id: $id) { success errors }
}
```

---

### Marketplace Listings

#### 🔒 `createListing`

```graphql
mutation CreateListing(
  $componentId: ID!
  $title: String!
  $description: String
  $listingType: String!
  $condition: String!
  $priceCents: Int
  $location: String
  $contactInfo: String
  $imageUrl: String
  $buildComponentId: ID
) {
  createListing(...) {
    listing { id title status listingType priceCents }
    errors
  }
}
```

**`listingType`** values: `"showcase"` | `"for_sale"`  
**`condition`** values: `"new_condition"` | `"like_new"` | `"good"` | `"fair"`

#### 🔒 `updateListing`

Same arguments as `createListing` plus `id: ID!`. Returns `{ listing, errors }`.

#### 🔒 `deleteListing`

```graphql
mutation DeleteListing($id: ID!) {
  deleteListing(id: $id) { success errors }
}
```

---

### Messaging

#### 🔒 `startConversation`

Initiates a conversation thread between the current user (buyer) and a listing's owner (seller). Returns the existing conversation if one already exists for this listing + buyer pair.

```graphql
mutation StartConversation($listingId: ID!, $initialMessage: String!) {
  startConversation(listingId: $listingId, initialMessage: $initialMessage) {
    conversation {
      id
      listing { id title }
      seller { id username }
      messages { id body createdAt }
    }
    errors
  }
}
```

#### 🔒 `sendMessage`

```graphql
mutation SendMessage($conversationId: ID!, $body: String!) {
  sendMessage(conversationId: $conversationId, body: $body) {
    message { id body read createdAt user { username } }
    errors
  }
}
```

#### 🔒 `markConversationRead`

Marks all unread messages in a conversation as read (for the current user).

```graphql
mutation MarkRead($conversationId: ID!) {
  markConversationRead(conversationId: $conversationId) {
    success
    errors
  }
}
```

---

## 8. Type Reference

### `User`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `email` | `String!` | |
| `username` | `String!` | Unique |
| `fullName` | `String` | |
| `phoneNumber` | `String` | |
| `bio` | `String` | Max 500 chars |
| `location` | `String` | |
| `avatarUrl` | `String` | |
| `dateOfBirth` | `ISO8601Date` | |
| `preferredDiscipline` | `String` | |
| `website` | `String` | |
| `socialLinks` | `JSON` | Free-form key-value |
| `notificationPreferences` | `JSON` | |
| `role` | `String!` | `"user"` or `"admin"` |
| `isAdmin` | `Boolean!` | |
| `isOauthUser` | `Boolean!` | |
| `buildsCount` | `Int!` | |
| `builds` | `[Build!]!` | |
| `createdAt` | `ISO8601DateTime!` | |

### `Build`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `name` | `String!` | |
| `discipline` | `String` | One of the `disciplines` enum |
| `totalWeightOz` | `Float` | Auto-computed |
| `totalCostCents` | `Int` | Auto-computed |
| `newCostCents` | `Int!` | Cost of unowned components |
| `ownedCostCents` | `Int!` | Cost of owned components |
| `user` | `User!` | |
| `buildComponents` | `[BuildComponent!]!` | |
| `components` | `[Component!]!` | |
| `ballisticProfiles` | `[BallisticProfile!]!` | |

### `Component`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `name` | `String!` | |
| `type` | `String` | Category (see `componentTypes`) |
| `weightOz` | `Float` | |
| `msrpCents` | `Int` | |
| `imageUrl` | `String` | |
| `specs` | `JSON` | Flexible key-value attributes |
| `discontinued` | `Boolean` | |
| `manufacturer` | `Manufacturer!` | |

### `Listing`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `title` | `String!` | Max 120 chars |
| `description` | `String` | Max 2000 chars |
| `listingType` | `String!` | `showcase` or `for_sale` |
| `status` | `String!` | `active`, `sold`, or `removed` |
| `condition` | `String!` | `new_condition`, `like_new`, `good`, `fair` |
| `priceCents` | `Int` | `null` for showcase listings |
| `location` | `String` | |
| `contactInfo` | `String` | |
| `imageUrl` | `String` | |
| `user` | `User!` | Seller |
| `component` | `Component!` | |
| `buildComponent` | `BuildComponent` | Optional — if listed from a build |

### `Conversation`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `listing` | `Listing!` | |
| `buyer` | `User!` | The user who initiated |
| `seller` | `User!` | The listing owner |
| `messages` | `[Message!]!` | Ordered chronologically |
| `latestMessage` | `Message` | |
| `lastMessageAt` | `ISO8601DateTime` | |
| `unreadCount` | `Int!` | Unread for the requesting user |

### `Message`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `body` | `String!` | |
| `read` | `Boolean!` | |
| `user` | `User!` | Sender |
| `createdAt` | `ISO8601DateTime!` | |

### `BallisticProfile`

Key fields — see full schema via GraphiQL for all atmospheric inputs.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `ID!` | |
| `name` | `String!` | |
| `caliber` | `String!` | |
| `muzzleVelocityFps` | `Int` | |
| `bulletWeightGrains` | `Float` | |
| `bulletBc` | `Float` | |
| `bcType` | `String` | `"G1"` or `"G7"` |
| `zeroDistanceYards` | `Int` | |
| `ballisticDrops` | `[BallisticDrop!]!` | |
| `loadTests` | `[LoadTest!]!` | |

### `BallisticDrop`

| Field | Type |
|-------|------|
| `distanceYards` | `Int` |
| `dropInches` | `Float` |
| `dropMoa` | `Float` |
| `dropMils` | `Float` |
| `windageInches` | `Float` |
| `windageMoa` | `Float` |
| `windageMils` | `Float` |
| `velocityFps` | `Int` |
| `energyFtLbs` | `Int` |
| `timeOfFlightSec` | `Float` |
| `isVerified` | `Boolean` |
