# frozen_string_literal: true

module Mutations
  class LoginUser < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true

    type Types::AuthPayloadType

    def resolve(email:, password:)
      user = User.find_by(email: email.downcase)

      if user&.valid_password?(password)
        # Generate JWT token
        token = generate_jwt_token(user)
        
        {
          token: token,
          user: user,
          errors: []
        }
      else
        {
          token: nil,
          user: nil,
          errors: ['Invalid email or password']
        }
      end
    end

    private

    def generate_jwt_token(user)
      Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    end
  end
end
