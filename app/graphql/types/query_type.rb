# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [ Types::NodeType, null: true ], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ ID ], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Fetch all components with filtering
    field :components, [ Types::ComponentType ], null: false, description: "Fetch all components with optional filtering" do
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
      result = result.where(discontinued: [ false, nil ]) if active_only

      result = result.offset(offset) if offset.present?
      result = result.limit(limit) if limit.present?

      result
    end

    # Fetch all manufacturers with filtering
    field :manufacturers, [ Types::ManufacturerType ], null: false, description: "Fetch all manufacturers with optional filtering" do
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
    field :builds, [ Types::BuildType ], null: false, description: "Fetch current user's builds with optional filtering" do
      argument :search, String, required: false, description: "Search by build name"
      argument :discipline, String, required: false, description: "Filter by discipline"
    end

    def builds(search: nil, discipline: nil)
      return [] unless context[:current_user]

      result = context[:current_user].builds.order(created_at: :desc)

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
    field :component_types, [ String ], null: false, description: "Fetch list of all component types"

    def component_types
      Component::TYPES
    end

    # Get list of available disciplines
    field :disciplines, [ String ], null: false, description: "Fetch list of all build disciplines"

    def disciplines
      Build::DISCIPLINES
    end

    # Get list of available calibers
    field :calibers, [ String ], null: false, description: "Fetch list of common PRS/long-range calibers"

    def calibers
      BallisticProfile::CALIBERS
    end

    # Fetch projectiles with optional filtering by caliber/manufacturer
    field :projectiles, [ Types::ProjectileType ], null: false,
          description: "Fetch projectile catalog with optional caliber/manufacturer filtering" do
      argument :caliber, String, required: false, description: "Filter by cartridge name (e.g., '6.5 Creedmoor')"
      argument :caliber_inches, Float, required: false, description: "Filter by bullet diameter in inches"
      argument :manufacturer, String, required: false, description: "Filter by manufacturer name"
    end

    def projectiles(caliber: nil, caliber_inches: nil, manufacturer: nil)
      result = Projectile.ordered

      if caliber.present?
        result = result.where(caliber_inches: Projectile::CARTRIDGE_DIAMETER_MAP[caliber])
      elsif caliber_inches.present?
        result = result.by_caliber(caliber_inches)
      end

      result = result.by_manufacturer(manufacturer) if manufacturer.present?
      result
    end

    # Get list of projectile manufacturers
    field :projectile_manufacturers, [ String ], null: false,
          description: "Fetch list of projectile manufacturers in the catalog"

    def projectile_manufacturers
      Projectile.available_manufacturers
    end

    # Get cartridge-to-diameter mapping
    field :cartridge_diameters, GraphQL::Types::JSON, null: false,
          description: "Fetch mapping of cartridge names to bullet diameters"

    def cartridge_diameters
      Projectile::CARTRIDGE_DIAMETER_MAP
    end

    # Fetch ballistic profiles for a build
    field :ballistic_profiles, [ Types::BallisticProfileType ], null: false,
          description: "Fetch ballistic profiles for a specific build" do
      argument :build_id, ID, required: true
    end

    def ballistic_profiles(build_id:)
      return [] unless context[:current_user]
      build = context[:current_user].builds.find_by(id: build_id)
      return [] unless build
      build.ballistic_profiles.order(created_at: :desc)
    end

    # Fetch a single ballistic profile by ID
    field :ballistic_profile, Types::BallisticProfileType, null: true,
          description: "Fetch a single ballistic profile with all drop data" do
      argument :id, ID, required: true
    end

    def ballistic_profile(id:)
      return nil unless context[:current_user]
      BallisticProfile.joins(build: :user)
                      .where(builds: { user_id: context[:current_user].id })
                      .find_by(id: id)
    end

    # Marketplace listing queries
    field :listings, [ Types::ListingType ], null: false,
          description: "Fetch active marketplace listings" do
      argument :listing_type, String, required: false, description: "Filter by 'showcase' or 'for_sale'"
      argument :search, String, required: false, description: "Search by title or component name"
      argument :limit, Integer, required: false
      argument :offset, Integer, required: false
    end

    def listings(listing_type: nil, search: nil, limit: 50, offset: 0)
      result = Listing.active.recent

      result = result.where(listing_type: Listing.listing_types[listing_type]) if listing_type.present?

      if search.present?
        term = "%#{search.downcase}%"
        result = result.joins(:component)
                       .where("LOWER(listings.title) LIKE ? OR LOWER(components.name) LIKE ?", term, term)
      end

      result.offset(offset).limit(limit)
    end

    field :listing, Types::ListingType, null: true,
          description: "Fetch a single listing by ID" do
      argument :id, ID, required: true
    end

    def listing(id:)
      Listing.active.find_by(id: id)
    end

    field :my_listings, [ Types::ListingType ], null: false,
          description: "Fetch the current user's listings (all statuses)"

    def my_listings
      return [] unless context[:current_user]
      context[:current_user].listings.recent
    end

    # Conversation queries
    field :my_conversations, [ Types::ConversationType ], null: false,
          description: "All conversations for the current user, ordered by most recent activity"

    def my_conversations
      return [] unless context[:current_user]
      Conversation.for_user(context[:current_user])
                  .recent
    end

    field :conversation, Types::ConversationType, null: true,
          description: "Fetch a single conversation (must be a participant)" do
      argument :id, ID, required: true
    end

    def conversation(id:)
      return nil unless context[:current_user]
      conv = Conversation.find_by(id: id)
      conv&.participant?(context[:current_user]) ? conv : nil
    end

    field :my_unread_count, Integer, null: false,
          description: "Total number of unread messages across all of the current user's conversations"

    def my_unread_count
      return 0 unless context[:current_user]
      user = context[:current_user]
      Message.joins(:conversation)
             .where(read: false)
             .where.not(user_id: user.id)
             .where(
               "conversations.buyer_id = :uid OR conversations.seller_id = :uid",
               uid: user.id
             )
             .count
    end
  end
end
