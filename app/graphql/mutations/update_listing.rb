# frozen_string_literal: true

module Mutations
  class UpdateListing < BaseMutation
    argument :id, ID, required: true
    argument :status, String, required: false
    argument :title, String, required: false
    argument :description, String, required: false
    argument :price_cents, Integer, required: false
    argument :location, String, required: false
    argument :contact_info, String, required: false
    argument :image_url, String, required: false

    type Types::ListingType

    def resolve(id:, status: nil, title: nil, description: nil, price_cents: nil,
                location: nil, contact_info: nil, image_url: nil)
      raise GraphQL::ExecutionError, "You must be logged in" unless context[:current_user]

      listing = context[:current_user].listings.find_by(id: id)
      raise GraphQL::ExecutionError, "Listing not found or does not belong to you" unless listing

      attrs = {}
      attrs[:title] = title if title
      attrs[:description] = description unless description.nil?
      attrs[:price_cents] = price_cents unless price_cents.nil?
      attrs[:location] = location unless location.nil?
      attrs[:contact_info] = contact_info unless contact_info.nil?
      attrs[:image_url] = image_url unless image_url.nil?
      if status
        status_val = Listing.statuses[status]
        raise GraphQL::ExecutionError, "Invalid status: #{status}" unless status_val

        attrs[:status] = status_val
      end

      if listing.update(attrs)
        listing
      else
        raise GraphQL::ExecutionError, listing.errors.full_messages.join(", ")
      end
    end
  end
end
