# frozen_string_literal: true

require 'rails_helper'

RSpec.describe "Single component query", type: :request do
  let!(:manufacturer) { create(:manufacturer, name: "Test Mfg", country: "USA") }
  let!(:component) { create(:component, name: "Test Action", type: "action", manufacturer: manufacturer, image_url: "https://example.com/img.jpg") }

  let(:query) do
    <<~GQL
      query GetComponent($id: ID!) {
        component(id: $id) {
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
            website
            country
          }
        }
      }
    GQL
  end

  it 'returns a component by ID' do
    result = graphql_request(query: query, variables: { id: component.id.to_s })

    data = result.dig('data', 'component')
    expect(data['name']).to eq("Test Action")
    expect(data['type']).to eq("action")
    expect(data['imageUrl']).to eq("https://example.com/img.jpg")
    expect(data['manufacturer']['name']).to eq("Test Mfg")
  end

  it 'returns null for non-existent ID' do
    result = graphql_request(query: query, variables: { id: "999999" })

    data = result.dig('data', 'component')
    expect(data).to be_nil
  end
end

RSpec.describe "Single manufacturer query", type: :request do
  let!(:manufacturer) { create(:manufacturer, name: "Test Mfg", country: "Canada", website: "https://test.ca", image_url: "https://example.com/logo.png") }

  let(:query) do
    <<~GQL
      query GetManufacturer($id: ID!) {
        manufacturer(id: $id) {
          id
          name
          website
          country
          imageUrl
        }
      }
    GQL
  end

  it 'returns a manufacturer by ID' do
    result = graphql_request(query: query, variables: { id: manufacturer.id.to_s })

    data = result.dig('data', 'manufacturer')
    expect(data['name']).to eq("Test Mfg")
    expect(data['country']).to eq("Canada")
    expect(data['website']).to eq("https://test.ca")
    expect(data['imageUrl']).to eq("https://example.com/logo.png")
  end

  it 'returns null for non-existent ID' do
    result = graphql_request(query: query, variables: { id: "999999" })

    data = result.dig('data', 'manufacturer')
    expect(data).to be_nil
  end
end

RSpec.describe "Component types query", type: :request do
  let(:query) do
    <<~GQL
      query {
        componentTypes
      }
    GQL
  end

  it 'returns available component types' do
    result = graphql_request(query: query)

    data = result.dig('data', 'componentTypes')
    expect(data).to be_an(Array)
    expect(data).to include("action", "barrel", "stock")
  end
end

RSpec.describe "Disciplines query", type: :request do
  let(:query) do
    <<~GQL
      query {
        disciplines
      }
    GQL
  end

  it 'returns available disciplines' do
    result = graphql_request(query: query)

    data = result.dig('data', 'disciplines')
    expect(data).to be_an(Array)
    expect(data).not_to be_empty
  end
end
