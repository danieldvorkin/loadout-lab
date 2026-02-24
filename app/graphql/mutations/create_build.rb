# frozen_string_literal: true

module Mutations
  class CreateBuild < BaseMutation
    argument :name, String, required: true
    argument :discipline, String, required: false

    type Types::BuildType

    def resolve(name:, discipline: nil)
      context[:current_user].builds.create!(
        name: name,
        discipline: discipline
      )
    end
  end
end
