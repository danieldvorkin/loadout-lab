# frozen_string_literal: true

module Types
  class LoadTestType < Types::BaseObject
    field :id, ID, null: false
    field :ballistic_profile, Types::BallisticProfileType, null: false
    field :ballistic_profile_id, ID, null: false

    field :charge_grains, Float
    field :velocity_fps, Integer
    field :group_size_moa, Float
    field :group_size_inches, Float
    field :distance_yards, Integer
    field :notes, String

    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
