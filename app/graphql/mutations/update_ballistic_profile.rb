# frozen_string_literal: true

module Mutations
  class UpdateBallisticProfile < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :caliber, String, required: false
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

    def resolve(id:, **attrs)
      profile = find_profile(id)
      raise GraphQL::ExecutionError, "Ballistic profile not found" unless profile

      # Remove nil values so we only update what was provided
      attrs.compact!
      profile.update!(**attrs)
      profile
    rescue ActiveRecord::RecordInvalid => e
      raise GraphQL::ExecutionError, e.record.errors.full_messages.join(", ")
    end

    private

    def find_profile(id)
      BallisticProfile.joins(build: :user)
                      .where(builds: { user_id: context[:current_user]&.id })
                      .find_by(id: id)
    end
  end
end
