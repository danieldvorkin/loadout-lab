# frozen_string_literal: true

module Mutations
  class RegisterUser < BaseMutation
    argument :email, String, required: true
    argument :password, String, required: true
    argument :password_confirmation, String, required: true
    argument :username, String, required: true
    argument :full_name, String, required: false
    argument :phone_number, String, required: false

    type Types::AuthPayloadType

    def resolve(email:, password:, password_confirmation:, username:, full_name: nil, phone_number: nil)
      user = User.new(
        email: email,
        password: password,
        password_confirmation: password_confirmation,
        username: username,
        full_name: full_name || '',
        phone_number: phone_number || ''
      )

      if user.save
        # Generate JWT token for the new user
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
          errors: user.errors.full_messages
        }
      end
    end

    private

    def generate_jwt_token(user)
      Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    end
  end
end
