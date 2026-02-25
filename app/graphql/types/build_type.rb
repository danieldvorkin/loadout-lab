# frozen_string_literal: true

module Types
  class BuildType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :discipline, String
    field :total_weight_oz, Float
    field :total_cost_cents, Integer
    field :new_cost_cents, Integer, null: false
    field :owned_cost_cents, Integer, null: false
    field :user, Types::UserType, null: false
    field :build_components, [ Types::BuildComponentType ], null: false
    field :components, [ Types::ComponentType ], null: false
    field :ballistic_profiles, [ Types::BallisticProfileType ], null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    def user
      dataloader.with(Dataloader::RecordLoader, User).load(object.user_id)
    end

    def build_components
      dataloader.with(Dataloader::AssociationLoader, Build, :build_components).load(object)
    end

    def components
      dataloader.with(Dataloader::AssociationLoader, Build, :components).load(object)
    end

    def ballistic_profiles
      dataloader.with(Dataloader::AssociationLoader, Build, :ballistic_profiles).load(object)
    end
  end
end
