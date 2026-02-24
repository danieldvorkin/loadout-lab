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
      createdAt
      buildComponents {
        id
        position
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
      createdAt
      updatedAt
      buildComponents {
        id
        position
        specs
        component {
          id
          name
          type
          weightOz
          msrpCents
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
  ) {
    addComponentToBuild(
      input: {
        buildId: $buildId
        componentId: $componentId
        position: $position
        specs: $specs
      }
    ) {
      id
      position
      specs
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
