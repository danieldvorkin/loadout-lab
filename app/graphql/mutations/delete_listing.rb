# frozen_string_literal: true

module Mutations
  class DeleteListing < BaseMutation
    argument :id, ID, required: true

    field :success, Boolean, null: false
    field :errors, [String], null: false

    def resolve(id:)
      raise GraphQL::ExecutionError, 'You must be logged in' unless context[:current_user]

      listing = context[:current_user].listings.find_by(id: id)
      raise GraphQL::ExecutionError, 'Listing not found or does not belong to you' unless listing

      if listing.destroy
        { success: true, errors: [] }
      else
        { success: false, errors: listing.errors.full_messages }
      end
    end
  end
end
