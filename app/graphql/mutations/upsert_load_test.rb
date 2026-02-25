# frozen_string_literal: true

module Mutations
  class UpsertLoadTest < BaseMutation
    argument :ballistic_profile_id, ID, required: true
    argument :id, ID, required: false

    argument :charge_grains, Float, required: false
    argument :velocity_fps, Integer, required: false
    argument :group_size_moa, Float, required: false
    argument :group_size_inches, Float, required: false
    argument :distance_yards, Integer, required: false
    argument :notes, String, required: false

    type Types::LoadTestType

    def resolve(ballistic_profile_id:, id: nil, **attrs)
      profile = find_profile(ballistic_profile_id)
      raise GraphQL::ExecutionError, "Ballistic profile not found" unless profile

      load_test = if id
                    profile.load_tests.find_by(id: id)
      else
                    profile.load_tests.build
      end

      raise GraphQL::ExecutionError, "Load test not found" if id && load_test.nil?

      load_test.assign_attributes(**attrs.compact)
      load_test.save!
      load_test
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
