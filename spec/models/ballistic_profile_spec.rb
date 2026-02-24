# frozen_string_literal: true

require "rails_helper"

RSpec.describe BallisticProfile, type: :model do
  let(:user) { create(:user) }
  let(:build_record) { create(:build, user: user) }

  describe "validations" do
    subject { build(:ballistic_profile, build: build_record) }

    it { is_expected.to be_valid }

    it "requires name" do
      subject.name = nil
      expect(subject).not_to be_valid
    end

    it "requires caliber" do
      subject.caliber = nil
      expect(subject).not_to be_valid
    end
  end

  describe "projectile association" do
    it "optionally belongs to a projectile" do
      profile = create(:ballistic_profile, build: build_record, projectile: nil)
      expect(profile).to be_valid
    end

    it "auto-populates bullet data from projectile on create" do
      projectile = create(:projectile,
        weight_grains: 147,
        bc_g1: 0.697,
        bc_g7: 0.351,
        base_type: "boat_tail"
      )

      profile = create(:ballistic_profile,
        build: build_record,
        projectile: projectile,
        bullet_weight_grains: nil,
        bullet_bc: nil,
        bc_type: nil
      )

      expect(profile.bullet_weight_grains).to eq(147)
      expect(profile.bullet_bc.to_f).to eq(0.351)
      expect(profile.bc_type).to eq("G7")
    end

    it "uses G1 for flat_base projectiles" do
      projectile = create(:projectile,
        bc_g1: 0.350,
        bc_g7: 0.180,
        base_type: "flat_base"
      )

      profile = create(:ballistic_profile,
        build: build_record,
        projectile: projectile,
        bullet_weight_grains: nil,
        bullet_bc: nil,
        bc_type: nil
      )

      expect(profile.bullet_bc.to_f).to eq(0.350)
      expect(profile.bc_type).to eq("G1")
    end
  end

  describe "#generate_dope_table!" do
    let(:profile) do
      create(:ballistic_profile,
        build: build_record,
        muzzle_velocity_fps: 2700,
        bullet_weight_grains: 140,
        bullet_bc: 0.326,
        bc_type: "G7",
        zero_distance_yards: 100,
        sight_height_inches: 1.5
      )
    end

    it "creates ballistic drop records" do
      expect {
        profile.generate_dope_table!(max_distance: 300, step: 100)
      }.to change { profile.ballistic_drops.count }.by(3)
    end

    it "populates drop data for each distance" do
      drops = profile.generate_dope_table!(max_distance: 300, step: 100)
      expect(drops.length).to eq(3)

      drops.each do |drop|
        expect(drop.distance_yards).to be_present
        expect(drop.drop_inches).to be_present
        expect(drop.drop_moa).to be_present
        expect(drop.drop_mils).to be_present
        expect(drop.velocity_fps).to be_present
        expect(drop.energy_ft_lbs).to be_present
        expect(drop.time_of_flight_sec).to be_present
      end
    end

    it "updates existing drops instead of creating duplicates" do
      profile.generate_dope_table!(max_distance: 300, step: 100)

      expect {
        profile.generate_dope_table!(max_distance: 300, step: 100)
      }.not_to change { profile.ballistic_drops.count }
    end

    it "preserves verified status on regeneration" do
      profile.generate_dope_table!(max_distance: 300, step: 100)
      drop_200 = profile.ballistic_drops.find_by(distance_yards: 200)
      drop_200.update!(is_verified: true)

      profile.generate_dope_table!(max_distance: 300, step: 100)
      drop_200.reload
      expect(drop_200.is_verified).to be true
    end
  end

  describe "#caliber_diameter" do
    it "returns the correct bullet diameter for known calibers" do
      profile = build(:ballistic_profile, caliber: "6.5 Creedmoor")
      expect(profile.caliber_diameter).to eq(0.264)
    end

    it "returns nil for unknown calibers" do
      profile = build(:ballistic_profile, caliber: "Unknown")
      expect(profile.caliber_diameter).to be_nil
    end
  end
end
