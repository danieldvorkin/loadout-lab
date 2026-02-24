# frozen_string_literal: true

require "rails_helper"

RSpec.describe LoadTest, type: :model do
  let(:user) { create(:user) }
  let(:build_record) { create(:build, user: user) }
  let(:profile) { create(:ballistic_profile, build: build_record) }

  it "belongs to a ballistic profile" do
    load_test = described_class.new(ballistic_profile: profile)
    expect(load_test.ballistic_profile).to eq(profile)
  end

  it "allows nils for optional ballistic fields" do
    load_test = described_class.new(ballistic_profile: profile)
    expect(load_test).to be_valid
  end

  it "validates positive numeric fields when present" do
    load_test = described_class.new(
      ballistic_profile: profile,
      charge_grains: -1,
      velocity_fps: -10,
      group_size_moa: -0.1,
      group_size_inches: -0.1,
      distance_yards: 0
    )

    expect(load_test).not_to be_valid
    expect(load_test.errors[:charge_grains]).to be_present
    expect(load_test.errors[:velocity_fps]).to be_present
    expect(load_test.errors[:group_size_moa]).to be_present
    expect(load_test.errors[:group_size_inches]).to be_present
    expect(load_test.errors[:distance_yards]).to be_present
  end
end
