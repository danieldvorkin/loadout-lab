# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "UpdateUserProfile mutation", type: :request do
  let(:user) { create(:user) }

  let(:mutation) do
    <<~GQL
      mutation UpdateUserProfile(
        $username: String
        $fullName: String
        $bio: String
        $location: String
        $preferredDiscipline: String
        $website: String
      ) {
        updateUserProfile(input: {
          username: $username
          fullName: $fullName
          bio: $bio
          location: $location
          preferredDiscipline: $preferredDiscipline
          website: $website
        }) {
          user {
            id
            username
            fullName
            bio
            location
            preferredDiscipline
            website
          }
          errors
        }
      }
    GQL
  end

  context 'when user is authenticated' do
    it 'updates the user profile' do
      result = graphql_request(
        query: mutation,
        variables: {
          fullName: 'John Shooter',
          bio: 'PRS competitor',
          location: 'Texas, USA',
          preferredDiscipline: 'prs',
          website: 'https://example.com'
        },
        user: user
      )

      expect(result['errors']).to be_nil
      data = result.dig('data', 'updateUserProfile')
      
      expect(data['errors']).to be_empty
      expect(data['user']['fullName']).to eq('John Shooter')
      expect(data['user']['bio']).to eq('PRS competitor')
      expect(data['user']['location']).to eq('Texas, USA')
      expect(data['user']['preferredDiscipline']).to eq('prs')
      expect(data['user']['website']).to eq('https://example.com')
    end

    it 'updates username successfully' do
      result = graphql_request(
        query: mutation,
        variables: { username: 'newusername' },
        user: user
      )

      data = result.dig('data', 'updateUserProfile')
      expect(data['errors']).to be_empty
      expect(data['user']['username']).to eq('newusername')
    end

    it 'returns errors for invalid website URL' do
      result = graphql_request(
        query: mutation,
        variables: { website: 'not-a-valid-url' },
        user: user
      )

      data = result.dig('data', 'updateUserProfile')
      expect(data['errors']).to include('Website must be a valid URL')
      expect(data['user']).to be_nil
    end

    it 'returns errors for invalid discipline' do
      result = graphql_request(
        query: mutation,
        variables: { preferredDiscipline: 'invalid_discipline' },
        user: user
      )

      data = result.dig('data', 'updateUserProfile')
      expect(data['errors']).not_to be_empty
    end

    it 'returns errors for bio exceeding max length' do
      result = graphql_request(
        query: mutation,
        variables: { bio: 'x' * 501 },
        user: user
      )

      data = result.dig('data', 'updateUserProfile')
      expect(data['errors']).not_to be_empty
    end

    it 'returns errors for duplicate username' do
      create(:user, username: 'taken_username')
      
      result = graphql_request(
        query: mutation,
        variables: { username: 'taken_username' },
        user: user
      )

      data = result.dig('data', 'updateUserProfile')
      expect(data['errors']).to include('Username has already been taken')
    end
  end

  context 'when user is not authenticated' do
    it 'returns an error' do
      result = graphql_request(
        query: mutation,
        variables: { fullName: 'New Name' }
      )

      data = result.dig('data', 'updateUserProfile')
      expect(data['errors']).to include('You must be logged in to update your profile')
    end
  end
end
