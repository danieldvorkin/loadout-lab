# frozen_string_literal: true

module Mutations
  class GenerateDopeTable < BaseMutation
    argument :ballistic_profile_id, ID, required: true
    argument :max_distance, Integer, required: false
    argument :step, Integer, required: false

    field :ballistic_profile, Types::BallisticProfileType, null: true
    field :errors, [String], null: false

    def resolve(ballistic_profile_id:, max_distance: 1200, step: 25)
      profile = find_profile(ballistic_profile_id)
      unless profile
        return { ballistic_profile: nil, errors: ["Ballistic profile not found"] }
      end

      # Validate required fields for calculation
      missing = []
      missing << "muzzle velocity" unless profile.muzzle_velocity_fps&.positive?
      missing << "ballistic coefficient" unless profile.bullet_bc&.positive?
      missing << "bullet weight" unless profile.bullet_weight_grains&.positive?

      if missing.any?
        return {
          ballistic_profile: nil,
          errors: ["Missing required data for calculation: #{missing.join(', ')}. Please fill in all bullet and rifle data."]
        }
      end

      profile.generate_dope_table!(max_distance: max_distance, step: step)
      profile.reload

      { ballistic_profile: profile, errors: [] }
    rescue ArgumentError => e
      { ballistic_profile: nil, errors: [e.message] }
    rescue ActiveRecord::RecordInvalid => e
      { ballistic_profile: nil, errors: e.record.errors.full_messages }
    end

    private

    def find_profile(id)
      return nil unless context[:current_user]
      BallisticProfile.joins(build: :user)
                      .where(builds: { user_id: context[:current_user].id })
                      .find_by(id: id)
    end
  end
end
