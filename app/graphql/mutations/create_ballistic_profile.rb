# frozen_string_literal: true

module Mutations
  class CreateBallisticProfile < BaseMutation
    argument :build_id, ID, required: true
    argument :name, String, required: true
    argument :caliber, String, required: true
    argument :projectile_id, ID, required: false

    # Bullet data
    argument :bullet_weight_grains, Float, required: false
    argument :bullet_bc, Float, required: false
    argument :bc_type, String, required: false

    # Rifle data
    argument :muzzle_velocity_fps, Integer, required: false
    argument :zero_distance_yards, Integer, required: false
    argument :sight_height_inches, Float, required: false
    argument :twist_rate, String, required: false
    argument :barrel_length_inches, Float, required: false

    # Environment conditions
    argument :altitude_feet, Integer, required: false
    argument :temperature_f, Integer, required: false
    argument :humidity_percent, Integer, required: false
    argument :pressure_inhg, Float, required: false
    argument :wind_speed_mph, Integer, required: false
    argument :wind_angle_degrees, Integer, required: false

    argument :notes, String, required: false

    type Types::BallisticProfileType

    def resolve(build_id:, **attrs)
      build = context[:current_user]&.builds&.find_by(id: build_id)
      raise GraphQL::ExecutionError, "Build not found" unless build

      profile = build.ballistic_profiles.create!(**attrs)
      profile
    rescue ActiveRecord::RecordInvalid => e
      raise GraphQL::ExecutionError, e.record.errors.full_messages.join(", ")
    end
  end
end
