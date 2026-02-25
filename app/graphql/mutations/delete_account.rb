# frozen_string_literal: true

module Mutations
  class DeleteAccount < BaseMutation
    description "Delete the current user's account and all associated data"

    argument :password, String, required: false, description: "The user's password for confirmation (not required for OAuth users)"
    argument :confirmation, String, required: true, description: "Type 'DELETE' to confirm account deletion"

    field :success, Boolean, null: false
    field :errors, [ String ], null: false

    def resolve(password: nil, confirmation:)
      current_user = context[:current_user]

      unless current_user
        return { success: false, errors: [ "You must be logged in to delete your account" ] }
      end

      unless confirmation == "DELETE"
        return { success: false, errors: [ "Please type 'DELETE' to confirm account deletion" ] }
      end

      # For non-OAuth users, require password confirmation
      if current_user.provider.blank?
        if password.blank?
          return { success: false, errors: [ "Password is required to delete your account" ] }
        end

        unless current_user.valid_password?(password)
          return { success: false, errors: [ "Password is incorrect" ] }
        end
      end

      if current_user.destroy
        { success: true, errors: [] }
      else
        { success: false, errors: [ "Failed to delete account. Please try again." ] }
      end
    end
  end
end
