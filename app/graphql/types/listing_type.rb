# frozen_string_literal: true

module Types
  class ListingType < Types::BaseObject
    field :id, ID, null: false
    field :title, String, null: false
    field :description, String
    field :listing_type, String, null: false
    field :status, String, null: false
    field :condition, String, null: false
    field :price_cents, Integer
    field :location, String
    field :contact_info, String
    field :image_url, String
    field :user, Types::UserType, null: false
    field :component, Types::ComponentType, null: false
    field :build_component, Types::BuildComponentType
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def listing_type
      object.listing_type
    end

    def status
      object.status
    end

    def condition
      object.condition
    end

    def user
      dataloader.with(Dataloader::RecordLoader, User).load(object.user_id)
    end

    def component
      dataloader.with(Dataloader::RecordLoader, Component).load(object.component_id)
    end

    def build_component
      return nil if object.build_component_id.nil?
      dataloader.with(Dataloader::RecordLoader, BuildComponent).load(object.build_component_id)
    end
  end
end
