Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001'
    resource '*',
      headers: :any,
      credentials: true,
      expose: ['Authorization'],
      methods: %i[get post delete put patch options head]
  end
end