# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [Types::NodeType, null: true], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ID], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Fetch all components
    field :components, [Types::ComponentType], null: false, description: "Fetch all components"

    def components
      Component.includes(:manufacturer).all
    end

    # Fetch all manufacturers
    field :manufacturers, [Types::ManufacturerType], null: false, description: "Fetch all manufacturers"

    def manufacturers
      Manufacturer.all
    end

    # Fetch current user's builds
    field :builds, [Types::BuildType], null: false, description: "Fetch current user's builds"

    def builds
      return [] unless context[:current_user]
      context[:current_user].builds.includes(:build_components, :components)
    end

    # Fetch a single build by ID
    field :build, Types::BuildType, null: true, description: "Fetch a single build by ID" do
      argument :id, ID, required: true
    end

    def build(id:)
      return nil unless context[:current_user]
      context[:current_user].builds.find_by(id: id)
    end

    # Fetch the current authenticated user
    field :current_user, Types::UserType, null: true, description: "Fetch the current authenticated user"

    def current_user
      context[:current_user]
    end

    # Fetch a single component by ID
    field :component, Types::ComponentType, null: true, description: "Fetch a single component by ID" do
      argument :id, ID, required: true
    end

    def component(id:)
      Component.find_by(id: id)
    end

    # Fetch a single manufacturer by ID
    field :manufacturer, Types::ManufacturerType, null: true, description: "Fetch a single manufacturer by ID" do
      argument :id, ID, required: true
    end

    def manufacturer(id:)
      Manufacturer.find_by(id: id)
    end
  end
end
