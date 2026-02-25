import { gql } from '@apollo/client/core';

// ============================================
// Authentication Mutations
// ============================================

export const REGISTER_USER = gql`
  mutation RegisterUser(
    $email: String!
    $password: String!
    $passwordConfirmation: String!
    $username: String!
    $fullName: String
    $phoneNumber: String
  ) {
    registerUser(
      input: {
        email: $email
        password: $password
        passwordConfirmation: $passwordConfirmation
        username: $username
        fullName: $fullName
        phoneNumber: $phoneNumber
      }
    ) {
      token
      user {
        id
        email
        username
        fullName
        phoneNumber
        avatarUrl
        bio
        location
        website
        socialLinks
        notificationPreferences
        isOauthUser
        provider
        buildsCount
        createdAt
      }
      errors
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        username
        fullName
        phoneNumber
        avatarUrl
        bio
        location
        website
        socialLinks
        notificationPreferences
        isOauthUser
        provider
        buildsCount
        createdAt
      }
      errors
    }
  }
`;

export const GOOGLE_OAUTH_LOGIN = gql`
  mutation GoogleOauthLogin($accessToken: String!) {
    googleOauthLogin(input: { accessToken: $accessToken }) {
      token
      user {
        id
        email
        username
        fullName
        avatarUrl
        bio
        location
        website
        socialLinks
        notificationPreferences
        isOauthUser
        provider
        buildsCount
        createdAt
      }
      errors
    }
  }
`;

// ============================================
// User Queries
// ============================================

export const GET_CURRENT_USER = gql`
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
      dateOfBirth
      preferredDiscipline
      website
      socialLinks
      notificationPreferences
      isOauthUser
      provider
      role
      isAdmin
      buildsCount
      createdAt
    }
  }
`;

// ============================================
// Component Queries
// ============================================

export const GET_COMPONENTS = gql`
  query GetComponents {
    components {
      id
      name
      type
      weightOz
      msrpCents
      discontinued
      imageUrl
      specs
      manufacturer {
        id
        name
        country
      }
    }
  }
`;

export const GET_COMPONENT = gql`
  query GetComponent($id: ID!) {
    component(id: $id) {
      id
      name
      type
      weightOz
      msrpCents
      discontinued
      imageUrl
      specs
      manufacturer {
        id
        name
        website
        country
      }
    }
  }
`;

// ============================================
// Manufacturer Queries
// ============================================

export const GET_MANUFACTURERS = gql`
  query GetManufacturers {
    manufacturers {
      id
      name
      website
      country
      imageUrl
    }
  }
`;

export const GET_MANUFACTURER = gql`
  query GetManufacturer($id: ID!) {
    manufacturer(id: $id) {
      id
      name
      website
      country
      imageUrl
      components {
        id
        name
        type
        weightOz
        msrpCents
        imageUrl
        discontinued
      }
    }
  }
`;

// ============================================
// Build Queries
// ============================================

export const GET_BUILDS = gql`
  query GetBuilds {
    builds {
      id
      name
      discipline
      totalWeightOz
      totalCostCents
      newCostCents
      ownedCostCents
      createdAt
      buildComponents {
        id
        position
        owned
        component {
          id
          name
          type
        }
      }
    }
  }
`;

export const GET_BUILD = gql`
  query GetBuild($id: ID!) {
    build(id: $id) {
      id
      name
      discipline
      totalWeightOz
      totalCostCents
      newCostCents
      ownedCostCents
      createdAt
      updatedAt
      buildComponents {
        id
        position
        specs
        owned
        component {
          id
          name
          type
          weightOz
          msrpCents
          imageUrl
          manufacturer {
            id
            name
          }
        }
      }
    }
  }
`;

// ============================================
// Build Mutations
// ============================================

export const CREATE_BUILD = gql`
  mutation CreateBuild($name: String!, $discipline: String) {
    createBuild(input: { name: $name, discipline: $discipline }) {
      id
      name
      discipline
      totalWeightOz
      totalCostCents
      createdAt
    }
  }
`;

export const UPDATE_BUILD = gql`
  mutation UpdateBuild($id: ID!, $name: String, $discipline: String) {
    updateBuild(input: { id: $id, name: $name, discipline: $discipline }) {
      id
      name
      discipline
      updatedAt
    }
  }
`;

export const DELETE_BUILD = gql`
  mutation DeleteBuild($id: ID!) {
    deleteBuild(input: { id: $id }) {
      success
      errors
    }
  }
`;

// ============================================
// Build Component Mutations
// ============================================

