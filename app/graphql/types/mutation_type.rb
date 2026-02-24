# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    # Authentication mutations
    field :register_user, mutation: Mutations::RegisterUser
    field :login_user, mutation: Mutations::LoginUser
    field :google_oauth_login, mutation: Mutations::GoogleOauthLogin

    # User account mutations
    field :update_user_profile, mutation: Mutations::UpdateUserProfile
    field :change_password, mutation: Mutations::ChangePassword
    field :delete_account, mutation: Mutations::DeleteAccount

    # Build mutations
    field :create_build, mutation: Mutations::CreateBuild
    field :update_build, mutation: Mutations::UpdateBuild
    field :delete_build, mutation: Mutations::DeleteBuild

    # Build component mutations
    field :add_component_to_build, mutation: Mutations::AddComponentToBuild
    field :remove_component_from_build, mutation: Mutations::RemoveComponentFromBuild

    # Ballistic profile mutations
    field :create_ballistic_profile, mutation: Mutations::CreateBallisticProfile
    field :update_ballistic_profile, mutation: Mutations::UpdateBallisticProfile
    field :delete_ballistic_profile, mutation: Mutations::DeleteBallisticProfile

    # Ballistic drop mutations
    field :upsert_ballistic_drop, mutation: Mutations::UpsertBallisticDrop
    field :delete_ballistic_drop, mutation: Mutations::DeleteBallisticDrop
    field :bulk_upsert_ballistic_drops, mutation: Mutations::BulkUpsertBallisticDrops

    # Ballistic calculator
    field :generate_dope_table, mutation: Mutations::GenerateDopeTable

    # Load test mutations
    field :upsert_load_test, mutation: Mutations::UpsertLoadTest
    field :delete_load_test, mutation: Mutations::DeleteLoadTest
  end
end
