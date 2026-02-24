# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :username, String, null: false
    field :full_name, String
    field :phone_number, String
    field :role, String, null: false
    field :is_admin, Boolean, null: false
    field :builds, [Types::BuildType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def is_admin
      object.admin?
    end
  end
end
