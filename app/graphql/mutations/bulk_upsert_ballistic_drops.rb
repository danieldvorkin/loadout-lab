# frozen_string_literal: true

module Mutations
  class BulkUpsertBallisticDrops < BaseMutation
    # Input type for individual drop entries
    class DropInput < Types::BaseInputObject
      argument :distance_yards, Integer, required: true
      argument :drop_inches, Float, required: false
      argument :drop_moa, Float, required: false
      argument :drop_mils, Float, required: false
      argument :windage_inches, Float, required: false
      argument :windage_moa, Float, required: false
      argument :windage_mils, Float, required: false
      argument :velocity_fps, Integer, required: false
      argument :energy_ft_lbs, Integer, required: false
      argument :time_of_flight_sec, Float, required: false
      argument :is_verified, Boolean, required: false
      argument :notes, String, required: false
    end

    argument :ballistic_profile_id, ID, required: true
    argument :drops, [ DropInput ], required: true

    field :ballistic_profile, Types::BallisticProfileType, null: true
    field :errors, [ String ], null: false

    def resolve(ballistic_profile_id:, drops:)
      profile = find_profile(ballistic_profile_id)
      unless profile
        return { ballistic_profile: nil, errors: [ "Ballistic profile not found" ] }
      end

      errors = []

      ActiveRecord::Base.transaction do
        drops.each do |drop_input|
          drop = profile.ballistic_drops.find_or_initialize_by(
            distance_yards: drop_input.distance_yards
          )
          attrs = drop_input.to_h.except(:distance_yards).compact
          drop.assign_attributes(**attrs)

          unless drop.save
            errors << "#{drop_input.distance_yards}yd: #{drop.errors.full_messages.join(', ')}"
          end
        end

        raise ActiveRecord::Rollback if errors.any?
      end

      { ballistic_profile: errors.empty? ? profile.reload : nil, errors: errors }
    end

    private

    def find_profile(id)
      BallisticProfile.joins(build: :user)
                      .where(builds: { user_id: context[:current_user]&.id })
                      .find_by(id: id)
    end
  end
end
