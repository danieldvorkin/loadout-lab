# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "DeleteAccount mutation", type: :request do
  let(:user) { create(:user, password: 'password123') }
  let(:oauth_user) { create(:user, :oauth_user) }

  let(:mutation) do
    <<~GQL
      mutation DeleteAccount($password: String, $confirmation: String!) {
        deleteAccount(input: {
          password: $password
          confirmation: $confirmation
        }) {
          success
          errors
        }
      }
    GQL
  end

  context 'when user is authenticated' do
    it 'deletes account with correct password and confirmation' do
      user_id = user.id

      result = graphql_request(
        query: mutation,
        variables: {
          password: 'password123',
          confirmation: 'DELETE'
        },
        user: user
      )

      data = result.dig('data', 'deleteAccount')
      expect(data['success']).to be true
      expect(data['errors']).to be_empty
      expect(User.find_by(id: user_id)).to be_nil
    end

    it 'returns error without DELETE confirmation' do
      result = graphql_request(
        query: mutation,
        variables: {
          password: 'password123',
          confirmation: 'delete'  # lowercase
        },
        user: user
      )

      data = result.dig('data', 'deleteAccount')
      expect(data['success']).to be false
      expect(data['errors']).to include("Please type 'DELETE' to confirm account deletion")
    end

    it 'returns error with incorrect password' do
      result = graphql_request(
        query: mutation,
        variables: {
          password: 'wrongpassword',
          confirmation: 'DELETE'
        },
        user: user
      )

      data = result.dig('data', 'deleteAccount')
      expect(data['success']).to be false
      expect(data['errors']).to include('Password is incorrect')
    end

    it 'returns error when password is not provided for regular user' do
      result = graphql_request(
        query: mutation,
        variables: {
          password: nil,
          confirmation: 'DELETE'
        },
        user: user
      )

      data = result.dig('data', 'deleteAccount')
      expect(data['success']).to be false
      expect(data['errors']).to include('Password is required to delete your account')
    end

    it 'deletes associated builds' do
      create_list(:build, 3, user: user)
      expect(user.builds.count).to eq(3)

      graphql_request(
        query: mutation,
        variables: {
          password: 'password123',
          confirmation: 'DELETE'
        },
        user: user
      )

      expect(Build.where(user_id: user.id).count).to eq(0)
    end
  end

  context 'when user is an OAuth user' do
    it 'deletes account without password' do
      user_id = oauth_user.id

      result = graphql_request(
        query: mutation,
        variables: {
          password: nil,
          confirmation: 'DELETE'
        },
        user: oauth_user
      )

      data = result.dig('data', 'deleteAccount')
      expect(data['success']).to be true
      expect(data['errors']).to be_empty
      expect(User.find_by(id: user_id)).to be_nil
    end
  end

  context 'when user is not authenticated' do
    it 'returns an error' do
      result = graphql_request(
        query: mutation,
        variables: {
          password: 'password',
          confirmation: 'DELETE'
        }
      )

      data = result.dig('data', 'deleteAccount')
      expect(data['success']).to be false
      expect(data['errors']).to include('You must be logged in to delete your account')
    end
  end
end
