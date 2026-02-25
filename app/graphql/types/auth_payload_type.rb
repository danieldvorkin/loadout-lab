# frozen_string_literal: true

module Types
  class AuthPayloadType < Types::BaseObject
    field :token, String, null: true
    field :user, Types::UserType, null: true
    field :errors, [ String ], null: false
  end
end
