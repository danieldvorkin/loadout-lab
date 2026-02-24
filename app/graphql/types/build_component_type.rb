# frozen_string_literal: true

module Types
  class BuildComponentType < Types::BaseObject
    field :id, ID, null: false
    field :build, Types::BuildType, null: false
    field :component, Types::ComponentType, null: false
    field :position, String
    field :specs, GraphQL::Types::JSON
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
