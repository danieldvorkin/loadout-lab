# frozen_string_literal: true

module Mutations
  class DeleteLoadTest < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ String ], null: false

    def resolve(id:)
      load_test = find_load_test(id)
      return { success: false, errors: [ "Load test not found" ] } unless load_test

      load_test.destroy!
      { success: true, errors: [] }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, errors: e.record.errors.full_messages }
    end

    private

    def find_load_test(id)
      LoadTest.joins(ballistic_profile: { build: :user })
              .where(builds: { user_id: context[:current_user]&.id })
              .find_by(id: id)
    end
  end
end
