# frozen_string_literal: true

module Types
  class ProjectileType < Types::BaseObject
    field :id, ID, null: false
    field :manufacturer, String, null: false
    field :name, String, null: false
    field :caliber_inches, Float, null: false
    field :weight_grains, Float, null: false
    field :bc_g1, Float
    field :bc_g7, Float
    field :bullet_type, String
    field :base_type, String
    field :recommended_twist, String
    field :display_name, String, null: false

    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
