# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "ChangePassword mutation", type: :request do
  let(:user) { create(:user, password: 'oldpassword123', password_confirmation: 'oldpassword123') }
  let(:oauth_user) { create(:user, :oauth_user) }

  let(:mutation) do
    <<~GQL
      mutation ChangePassword(
        $currentPassword: String!
        $newPassword: String!
        $newPasswordConfirmation: String!
      ) {
        changePassword(input: {
          currentPassword: $currentPassword
          newPassword: $newPassword
          newPasswordConfirmation: $newPasswordConfirmation
        }) {
          success
          errors
        }
      }
    GQL
  end

  context 'when user is authenticated' do
    it 'changes password successfully with correct current password' do
      result = graphql_request(
        query: mutation,
        variables: {
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword456',
          newPasswordConfirmation: 'newpassword456'
        },
        user: user
      )

      data = result.dig('data', 'changePassword')
      expect(data['success']).to be true
      expect(data['errors']).to be_empty

      # Verify password was actually changed
      user.reload
      expect(user.valid_password?('newpassword456')).to be true
    end

    it 'returns error with incorrect current password' do
      result = graphql_request(
        query: mutation,
        variables: {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword456',
          newPasswordConfirmation: 'newpassword456'
        },
        user: user
      )

      data = result.dig('data', 'changePassword')
      expect(data['success']).to be false
      expect(data['errors']).to include('Current password is incorrect')
    end

    it 'returns error when passwords do not match' do
      result = graphql_request(
        query: mutation,
        variables: {
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword456',
          newPasswordConfirmation: 'differentpassword'
        },
        user: user
      )

      data = result.dig('data', 'changePassword')
      expect(data['success']).to be false
      expect(data['errors']).to include("Password confirmation doesn't match")
    end

    it 'returns error when new password is too short' do
      result = graphql_request(
        query: mutation,
        variables: {
          currentPassword: 'oldpassword123',
          newPassword: '12345',
          newPasswordConfirmation: '12345'
        },
        user: user
      )

      data = result.dig('data', 'changePassword')
      expect(data['success']).to be false
      expect(data['errors']).to include('Password must be at least 6 characters')
    end
  end

  context 'when user is an OAuth user' do
    it 'allows setting password without current password' do
      # OAuth users don't have a current password to verify
      result = graphql_request(
        query: mutation,
        variables: {
          currentPassword: '', # Empty for OAuth users
          newPassword: 'mynewpassword',
          newPasswordConfirmation: 'mynewpassword'
        },
        user: oauth_user
      )

      data = result.dig('data', 'changePassword')
      expect(data['success']).to be true
      expect(data['errors']).to be_empty

      # Verify password was set
      oauth_user.reload
      expect(oauth_user.valid_password?('mynewpassword')).to be true
    end
  end

  context 'when user is not authenticated' do
    it 'returns an error' do
      result = graphql_request(
        query: mutation,
        variables: {
          currentPassword: 'password',
          newPassword: 'newpassword',
          newPasswordConfirmation: 'newpassword'
        }
      )

      data = result.dig('data', 'changePassword')
      expect(data['success']).to be false
      expect(data['errors']).to include('You must be logged in to change your password')
    end
  end
end