export const ADD_COMPONENT_TO_BUILD = gql`
  mutation AddComponentToBuild(
    $buildId: ID!
    $componentId: ID!
    $position: String
    $specs: JSON
    $owned: Boolean
  ) {
    addComponentToBuild(
      input: {
        buildId: $buildId
        componentId: $componentId
        position: $position
        specs: $specs
        owned: $owned
      }
    ) {
      id
      position
      specs
      owned
      component {
        id
        name
        type
        weightOz
        msrpCents
      }
      build {
        id
        totalWeightOz
        totalCostCents
        newCostCents
        ownedCostCents
      }
    }
  }
`;

export const REMOVE_COMPONENT_FROM_BUILD = gql`
  mutation RemoveComponentFromBuild($buildComponentId: ID!) {
    removeComponentFromBuild(input: { buildComponentId: $buildComponentId }) {
      success
      errors
    }
  }
`;

export const UPDATE_BUILD_COMPONENT = gql`
  mutation UpdateBuildComponent(
    $id: ID!
    $owned: Boolean
    $position: String
    $specs: JSON
  ) {
    updateBuildComponent(
      input: { id: $id, owned: $owned, position: $position, specs: $specs }
    ) {
      id
      position
      specs
      owned
      component {
        id
        name
        type
        weightOz
        msrpCents
      }
      build {
        id
        totalWeightOz
        totalCostCents
        newCostCents
        ownedCostCents
      }
    }
  }
`;

// ============================================
// User Account Mutations
// ============================================

