# frozen_string_literal: true

module Mutations
  class UpsertBallisticDrop < BaseMutation
    argument :ballistic_profile_id, ID, required: true
    argument :distance_yards, Integer, required: true

    # Elevation drop
    argument :drop_inches, Float, required: false
    argument :drop_moa, Float, required: false
    argument :drop_mils, Float, required: false

    # Windage
    argument :windage_inches, Float, required: false
    argument :windage_moa, Float, required: false
    argument :windage_mils, Float, required: false

    # Ballistic data
    argument :velocity_fps, Integer, required: false
    argument :energy_ft_lbs, Integer, required: false
    argument :time_of_flight_sec, Float, required: false

    # Verification
    argument :is_verified, Boolean, required: false
    argument :notes, String, required: false

    type Types::BallisticDropType

    def resolve(ballistic_profile_id:, distance_yards:, **attrs)
      profile = find_profile(ballistic_profile_id)
      raise GraphQL::ExecutionError, "Ballistic profile not found" unless profile

      drop = profile.ballistic_drops.find_or_initialize_by(distance_yards: distance_yards)
      drop.assign_attributes(**attrs.compact)
      drop.save!
      drop
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
