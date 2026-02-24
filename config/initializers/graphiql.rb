# frozen_string_literal: true

# GraphiQL configuration
GraphiQL::Rails.config.initial_query = <<~GRAPHQL
  # Welcome to PRS Builder GraphQL API!
  #
  # Try running this query to get started:

  query GetComponents {
    components(limit: 10) {
      id
      name
      type
      msrpCents
      manufacturer {
        name
        country
      }
    }
  }

  # Or fetch all manufacturers:
  # query GetManufacturers {
  #   manufacturers {
  #     id
  #     name
  #     country
  #     website
  #     componentsCount
  #   }
  # }
GRAPHQL

# Set headers for authenticated requests
GraphiQL::Rails.config.headers = {
  'X-GraphiQL' => 'true'
}