export const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile(
    $username: String
    $fullName: String
    $phoneNumber: String
    $bio: String
    $location: String
    $avatarUrl: String
    $dateOfBirth: ISO8601Date
    $preferredDiscipline: String
    $website: String
    $socialLinks: JSON
    $notificationPreferences: JSON
  ) {
    updateUserProfile(
      input: {
        username: $username
        fullName: $fullName
        phoneNumber: $phoneNumber
        bio: $bio
        location: $location
        avatarUrl: $avatarUrl
        dateOfBirth: $dateOfBirth
        preferredDiscipline: $preferredDiscipline
        website: $website
        socialLinks: $socialLinks
        notificationPreferences: $notificationPreferences
      }
    ) {
      user {
        id
        email
        username
        fullName
        phoneNumber
        bio
        location
        avatarUrl
        dateOfBirth
        preferredDiscipline
        website
        socialLinks
        notificationPreferences
        isOauthUser
        provider
      }
      errors
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword(
    $currentPassword: String!
    $newPassword: String!
    $newPasswordConfirmation: String!
  ) {
    changePassword(
      input: {
        currentPassword: $currentPassword
        newPassword: $newPassword
        newPasswordConfirmation: $newPasswordConfirmation
      }
    ) {
      success
      errors
    }
  }
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($password: String, $confirmation: String!) {
    deleteAccount(input: { password: $password, confirmation: $confirmation }) {
      success
      errors
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile {
    currentUser {
      id
      email
      username
      fullName
      phoneNumber
      bio
      location
      avatarUrl
      dateOfBirth
      preferredDiscipline
      website
      socialLinks
      notificationPreferences
      isOauthUser
      provider
      buildsCount
      createdAt
      updatedAt
    }
  }
`;

// ============================================
// Ballistic Profile Queries
// ============================================

export const GET_BALLISTIC_PROFILES = gql`
  query GetBallisticProfiles($buildId: ID!) {
    ballisticProfiles(buildId: $buildId) {
      id
      name
      caliber
      bulletWeightGrains
      bulletBc
      bcType
      muzzleVelocityFps
      zeroDistanceYards
      sightHeightInches
      twistRate
      barrelLengthInches
      altitudeFeet
      temperatureF
      humidityPercent
      pressureInhg
      windSpeedMph
      windAngleDegrees
      notes
      projectileId
      projectile {
        id
        manufacturer
        name
        displayName
      }
      createdAt
      updatedAt
      ballisticDrops {
        id
        distanceYards
        dropMoa
        dropMils
        dropInches
        windageMoa
        windageMils
        windageInches
        velocityFps
        energyFtLbs
        timeOfFlightSec
        isVerified
        notes
      }
      loadTests {
        id
        chargeGrains
        velocityFps
        groupSizeMoa
        groupSizeInches
        distanceYards
        notes
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_BALLISTIC_PROFILE = gql`
  query GetBallisticProfile($id: ID!) {
    ballisticProfile(id: $id) {
      id
      name
      caliber
      bulletWeightGrains
      bulletBc
      bcType
      muzzleVelocityFps
      zeroDistanceYards
      sightHeightInches
      twistRate
      barrelLengthInches
      altitudeFeet
      temperatureF
      humidityPercent
      pressureInhg
      windSpeedMph
      windAngleDegrees
      notes
      projectileId
      projectile {
        id
        manufacturer
        name
        displayName
        weightGrains
        bcG1
        bcG7
        baseType
        bulletType
      }
      availableCalibers
      createdAt
      updatedAt
      build {
        id
        name
      }
      ballisticDrops {
        id
        distanceYards
        dropMoa
        dropMils
        dropInches
        windageMoa
        windageMils
        windageInches
        velocityFps
        energyFtLbs
        timeOfFlightSec
        isVerified
        notes
      }
      loadTests {
        id
        chargeGrains
        velocityFps
        groupSizeMoa
        groupSizeInches
        distanceYards
        notes
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_CALIBERS = gql`
  query GetCalibers {
    calibers
  }
`;

// ============================================
// Projectile Queries
// ============================================

export const GET_PROJECTILES = gql`
  query GetProjectiles($caliber: String, $caliberInches: Float, $manufacturer: String) {
    projectiles(caliber: $caliber, caliberInches: $caliberInches, manufacturer: $manufacturer) {
      id
      manufacturer
      name
      caliberInches
      weightGrains
      bcG1
      bcG7
      bulletType
      baseType
      recommendedTwist
      displayName
    }
  }
`;

export const GET_PROJECTILE_MANUFACTURERS = gql`
  query GetProjectileManufacturers {
    projectileManufacturers
  }
`;

export const GET_CARTRIDGE_DIAMETERS = gql`
  query GetCartridgeDiameters {
    cartridgeDiameters
  }
`;

// ============================================
// Ballistic Profile Mutations
// ============================================

export const CREATE_BALLISTIC_PROFILE = gql`
  mutation CreateBallisticProfile(
    $buildId: ID!
    $name: String!
    $caliber: String!
    $projectileId: ID
    $bulletWeightGrains: Float
    $bulletBc: Float
    $bcType: String
    $muzzleVelocityFps: Int
    $zeroDistanceYards: Int
    $sightHeightInches: Float
    $twistRate: String
    $barrelLengthInches: Float
    $altitudeFeet: Int
    $temperatureF: Int
    $humidityPercent: Int
    $pressureInhg: Float
    $windSpeedMph: Int
    $windAngleDegrees: Int
    $notes: String
  ) {
    createBallisticProfile(
      input: {
        buildId: $buildId
        name: $name
        caliber: $caliber
        projectileId: $projectileId
        bulletWeightGrains: $bulletWeightGrains
        bulletBc: $bulletBc
        bcType: $bcType
        muzzleVelocityFps: $muzzleVelocityFps
        zeroDistanceYards: $zeroDistanceYards
        sightHeightInches: $sightHeightInches
        twistRate: $twistRate
        barrelLengthInches: $barrelLengthInches
        altitudeFeet: $altitudeFeet
        temperatureF: $temperatureF
        humidityPercent: $humidityPercent
        pressureInhg: $pressureInhg
        windSpeedMph: $windSpeedMph
        windAngleDegrees: $windAngleDegrees
        notes: $notes
      }
    ) {
      id
      name
      caliber
      projectileId
      bulletWeightGrains
      bulletBc
      bcType
      createdAt
    }
  }
`;

export const UPDATE_BALLISTIC_PROFILE = gql`
  mutation UpdateBallisticProfile(
    $id: ID!
    $name: String
    $caliber: String
    $bulletWeightGrains: Float
    $bulletBc: Float
    $bcType: String
    $muzzleVelocityFps: Int
    $zeroDistanceYards: Int
    $sightHeightInches: Float
    $twistRate: String
    $barrelLengthInches: Float
    $altitudeFeet: Int
    $temperatureF: Int
    $humidityPercent: Int
    $pressureInhg: Float
    $windSpeedMph: Int
    $windAngleDegrees: Int
    $notes: String
  ) {
    updateBallisticProfile(
      input: {
        id: $id
        name: $name
        caliber: $caliber
        bulletWeightGrains: $bulletWeightGrains
        bulletBc: $bulletBc
        bcType: $bcType
        muzzleVelocityFps: $muzzleVelocityFps
        zeroDistanceYards: $zeroDistanceYards
        sightHeightInches: $sightHeightInches
        twistRate: $twistRate
        barrelLengthInches: $barrelLengthInches
        altitudeFeet: $altitudeFeet
        temperatureF: $temperatureF
        humidityPercent: $humidityPercent
        pressureInhg: $pressureInhg
        windSpeedMph: $windSpeedMph
        windAngleDegrees: $windAngleDegrees
        notes: $notes
      }
    ) {
      id
      name
      caliber
      updatedAt
    }
  }
`;

export const DELETE_BALLISTIC_PROFILE = gql`
  mutation DeleteBallisticProfile($id: ID!) {
    deleteBallisticProfile(input: { id: $id }) {
      success
      errors
    }
  }
`;

// ============================================
// Ballistic Drop Mutations
// ============================================

export const UPSERT_BALLISTIC_DROP = gql`
  mutation UpsertBallisticDrop(
    $ballisticProfileId: ID!
    $distanceYards: Int!
    $dropInches: Float
    $dropMoa: Float
    $dropMils: Float
    $windageInches: Float
    $windageMoa: Float
    $windageMils: Float
    $velocityFps: Int
    $energyFtLbs: Int
    $timeOfFlightSec: Float
    $isVerified: Boolean
    $notes: String
  ) {
    upsertBallisticDrop(
      input: {
        ballisticProfileId: $ballisticProfileId
        distanceYards: $distanceYards
        dropInches: $dropInches
        dropMoa: $dropMoa
        dropMils: $dropMils
        windageInches: $windageInches
        windageMoa: $windageMoa
        windageMils: $windageMils
        velocityFps: $velocityFps
        energyFtLbs: $energyFtLbs
        timeOfFlightSec: $timeOfFlightSec
        isVerified: $isVerified
        notes: $notes
      }
    ) {
      id
      distanceYards
      dropMoa
      dropMils
      dropInches
      windageMoa
      windageMils
      windageInches
      velocityFps
      energyFtLbs
      timeOfFlightSec
      isVerified
      notes
    }
  }
`;

export const BULK_UPSERT_BALLISTIC_DROPS = gql`
  mutation BulkUpsertBallisticDrops(
    $ballisticProfileId: ID!
    $drops: [DropInput!]!
  ) {
    bulkUpsertBallisticDrops(
      input: {
        ballisticProfileId: $ballisticProfileId
        drops: $drops
      }
    ) {
      ballisticProfile {
        id
        ballisticDrops {
          id
          distanceYards
          dropMoa
          dropMils
          dropInches
          windageMoa
          windageMils
          windageInches
          velocityFps
          energyFtLbs
          timeOfFlightSec
          isVerified
          notes
        }
      }
      errors
    }
  }
`;

export const DELETE_BALLISTIC_DROP = gql`
  mutation DeleteBallisticDrop($id: ID!) {
    deleteBallisticDrop(input: { id: $id }) {
      success
      errors
    }
  }
`;

// ============================================
// Ballistic Calculator Mutations
// ============================================

export const GENERATE_DOPE_TABLE = gql`
  mutation GenerateDopeTable(
    $ballisticProfileId: ID!
    $maxDistance: Int
    $step: Int
  ) {
    generateDopeTable(
      input: {
        ballisticProfileId: $ballisticProfileId
        maxDistance: $maxDistance
        step: $step
      }
    ) {
      ballisticProfile {
        id
        ballisticDrops {
          id
          distanceYards
          dropMoa
          dropMils
          dropInches
          windageMoa
          windageMils
          windageInches
          velocityFps
          energyFtLbs
          timeOfFlightSec
          isVerified
          notes
        }
      }
      errors
    }
  }
`;

// ============================================
// Load Test Mutations
// ============================================

export const UPSERT_LOAD_TEST = gql`
  mutation UpsertLoadTest(
    $ballisticProfileId: ID!
    $id: ID
    $chargeGrains: Float
    $velocityFps: Int
    $groupSizeMoa: Float
    $groupSizeInches: Float
    $distanceYards: Int
    $notes: String
  ) {
    upsertLoadTest(
      input: {
        ballisticProfileId: $ballisticProfileId
        id: $id
        chargeGrains: $chargeGrains
        velocityFps: $velocityFps
        groupSizeMoa: $groupSizeMoa
        groupSizeInches: $groupSizeInches
        distanceYards: $distanceYards
        notes: $notes
      }
    ) {
      id
      chargeGrains
      velocityFps
      groupSizeMoa
      groupSizeInches
      distanceYards
      notes
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_LOAD_TEST = gql`
  mutation DeleteLoadTest($id: ID!) {
    deleteLoadTest(input: { id: $id }) {
      success
      errors
    }
  }
`;

// ============================================
// Marketplace Queries
// ============================================

const LISTING_FIELDS = gql`
  fragment ListingFields on Listing {
    id
    title
    description
    listingType
    status
    condition
    priceCents
    location
    contactInfo
    imageUrl
    createdAt
    updatedAt
    user {
      id
      username
      avatarUrl
      location
    }
    component {
      id
      name
      type
      weightOz
      msrpCents
      imageUrl
      manufacturer {
        id
        name
      }
    }
    buildComponent {
      id
      position
      build {
        id
        name
      }
    }
  }
`;

export const GET_LISTINGS = gql`
  ${LISTING_FIELDS}
  query GetListings($listingType: String, $search: String, $limit: Int, $offset: Int) {
    listings(listingType: $listingType, search: $search, limit: $limit, offset: $offset) {
      ...ListingFields
    }
  }
`;

export const GET_LISTING = gql`
  ${LISTING_FIELDS}
  query GetListing($id: ID!) {
    listing(id: $id) {
      ...ListingFields
    }
  }
`;

export const GET_MY_LISTINGS = gql`
  ${LISTING_FIELDS}
  query GetMyListings {
    myListings {
      ...ListingFields
    }
  }
`;

// ============================================
// Marketplace Mutations
// ============================================

export const CREATE_LISTING = gql`
  ${LISTING_FIELDS}
  mutation CreateListing(
    $componentId: ID!
    $buildComponentId: ID
    $listingType: String!
    $condition: String!
    $title: String!
    $description: String
    $priceCents: Int
    $location: String
    $contactInfo: String
    $imageUrl: String
  ) {
    createListing(
      input: {
        componentId: $componentId
        buildComponentId: $buildComponentId
        listingType: $listingType
        condition: $condition
        title: $title
        description: $description
        priceCents: $priceCents
        location: $location
        contactInfo: $contactInfo
        imageUrl: $imageUrl
      }
    ) {
      ...ListingFields
    }
  }
`;

export const UPDATE_LISTING = gql`
  ${LISTING_FIELDS}
  mutation UpdateListing(
    $id: ID!
    $status: String
    $title: String
    $description: String
    $priceCents: Int
    $location: String
    $contactInfo: String
    $imageUrl: String
  ) {
    updateListing(
      input: {
        id: $id
        status: $status
        title: $title
        description: $description
        priceCents: $priceCents
        location: $location
        contactInfo: $contactInfo
        imageUrl: $imageUrl
      }
    ) {
      ...ListingFields
    }
  }
`;

export const DELETE_LISTING = gql`
  mutation DeleteListing($id: ID!) {
    deleteListing(input: { id: $id }) {
      success
      errors
    }
  }
`;

// ============================================
// Messaging Queries & Mutations
// ============================================

export const GET_MY_CONVERSATIONS = gql`
  query GetMyConversations {
    myConversations {
      id
      lastMessageAt
      unreadCount
      createdAt
      buyer {
        id
        username
        avatarUrl
      }
      seller {
        id
        username
        avatarUrl
      }
      listing {
        id
        title
        listingType
        status
        component {
          id
          name
          imageUrl
          manufacturer {
            id
            name
          }
        }
      }
      latestMessage {
        id
        body
        createdAt
        user {
          id
          username
        }
      }
    }
  }
`;

export const GET_CONVERSATION = gql`
  query GetConversation($id: ID!) {
    conversation(id: $id) {
      id
      lastMessageAt
      unreadCount
      createdAt
      buyer {
        id
        username
        avatarUrl
      }
      seller {
        id
        username
        avatarUrl
      }
      listing {
        id
        title
        listingType
        status
        priceCents
        component {
          id
          name
          imageUrl
          manufacturer {
            id
            name
          }
        }
      }
      messages {
        id
        body
        read
        createdAt
        user {
          id
          username
          avatarUrl
        }
      }
    }
  }
`;

export const START_CONVERSATION = gql`
  mutation StartConversation($listingId: ID!, $message: String) {
    startConversation(input: { listingId: $listingId, message: $message }) {
      conversation {
        id
        buyer { id username }
        seller { id username }
        listing { id title }
        unreadCount
        createdAt
      }
      errors
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $body: String!) {
    sendMessage(input: { conversationId: $conversationId, body: $body }) {
      message {
        id
        body
        read
        createdAt
        user {
          id
          username
          avatarUrl
        }
      }
      errors
    }
  }
`;

export const MARK_CONVERSATION_READ = gql`
  mutation MarkConversationRead($conversationId: ID!) {
    markConversationRead(input: { conversationId: $conversationId }) {
      success
      errors
    }
  }
`;

export const GET_MY_UNREAD_COUNT = gql`
  query GetMyUnreadCount {
    myUnreadCount
  }
`;
