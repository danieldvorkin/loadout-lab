# frozen_string_literal: true

require "rails_helper"

RSpec.describe "UpsertLoadTest mutation", type: :request do
  let(:user) { create(:user) }
  let(:build_record) { create(:build, user: user) }
  let(:profile) { create(:ballistic_profile, build: build_record) }

  let(:mutation) do
    <<~GRAPHQL
      mutation UpsertLoadTest($input: UpsertLoadTestInput!) {
        upsertLoadTest(input: $input) {
          id
          chargeGrains
          velocityFps
          groupSizeMoa
          groupSizeInches
          distanceYards
          notes
        }
      }
    GRAPHQL
  end

  it "creates a new load test" do
    json = graphql_request(
      query: mutation,
      variables: {
        input: {
          ballisticProfileId: profile.id,
          chargeGrains: 41.5,
          velocityFps: 2750,
          groupSizeInches: 0.45,
          distanceYards: 100,
          notes: "initial ladder"
        }
      },
      user: user
    )
    data = json.dig("data", "upsertLoadTest")

    expect(response).to have_http_status(:ok)
    expect(data["chargeGrains"]).to eq(41.5)
    expect(data["velocityFps"]).to eq(2750)
    expect(data["distanceYards"]).to eq(100)
    expect(profile.load_tests.count).to eq(1)
  end

  it "updates an existing load test when id is provided" do
    load_test = profile.load_tests.create!(charge_grains: 41.5, distance_yards: 100)

    json = graphql_request(
      query: mutation,
      variables: {
        input: {
          ballisticProfileId: profile.id,
          id: load_test.id,
          velocityFps: 2760,
          notes: "refined node"
        }
      },
      user: user
    )
    data = json.dig("data", "upsertLoadTest")

    expect(response).to have_http_status(:ok)
    expect(data["velocityFps"]).to eq(2760)
    expect(data["notes"]).to eq("refined node")
    expect(profile.load_tests.count).to eq(1)
  end
end
