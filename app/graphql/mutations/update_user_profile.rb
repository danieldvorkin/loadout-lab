# frozen_string_literal: true

module Mutations
  class UpdateUserProfile < BaseMutation
    description "Update the current user's profile information"

    # Input arguments
    argument :username, String, required: false
    argument :full_name, String, required: false
    argument :phone_number, String, required: false
    argument :bio, String, required: false
    argument :location, String, required: false
    argument :avatar_url, String, required: false
    argument :date_of_birth, GraphQL::Types::ISO8601Date, required: false
    argument :preferred_discipline, String, required: false
    argument :website, String, required: false
    argument :social_links, GraphQL::Types::JSON, required: false
    argument :notification_preferences, GraphQL::Types::JSON, required: false

    # Return fields
    field :user, Types::UserType, null: true
    field :errors, [ String ], null: false

    def resolve(**args)
      current_user = context[:current_user]

      unless current_user
        return { user: nil, errors: [ "You must be logged in to update your profile" ] }
      end

      # Filter out nil values to only update provided fields
      update_params = args.compact

      if current_user.update(update_params)
        { user: current_user, errors: [] }
      else
        { user: nil, errors: current_user.errors.full_messages }
      end
    end
  end
end
