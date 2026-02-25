# frozen_string_literal: true

module Mutations
  class ChangePassword < BaseMutation
    description "Change the current user's password"

    argument :current_password, String, required: true, description: "The user's current password"
    argument :new_password, String, required: true, description: "The new password"
    argument :new_password_confirmation, String, required: true, description: "Confirmation of the new password"

    field :success, Boolean, null: false
    field :errors, [ String ], null: false

    def resolve(current_password:, new_password:, new_password_confirmation:)
      current_user = context[:current_user]

      unless current_user
        return { success: false, errors: [ "You must be logged in to change your password" ] }
      end

      # OAuth users can set a password without verifying current password
      # (they may not have set one or may not know the auto-generated one)
      is_oauth_user = current_user.provider.present?

      if is_oauth_user && current_password.blank?
        # OAuth user setting/changing password without current password
        if new_password != new_password_confirmation
          return { success: false, errors: [ "Password confirmation doesn't match" ] }
        end

        if new_password.length < 6
          return { success: false, errors: [ "Password must be at least 6 characters" ] }
        end

        if current_user.update(password: new_password, password_confirmation: new_password_confirmation)
          return { success: true, errors: [] }
        else
          return { success: false, errors: current_user.errors.full_messages }
        end
      end

      # Regular password change - verify current password
      unless current_user.valid_password?(current_password)
        return { success: false, errors: [ "Current password is incorrect" ] }
      end

      if new_password != new_password_confirmation
        return { success: false, errors: [ "Password confirmation doesn't match" ] }
      end

      if new_password.length < 6
        return { success: false, errors: [ "Password must be at least 6 characters" ] }
      end

      if current_user.update(password: new_password, password_confirmation: new_password_confirmation)
        { success: true, errors: [] }
      else
        { success: false, errors: current_user.errors.full_messages }
      end
    end
  end
end
