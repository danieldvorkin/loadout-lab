# frozen_string_literal: true

module Mutations
  class DeleteBallisticProfile < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      profile = BallisticProfile.joins(build: :user)
                                .where(builds: { user_id: context[:current_user]&.id })
                                .find_by(id: id)

      unless profile
        return { success: false, errors: ["Ballistic profile not found"] }
      end

      profile.destroy!
      { success: true, errors: [] }
    end
  end
end
