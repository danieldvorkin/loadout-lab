# frozen_string_literal: true

module Mutations
  class UpdateBuildComponent < BaseMutation
    argument :id, ID, required: true
    argument :owned, Boolean, required: false
    argument :position, String, required: false
    argument :specs, GraphQL::Types::JSON, required: false

    type Types::BuildComponentType

    def resolve(id:, owned: nil, position: nil, specs: nil)
      raise GraphQL::ExecutionError, 'You must be logged in' unless context[:current_user]

      build_component = BuildComponent
                        .joins(:build)
                        .where(builds: { user_id: context[:current_user].id })
                        .find_by(id: id)

      raise GraphQL::ExecutionError, 'Build component not found or does not belong to you' unless build_component

      build_component.owned = owned unless owned.nil?
      build_component.position = position if position.present?
      build_component.specs = specs unless specs.nil?

      if build_component.save
        build_component
      else
        raise GraphQL::ExecutionError, build_component.errors.full_messages.join(', ')
      end
    end
  end
end
