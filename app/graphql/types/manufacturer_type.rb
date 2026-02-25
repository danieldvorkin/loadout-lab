# frozen_string_literal: true

module Types
  class ManufacturerType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :website, String
    field :country, String
    field :image_url, String
    field :components, [Types::ComponentType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def components
      dataloader.with(Dataloader::AssociationLoader, Manufacturer, :components).load(object)
    end
  end
end
