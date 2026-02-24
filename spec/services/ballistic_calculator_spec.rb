# frozen_string_literal: true

require "rails_helper"

RSpec.describe BallisticCalculator, type: :service do
  let(:user) { create(:user) }
  let(:build_record) { create(:build, user: user) }

  # Standard 6.5 Creedmoor match load: 140gr ELD-M, BC 0.326 G7, 2700fps, 100yd zero
  let(:profile) do
    create(:ballistic_profile,
      build: build_record,
      caliber: "6.5 Creedmoor",
      bullet_weight_grains: 140.0,
      bullet_bc: 0.326,
      bc_type: "G7",
      muzzle_velocity_fps: 2700,
      zero_distance_yards: 100,
      sight_height_inches: 1.5,
      temperature_f: 59,
      altitude_feet: 0,
      humidity_percent: 0,
      wind_speed_mph: 10,
      wind_angle_degrees: 90
    )
  end

  describe ".calculate" do
    it "returns an array of Result structs" do
      results = described_class.calculate(profile, max_distance: 600, step: 100)
      expect(results).to be_an(Array)
      expect(results.first).to respond_to(:distance_yards, :drop_inches, :drop_moa, :drop_mils,
                                          :windage_inches, :windage_moa, :windage_mils,
                                          :velocity_fps, :energy_ft_lbs, :time_of_flight_sec)
    end

    it "calculates at the correct distance intervals" do
      results = described_class.calculate(profile, max_distance: 500, step: 100)
      distances = results.map(&:distance_yards)
      expect(distances).to eq([100, 200, 300, 400, 500])
    end

    it "shows near-zero drop at the zero distance" do
      results = described_class.calculate(profile, max_distance: 200, step: 100)
      zero_result = results.find { |r| r.distance_yards == 100 }
      # At 100 yards (the zero distance), drop should be very close to zero
      expect(zero_result.drop_inches.abs).to be < 1.0
      expect(zero_result.drop_moa.abs).to be < 1.0
    end

    it "shows increasing negative drop at longer distances" do
      results = described_class.calculate(profile, max_distance: 1000, step: 100)
      # Beyond zero, drop should be increasingly negative
      drops = results.select { |r| r.distance_yards >= 300 }.map(&:drop_inches)
      expect(drops).to all(be < 0)

      # Each successive drop should be more negative than the previous
      drops.each_cons(2) do |d1, d2|
        expect(d2).to be < d1
      end
    end

    it "shows decreasing velocity at longer distances" do
      results = described_class.calculate(profile, max_distance: 1000, step: 100)
      velocities = results.map(&:velocity_fps)
      velocities.each_cons(2) do |v1, v2|
        expect(v2).to be < v1
      end
    end

    it "calculates reasonable velocity retention" do
      results = described_class.calculate(profile, max_distance: 1000, step: 100)
      # 6.5 Creedmoor 140gr ELD-M at 2700fps should retain ~1800-2000 fps at 500yds
      result_500 = results.find { |r| r.distance_yards == 500 }
      expect(result_500.velocity_fps).to be_between(1700, 2100)
    end

    it "calculates increasing time of flight" do
      results = described_class.calculate(profile, max_distance: 600, step: 100)
      tofs = results.map(&:time_of_flight_sec)
      tofs.each_cons(2) do |t1, t2|
        expect(t2).to be > t1
      end
    end

    it "calculates windage when wind is present" do
      results = described_class.calculate(profile, max_distance: 600, step: 100)
      # With 10mph crosswind, windage should be non-zero and increasing
      windages = results.map(&:windage_inches)
      expect(windages.last).to be > 0
      windages.each_cons(2) do |w1, w2|
        expect(w2.abs).to be >= w1.abs
      end
    end

    it "calculates no windage when wind speed is zero" do
      profile.update!(wind_speed_mph: 0)
      results = described_class.calculate(profile, max_distance: 600, step: 100)
      results.each do |r|
        expect(r.windage_inches.abs).to be < 0.01
      end
    end

    it "calculates energy correctly" do
      results = described_class.calculate(profile, max_distance: 200, step: 100)
      result_100 = results.find { |r| r.distance_yards == 100 }
      # KE = mv²/(450437) for grains and fps
      expected_ke = (140.0 * result_100.velocity_fps**2) / 450_437.0
      expect(result_100.energy_ft_lbs).to be_within(5).of(expected_ke)
    end

    it "supports different step sizes" do
      results = described_class.calculate(profile, max_distance: 300, step: 25)
      distances = results.map(&:distance_yards)
      expect(distances).to include(25, 50, 75, 100, 200, 300)
    end

    it "produces reasonable MOA/Mil values for known reference" do
      # A typical 6.5 Creedmoor at 1000 yards should be roughly 30-40 MOA drop
      results = described_class.calculate(profile, max_distance: 1000, step: 100)
      result_1000 = results.find { |r| r.distance_yards == 1000 }
      expect(result_1000.drop_moa.abs).to be_between(25, 45)
    end
  end

  describe "with G1 drag model" do
    let(:g1_profile) do
      create(:ballistic_profile,
        build: build_record,
        caliber: ".308 Winchester",
        bullet_weight_grains: 168.0,
        bullet_bc: 0.462,
        bc_type: "G1",
        muzzle_velocity_fps: 2650,
        zero_distance_yards: 100,
        sight_height_inches: 1.5,
        wind_speed_mph: 0
      )
    end

    it "calculates with G1 drag model" do
      results = described_class.calculate(g1_profile, max_distance: 600, step: 100)
      expect(results.length).to eq(6)
      expect(results.first.velocity_fps).to be < 2650
    end
  end

  describe "atmospheric corrections" do
    it "produces less drop at higher altitude (thinner air)" do
      sea_level = described_class.calculate(profile, max_distance: 600, step: 100)

      profile.update!(altitude_feet: 5000, pressure_inhg: nil)
      high_alt = described_class.calculate(profile, max_distance: 600, step: 100)

      # At higher altitude, less air resistance = less drop and more retained velocity
      sea_level_drop = sea_level.find { |r| r.distance_yards == 600 }.drop_inches.abs
      high_alt_drop = high_alt.find { |r| r.distance_yards == 600 }.drop_inches.abs
      expect(high_alt_drop).to be < sea_level_drop
    end
  end

  describe "error handling" do
    it "raises error when muzzle velocity is missing" do
      profile.update_column(:muzzle_velocity_fps, nil)
      expect { described_class.calculate(profile) }.to raise_error(ArgumentError, /Muzzle velocity/)
    end

    it "raises error when BC is missing" do
      profile.update_column(:bullet_bc, nil)
      expect { described_class.calculate(profile) }.to raise_error(ArgumentError, /Ballistic coefficient/)
    end

    it "raises error when bullet weight is missing" do
      profile.update_column(:bullet_weight_grains, nil)
      expect { described_class.calculate(profile) }.to raise_error(ArgumentError, /Bullet weight/)
    end
  end
end
