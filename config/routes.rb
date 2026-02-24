Rails.application.routes.draw do
  # GraphQL endpoint - single entry point for all API operations
  post "/graphql", to: "graphql#execute"

  # GraphiQL - interactive GraphQL IDE (development and production)
  mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql" if Rails.env.development? || ENV['ENABLE_GRAPHIQL'] == 'true'

  # Health check endpoint for load balancers and monitoring
  get "up" => "rails/health#show", as: :rails_health_check

  # Root route - redirect to health check for API
  root to: proc { [200, { 'Content-Type' => 'application/json' }, ['{"status": "ok", "message": "PRS Builder API"}']] }
end
