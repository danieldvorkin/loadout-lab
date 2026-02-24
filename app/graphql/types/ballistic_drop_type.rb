# frozen_string_literal: true

module Types
  class BallisticDropType < Types::BaseObject
    field :id, ID, null: false
    field :distance_yards, Integer, null: false

    # Elevation drop
    field :drop_inches, Float
    field :drop_moa, Float
    field :drop_mils, Float

    # Windage
    field :windage_inches, Float
    field :windage_moa, Float
    field :windage_mils, Float

    # Ballistic data
    field :velocity_fps, Integer
    field :energy_ft_lbs, Integer
    field :time_of_flight_sec, Float

    # Verification
    field :is_verified, Boolean
    field :notes, String

    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
