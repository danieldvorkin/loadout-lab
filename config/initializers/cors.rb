Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Development origins
    origins_list = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3001'
    ]

    # Add production Netlify URL from environment variable
    if ENV['FRONTEND_URL'].present?
      origins_list << ENV['FRONTEND_URL']
      # Also allow the raw Netlify subdomain
      origins_list << ENV['FRONTEND_URL'].gsub('https://', 'https://www.')
    end

    # Allow any netlify.app subdomain in production
    if Rails.env.production?
      origins_list << /\Ahttps:\/\/[\w-]+\.netlify\.app\z/
    end

    origins(*origins_list)

    resource '*',
      headers: :any,
      credentials: true,
      expose: ['Authorization'],
      methods: %i[get post delete put patch options head]
  end
end