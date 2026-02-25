# frozen_string_literal: true

module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :username, String, null: false
    field :full_name, String
    field :phone_number, String
    field :bio, String
    field :location, String
    field :avatar_url, String
    field :date_of_birth, GraphQL::Types::ISO8601Date
    field :preferred_discipline, String
    field :website, String
    field :social_links, GraphQL::Types::JSON
    field :notification_preferences, GraphQL::Types::JSON
    field :provider, String
    field :role, String, null: false
    field :is_admin, Boolean, null: false
    field :is_oauth_user, Boolean, null: false
    field :builds, [ Types::BuildType ], null: false
    field :builds_count, Integer, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def is_admin
      object.admin?
    end

    def is_oauth_user
      object.provider.present?
    end

    def builds
      dataloader.with(Dataloader::AssociationLoader, User, :builds).load(object)
    end

    def builds_count
      dataloader.with(Dataloader::AssociationLoader, User, :builds).load(object).then(&:length)
    end
  end
end
