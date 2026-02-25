# frozen_string_literal: true

module Mutations
  class AddComponentToBuild < BaseMutation
    argument :build_id, ID, required: true
    argument :component_id, ID, required: true
    argument :position, String, required: false
    argument :specs, GraphQL::Types::JSON, required: false
    argument :owned, Boolean, required: false

    type Types::BuildComponentType

    def resolve(build_id:, component_id:, position: nil, specs: nil, owned: false)
      # Ensure user is authenticated
      raise GraphQL::ExecutionError, 'You must be logged in to add components to a build' unless context[:current_user]

      # Find the build belonging to the current user
      build = context[:current_user].builds.find_by(id: build_id)
      raise GraphQL::ExecutionError, 'Build not found or does not belong to you' unless build

      # Find the component
      component = Component.find_by(id: component_id)
      raise GraphQL::ExecutionError, 'Component not found' unless component

      # Create the build component
      build_component = build.build_components.new(
        component: component,
        position: position,
        specs: specs || {},
        owned: owned
      )

      if build_component.save
        build_component
      else
        raise GraphQL::ExecutionError, build_component.errors.full_messages.join(', ')
      end
    end
  end
end
