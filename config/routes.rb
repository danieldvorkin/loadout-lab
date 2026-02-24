Rails.application.routes.draw do
  # GraphQL endpoint - single entry point for all API operations
  post "/graphql", to: "graphql#execute"

  # GraphiQL - interactive GraphQL IDE (development and production)
  mount GraphiQL::Rails::Engine, at: "/graphiql", graphql_path: "/graphql" if Rails.env.development? || ENV['ENABLE_GRAPHIQL'] == 'true'

  # Admin Panel
  namespace :admin do
    get 'login', to: 'sessions#new'
    post 'login', to: 'sessions#create'
    delete 'logout', to: 'sessions#destroy'
    
    get '/', to: 'dashboard#index', as: :dashboard
    resources :users, except: [:new, :create]
    resources :components
    resources :manufacturers
    resources :builds, only: [:index, :show, :destroy]
  end

  # Health check endpoint for load balancers and monitoring
  get "up" => "rails/health#show", as: :rails_health_check

  # Root route - redirect to health check for API
  root to: proc { [200, { 'Content-Type' => 'application/json' }, ['{"status": "ok", "message": "PRS Builder API"}']] }
end
