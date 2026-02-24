# frozen_string_literal: true

require "rails_helper"

RSpec.describe Projectile, type: :model do
  describe "validations" do
    subject { build(:projectile) }

    it { is_expected.to be_valid }

    it "requires manufacturer" do
      subject.manufacturer = nil
      expect(subject).not_to be_valid
    end

    it "requires name" do
      subject.name = nil
      expect(subject).not_to be_valid
    end

    it "requires caliber_inches" do
      subject.caliber_inches = nil
      expect(subject).not_to be_valid
    end

    it "requires weight_grains" do
      subject.weight_grains = nil
      expect(subject).not_to be_valid
    end

    it "validates uniqueness of name scoped to manufacturer" do
      create(:projectile, manufacturer: "Hornady", name: "140gr ELD-M")
      duplicate = build(:projectile, manufacturer: "Hornady", name: "140gr ELD-M")
      expect(duplicate).not_to be_valid
    end

    it "allows same name for different manufacturers" do
      create(:projectile, manufacturer: "Hornady", name: "140gr Match")
      different_mfr = build(:projectile, manufacturer: "Sierra", name: "140gr Match")
      expect(different_mfr).to be_valid
    end

    it "validates base_type inclusion" do
      subject.base_type = "invalid"
      expect(subject).not_to be_valid
    end
  end

  describe "scopes" do
    let!(:hornady_264) { create(:projectile, manufacturer: "Hornady", caliber_inches: 0.264) }
    let!(:sierra_264) { create(:projectile, manufacturer: "Sierra", caliber_inches: 0.264) }
    let!(:hornady_308) { create(:projectile, manufacturer: "Hornady", caliber_inches: 0.308, weight_grains: 175) }

    it ".by_caliber filters by caliber_inches" do
      expect(Projectile.by_caliber(0.264)).to contain_exactly(hornady_264, sierra_264)
    end

    it ".by_manufacturer filters by manufacturer" do
      expect(Projectile.by_manufacturer("Hornady")).to contain_exactly(hornady_264, hornady_308)
    end
  end

  describe ".for_cartridge" do
    let!(:proj_264) { create(:projectile, caliber_inches: 0.264) }

    it "returns projectiles matching the cartridge diameter" do
      expect(Projectile.for_cartridge("6.5 Creedmoor")).to include(proj_264)
    end

    it "returns none for unknown cartridge" do
      expect(Projectile.for_cartridge("Unknown Cartridge")).to be_empty
    end
  end

  describe "#preferred_bc" do
    it "returns G7 BC for boat_tail bullets" do
      proj = build(:projectile, bc_g1: 0.646, bc_g7: 0.326, base_type: "boat_tail")
      expect(proj.preferred_bc).to eq({ value: 0.326, type: "G7" })
    end

    it "returns G1 BC for flat_base bullets" do
      proj = build(:projectile, bc_g1: 0.350, bc_g7: 0.180, base_type: "flat_base")
      expect(proj.preferred_bc).to eq({ value: 0.350, type: "G1" })
    end

    it "falls back to G1 if G7 is nil" do
      proj = build(:projectile, bc_g1: 0.500, bc_g7: nil, base_type: "boat_tail")
      expect(proj.preferred_bc).to eq({ value: 0.500, type: "G1" })
    end
  end

  describe "#display_name" do
    it "returns formatted display name" do
      proj = build(:projectile, manufacturer: "Hornady", weight_grains: 140, name: "ELD-M")
      expect(proj.display_name).to eq("Hornady 140gr ELD-M")
    end
  end
end
