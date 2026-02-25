# frozen_string_literal: true

require "net/http"
require "json"

module Mutations
  class GoogleOauthLogin < BaseMutation
    argument :access_token, String, required: true

    type Types::AuthPayloadType

    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

    def resolve(access_token:)
      payload = fetch_google_user_info(access_token)

      unless payload
        return { token: nil, user: nil, errors: [ "Invalid Google token" ] }
      end

      unless payload["email"].present?
        return { token: nil, user: nil, errors: [ "Google account did not provide an email address" ] }
      end

      user = User.from_google(
        uid: payload["sub"],
        email: payload["email"],
        full_name: payload["name"],
        avatar_url: payload["picture"]
      )

      token = generate_jwt_token(user)
      { token: token, user: user, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { token: nil, user: nil, errors: e.record.errors.full_messages }
    rescue StandardError => e
      { token: nil, user: nil, errors: [ "Authentication failed: #{e.message}" ] }
    end

    private

    def fetch_google_user_info(access_token)
      uri = URI(GOOGLE_USERINFO_URL)
      request = Net::HTTP::Get.new(uri)
      request["Authorization"] = "Bearer #{access_token}"

      response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(request)
      end

      return nil unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue StandardError
      nil
    end

    def generate_jwt_token(user)
      Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
    end
  end
end
