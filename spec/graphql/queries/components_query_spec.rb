# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Components query", type: :request do
  let!(:manufacturer_a) { create(:manufacturer, name: "Alpha Mfg") }
  let!(:manufacturer_b) { create(:manufacturer, name: "Beta Mfg") }

  let!(:action_1) { create(:component, name: "Alpha Action", type: "action", manufacturer: manufacturer_a, discontinued: false, msrp_cents: 50000, weight_oz: 10.0) }
  let!(:action_2) { create(:component, name: "Beta Action", type: "action", manufacturer: manufacturer_b, discontinued: true, msrp_cents: 60000, weight_oz: 12.0) }
  let!(:stock_1)  { create(:component, name: "Alpha Stock", type: "stock", manufacturer: manufacturer_a, discontinued: false, msrp_cents: 30000, weight_oz: 24.0) }
  let!(:barrel_1) { create(:component, name: "Beta Barrel", type: "barrel", manufacturer: manufacturer_b, discontinued: false, msrp_cents: 40000, weight_oz: 28.0) }

  let(:query) do
    <<~GQL
      query GetComponents(
        $search: String
        $type: String
        $manufacturerId: ID
        $activeOnly: Boolean
        $limit: Int
        $offset: Int
      ) {
        components(
          search: $search
          type: $type
          manufacturerId: $manufacturerId
          activeOnly: $activeOnly
          limit: $limit
          offset: $offset
        ) {
          id
          name
          type
          weightOz
          msrpCents
          discontinued
          imageUrl
          manufacturer {
            id
            name
          }
        }
      }
    GQL
  end

  describe 'fetching all components' do
    it 'returns all components ordered by name' do
      result = graphql_request(query: query)

      data = result.dig('data', 'components')
      expect(data.length).to eq(4)
      names = data.map { |c| c['name'] }
      expect(names).to eq(names.sort)
    end

    it 'includes manufacturer data' do
      result = graphql_request(query: query)

      data = result.dig('data', 'components')
      first = data.first
      expect(first['manufacturer']).to be_present
      expect(first['manufacturer']['name']).to be_present
    end
  end

  describe 'search filter' do
    it 'filters by component name (case-insensitive)' do
      result = graphql_request(query: query, variables: { search: "alpha" })

      data = result.dig('data', 'components')
      expect(data.length).to eq(2)
      expect(data.map { |c| c['name'] }).to all(include("Alpha"))
    end

    it 'returns empty array for no matches' do
      result = graphql_request(query: query, variables: { search: "nonexistent" })

      data = result.dig('data', 'components')
      expect(data).to be_empty
    end
  end

  describe 'type filter' do
    it 'filters by component type' do
      result = graphql_request(query: query, variables: { type: "action" })

      data = result.dig('data', 'components')
      expect(data.length).to eq(2)
      expect(data.map { |c| c['type'] }).to all(eq("action"))
    end

    it 'returns only matching type' do
      result = graphql_request(query: query, variables: { type: "barrel" })

      data = result.dig('data', 'components')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq("Beta Barrel")
    end
  end

  describe 'manufacturer filter' do
    it 'filters by manufacturer ID' do
      result = graphql_request(query: query, variables: { manufacturerId: manufacturer_a.id.to_s })

      data = result.dig('data', 'components')
      expect(data.length).to eq(2)
      expect(data.map { |c| c['manufacturer']['name'] }).to all(eq("Alpha Mfg"))
    end
  end

  describe 'active_only filter' do
    it 'excludes discontinued components' do
      result = graphql_request(query: query, variables: { activeOnly: true })

      data = result.dig('data', 'components')
      expect(data.length).to eq(3)
      expect(data.map { |c| c['discontinued'] }).to all(be false)
    end

    it 'includes discontinued when not set' do
      result = graphql_request(query: query)

      data = result.dig('data', 'components')
      expect(data.length).to eq(4)
    end
  end

  describe 'pagination with limit and offset' do
    it 'limits results' do
      result = graphql_request(query: query, variables: { limit: 2 })

      data = result.dig('data', 'components')
      expect(data.length).to eq(2)
    end

    it 'offsets results' do
      all_result = graphql_request(query: query)
      all_names = all_result.dig('data', 'components').map { |c| c['name'] }

      offset_result = graphql_request(query: query, variables: { offset: 2 })
      offset_names = offset_result.dig('data', 'components').map { |c| c['name'] }

      expect(offset_names).to eq(all_names[2..])
    end

    it 'paginates with limit and offset together' do
      all_result = graphql_request(query: query)
      all_names = all_result.dig('data', 'components').map { |c| c['name'] }

      page_result = graphql_request(query: query, variables: { limit: 2, offset: 1 })
      page_names = page_result.dig('data', 'components').map { |c| c['name'] }

      expect(page_names.length).to eq(2)
      expect(page_names).to eq(all_names[1..2])
    end

    it 'returns empty when offset exceeds total' do
      result = graphql_request(query: query, variables: { offset: 100 })

      data = result.dig('data', 'components')
      expect(data).to be_empty
    end
  end

  describe 'combined filters' do
    it 'combines search with type filter' do
      result = graphql_request(query: query, variables: { search: "alpha", type: "action" })

      data = result.dig('data', 'components')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq("Alpha Action")
    end

    it 'combines active_only with manufacturer filter' do
      result = graphql_request(query: query, variables: { activeOnly: true, manufacturerId: manufacturer_b.id.to_s })

      data = result.dig('data', 'components')
      expect(data.length).to eq(1)
      expect(data.first['name']).to eq("Beta Barrel")
    end

    it 'combines all filters with pagination' do
      result = graphql_request(
        query: query,
        variables: { activeOnly: true, manufacturerId: manufacturer_a.id.to_s, limit: 1 }
      )

      data = result.dig('data', 'components')
      expect(data.length).to eq(1)
    end
  end
end
