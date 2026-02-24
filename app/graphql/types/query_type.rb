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

    # Fetch all components with filtering
    field :components, [Types::ComponentType], null: false, description: "Fetch all components with optional filtering" do
      argument :search, String, required: false, description: "Search by component name"
      argument :type, String, required: false, description: "Filter by component type"
      argument :manufacturer_id, ID, required: false, description: "Filter by manufacturer"
      argument :active_only, Boolean, required: false, description: "Only show active (non-discontinued) components"
      argument :limit, Integer, required: false, description: "Limit number of results"
      argument :offset, Integer, required: false, description: "Offset for pagination"
    end

    def components(search: nil, type: nil, manufacturer_id: nil, active_only: nil, limit: nil, offset: nil)
      result = Component.includes(:manufacturer).order(:name)
      
      if search.present?
        search_term = "%#{search.downcase}%"
        result = result.where("LOWER(name) LIKE ?", search_term)
      end
      
      result = result.where(type: type) if type.present?
      result = result.where(manufacturer_id: manufacturer_id) if manufacturer_id.present?
      result = result.where(discontinued: [false, nil]) if active_only
      
      result = result.offset(offset) if offset.present?
      result = result.limit(limit) if limit.present?
      
      result
    end

    # Fetch all manufacturers with filtering
    field :manufacturers, [Types::ManufacturerType], null: false, description: "Fetch all manufacturers with optional filtering" do
      argument :search, String, required: false, description: "Search by manufacturer name"
      argument :limit, Integer, required: false, description: "Limit number of results"
    end

    def manufacturers(search: nil, limit: nil)
      result = Manufacturer.order(:name)
      
      if search.present?
        search_term = "%#{search.downcase}%"
        result = result.where("LOWER(name) LIKE ?", search_term)
      end
      
      result = result.limit(limit) if limit.present?
      result
    end

    # Fetch current user's builds with filtering
    field :builds, [Types::BuildType], null: false, description: "Fetch current user's builds with optional filtering" do
      argument :search, String, required: false, description: "Search by build name"
      argument :discipline, String, required: false, description: "Filter by discipline"
    end

    def builds(search: nil, discipline: nil)
      return [] unless context[:current_user]
      
      result = context[:current_user].builds.includes(:build_components, :components).order(created_at: :desc)
      
      if search.present?
        search_term = "%#{search.downcase}%"
        result = result.where("LOWER(name) LIKE ?", search_term)
      end
      
      result = result.where(discipline: discipline) if discipline.present?
      result
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

    # Get list of available component types
    field :component_types, [String], null: false, description: "Fetch list of all component types"

    def component_types
      Component::TYPES
    end

    # Get list of available disciplines
    field :disciplines, [String], null: false, description: "Fetch list of all build disciplines"

    def disciplines
      Build::DISCIPLINES
    end
  end
end
