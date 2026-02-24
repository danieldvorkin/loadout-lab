# frozen_string_literal: true

module Mutations
  class DeleteBuild < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      raise GraphQL::ExecutionError, 'You must be logged in' unless context[:current_user]

      build = context[:current_user].builds.find_by(id: id)
      raise GraphQL::ExecutionError, 'Build not found or does not belong to you' unless build

      if build.destroy
        { success: true, errors: [] }
      else
        { success: false, errors: build.errors.full_messages }
      end
    end
  end
end
