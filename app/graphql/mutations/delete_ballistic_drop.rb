# frozen_string_literal: true

module Mutations
  class DeleteBallisticDrop < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [ String ], null: false

    def resolve(id:)
      drop = BallisticDrop.joins(ballistic_profile: { build: :user })
                          .where(builds: { user_id: context[:current_user]&.id })
                          .find_by(id: id)

      unless drop
        return { success: false, errors: [ "Ballistic drop entry not found" ] }
      end

      drop.destroy!
      { success: true, errors: [] }
    end
  end
end
