# frozen_string_literal: true

module Types
  class ComponentType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :type, String
    field :weight_oz, Float
    field :msrp_cents, Integer
    field :image_url, String
    field :manufacturer, Types::ManufacturerType, null: false
    field :specs, GraphQL::Types::JSON
    field :discontinued, Boolean
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
