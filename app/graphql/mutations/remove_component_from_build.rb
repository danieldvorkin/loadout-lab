# frozen_string_literal: true

module Mutations
  class RemoveComponentFromBuild < BaseMutation
    argument :build_component_id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(build_component_id:)
      raise GraphQL::ExecutionError, 'You must be logged in' unless context[:current_user]

      build_component = BuildComponent.joins(:build)
                                       .where(builds: { user_id: context[:current_user].id })
                                       .find_by(id: build_component_id)

      raise GraphQL::ExecutionError, 'Build component not found or does not belong to you' unless build_component

      if build_component.destroy
        { success: true, errors: [] }
      else
        { success: false, errors: build_component.errors.full_messages }
      end
    end
  end
end
