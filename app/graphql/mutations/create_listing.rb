# frozen_string_literal: true

module Mutations
  class CreateListing < BaseMutation
    argument :component_id, ID, required: true
    argument :build_component_id, ID, required: false
    argument :listing_type, String, required: true
    argument :condition, String, required: true
    argument :title, String, required: true
    argument :description, String, required: false
    argument :price_cents, Integer, required: false
    argument :location, String, required: false
    argument :contact_info, String, required: false
    argument :image_url, String, required: false

    type Types::ListingType

    def resolve(component_id:, listing_type:, condition:, title:, build_component_id: nil,
                description: nil, price_cents: nil, location: nil, contact_info: nil, image_url: nil)
      raise GraphQL::ExecutionError, "You must be logged in" unless context[:current_user]

      component = Component.find_by(id: component_id)
      raise GraphQL::ExecutionError, "Component not found" unless component

      # Map string enums to integer values
      listing_type_val = Listing.listing_types[listing_type]
      raise GraphQL::ExecutionError, "Invalid listing type: #{listing_type}" unless listing_type_val

      condition_val = Listing.conditions[condition]
      raise GraphQL::ExecutionError, "Invalid condition: #{condition}" unless condition_val

      listing = context[:current_user].listings.build(
        component: component,
        build_component_id: build_component_id,
        listing_type: listing_type_val,
        status: :active,
        condition: condition_val,
        title: title,
        description: description,
        price_cents: price_cents,
        location: location,
        contact_info: contact_info,
        image_url: image_url
      )

      if listing.save
        listing
      else
        raise GraphQL::ExecutionError, listing.errors.full_messages.join(", ")
      end
    end
  end
end
