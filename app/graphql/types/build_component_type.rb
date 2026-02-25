# frozen_string_literal: true

module Types
  class BuildComponentType < Types::BaseObject
    field :id, ID, null: false
    field :build, Types::BuildType, null: false
    field :component, Types::ComponentType, null: false
    field :position, String
    field :specs, GraphQL::Types::JSON
    field :owned, Boolean, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def build
      dataloader.with(Dataloader::RecordLoader, Build).load(object.build_id)
    end

    def component
      dataloader.with(Dataloader::RecordLoader, Component).load(object.component_id)
    end
  end
end
