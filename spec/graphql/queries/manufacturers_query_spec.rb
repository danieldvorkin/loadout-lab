# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Manufacturers query", type: :request do
  let!(:mfg_a) { create(:manufacturer, name: "Alpha Arms", country: "USA", website: "https://alpha.com") }
  let!(:mfg_b) { create(:manufacturer, name: "Bravo Barrels", country: "Canada", website: "https://bravo.ca") }
  let!(:mfg_c) { create(:manufacturer, name: "Charlie Custom", country: "USA", website: "https://charlie.com") }

  let(:query) do
    <<~GQL
      query GetManufacturers($search: String, $limit: Int) {
        manufacturers(search: $search, limit: $limit) {
          id
          name
          website
          country
          imageUrl
        }
      }
    GQL
  end

  describe 'fetching all manufacturers' do
    it 'returns all manufacturers ordered by name' do
      result = graphql_request(query: query)

      data = result.dig('data', 'manufacturers')
      expect(data.length).to eq(3)
      names = data.map { |m| m['name'] }
      expect(names).to eq(%w[Alpha\ Arms Bravo\ Barrels Charlie\ Custom])
    end

    it 'includes all expected fields' do
      result = graphql_request(query: query)

      first = result.dig('data', 'manufacturers').first
      expect(first).to have_key('id')
      expect(first).to have_key('name')
      expect(first).to have_key('website')
      expect(first).to have_key('country')
      expect(first).to have_key('imageUrl')
    end
  end

  describe 'search filter' do
    it 'filters by name (case-insensitive)' do
      result = graphql_request(query: query, variables: { search: "alpha" })

      data = result.dig('data', 'manufacturers')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq("Alpha Arms")
    end

    it 'matches partial names' do
      result = graphql_request(query: query, variables: { search: "ar" })

      data = result.dig('data', 'manufacturers')
      names = data.map { |m| m['name'] }
      expect(names).to include("Bravo Barrels", "Charlie Custom")
    end

    it 'returns empty for no matches' do
      result = graphql_request(query: query, variables: { search: "zzz_nomatch" })

      data = result.dig('data', 'manufacturers')
      expect(data).to be_empty
    end
  end

  describe 'limit' do
    it 'limits number of results' do
      result = graphql_request(query: query, variables: { limit: 2 })

      data = result.dig('data', 'manufacturers')
      expect(data.length).to eq(2)
    end

    it 'returns all when limit exceeds total' do
      result = graphql_request(query: query, variables: { limit: 100 })

      data = result.dig('data', 'manufacturers')
      expect(data.length).to eq(3)
    end
  end

  describe 'combined filters' do
    it 'combines search with limit' do
      result = graphql_request(query: query, variables: { search: "a", limit: 1 })

      data = result.dig('data', 'manufacturers')
      expect(data.length).to eq(1)
    end
  end
end
