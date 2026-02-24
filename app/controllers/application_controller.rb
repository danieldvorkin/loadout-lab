class ApplicationController < ActionController::API
  include Pundit::Authorization
  
  before_action :authenticate_user!

  respond_to :json

  private

  def authenticate_user!
    return if current_user
    render json: { errors: ['You need to sign in or sign up before continuing.'] }, status: :unauthorized
  end

  def current_user
    return @current_user if defined?(@current_user)
    
    @current_user = nil
    token = request.headers['Authorization']&.split(' ')&.last
    
    return nil unless token

    begin
      jwt_payload = JWT.decode(
        token,
        Rails.application.credentials.devise_jwt_secret_key!,
        true,
        { algorithm: 'HS256' }
      ).first

      @current_user = User.find_by(id: jwt_payload['sub'], jti: jwt_payload['jti'])
    rescue JWT::DecodeError, JWT::ExpiredSignature => e
      Rails.logger.debug "JWT Error: #{e.message}"
      nil
    end
  end
end
