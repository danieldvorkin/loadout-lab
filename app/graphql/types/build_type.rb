# frozen_string_literal: true

module Types
  class BuildType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :discipline, String
    field :total_weight_oz, Float
    field :total_cost_cents, Integer
    field :user, Types::UserType, null: false
    field :build_components, [Types::BuildComponentType], null: false
    field :components, [Types::ComponentType], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
