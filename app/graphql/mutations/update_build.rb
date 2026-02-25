# frozen_string_literal: true

module Mutations
  class UpdateBuild < BaseMutation
    argument :id, ID, required: true
    argument :name, String, required: false
    argument :discipline, String, required: false

    type Types::BuildType

    def resolve(id:, name: nil, discipline: nil)
      raise GraphQL::ExecutionError, "You must be logged in" unless context[:current_user]

      build = context[:current_user].builds.find_by(id: id)
      raise GraphQL::ExecutionError, "Build not found or does not belong to you" unless build

      build.name = name if name.present?
      build.discipline = discipline if discipline.present?

      if build.save
        build
      else
        raise GraphQL::ExecutionError, build.errors.full_messages.join(", ")
      end
    end
  end
end
