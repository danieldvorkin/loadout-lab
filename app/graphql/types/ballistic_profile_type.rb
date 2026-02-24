# frozen_string_literal: true

module Types
  class BallisticProfileType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :build, Types::BuildType, null: false
    field :caliber, String, null: false

    # Projectile reference
    field :projectile, Types::ProjectileType
    field :projectile_id, ID

    # Bullet data
    field :bullet_weight_grains, Float
    field :bullet_bc, Float
    field :bc_type, String

    # Rifle data
    field :muzzle_velocity_fps, Integer
    field :zero_distance_yards, Integer
    field :sight_height_inches, Float
    field :twist_rate, String
    field :barrel_length_inches, Float

    # Environment conditions
    field :altitude_feet, Integer
    field :temperature_f, Integer
    field :humidity_percent, Integer
    field :pressure_inhg, Float
    field :wind_speed_mph, Integer
    field :wind_angle_degrees, Integer

    field :notes, String

    # Dope data
    field :ballistic_drops, [Types::BallisticDropType], null: false

    # Constants
    field :available_calibers, [String], null: false

    def available_calibers
      BallisticProfile::CALIBERS
    end

    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
