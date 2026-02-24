# frozen_string_literal: true

class BallisticProfile < ApplicationRecord
  belongs_to :build
  belongs_to :projectile, optional: true
  has_many :ballistic_drops, -> { order(:distance_yards) }, dependent: :destroy

  validates :name, presence: true
  validates :caliber, presence: true
  validates :muzzle_velocity_fps, numericality: { greater_than: 0 }, allow_nil: true
  validates :bullet_weight_grains, numericality: { greater_than: 0 }, allow_nil: true
  validates :bullet_bc, numericality: { greater_than: 0, less_than: 2 }, allow_nil: true
  validates :zero_distance_yards, numericality: { greater_than: 0 }, allow_nil: true
  validates :sight_height_inches, numericality: { greater_than: 0 }, allow_nil: true
  validates :barrel_length_inches, numericality: { greater_than: 0 }, allow_nil: true
  validates :altitude_feet, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :temperature_f, numericality: true, allow_nil: true
  validates :humidity_percent, numericality: { in: 0..100 }, allow_nil: true
  validates :pressure_inhg, numericality: { greater_than: 0 }, allow_nil: true
  validates :wind_speed_mph, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :wind_angle_degrees, numericality: { in: 0..360 }, allow_nil: true
  validates :bc_type, inclusion: { in: %w[G1 G7] }, allow_nil: true

  # When a projectile is selected, auto-populate bullet data
  before_validation :populate_from_projectile, if: -> { projectile_id_changed? && projectile.present? }

  # Common PRS/long-range calibers
  CALIBERS = %w[
    6mm\ Creedmoor 6.5\ Creedmoor 6.5\ PRC .308\ Winchester
    .300\ Winchester\ Magnum .300\ PRC .338\ Lapua\ Magnum
    .223\ Remington 6mm\ BR 6mm\ Dasher .260\ Remington
    6.5x47\ Lapua .284\ Winchester 7mm\ PRC .300\ Norma\ Magnum
  ].freeze

  # Returns the bullet diameter for this profile's caliber
  def caliber_diameter
    Projectile::CARTRIDGE_DIAMETER_MAP[caliber]
  end

  # Generate dope table using the ballistic calculator
  # @param max_distance [Integer] max range in yards
  # @param step [Integer] distance step in yards
  # @return [Array<BallisticDrop>] created/updated drop records
  def generate_dope_table!(max_distance: 1200, step: 25)
    results = BallisticCalculator.calculate(self, max_distance: max_distance, step: step)

    ActiveRecord::Base.transaction do
      results.map do |result|
        drop = ballistic_drops.find_or_initialize_by(distance_yards: result.distance_yards)
        drop.assign_attributes(
          drop_inches: result.drop_inches,
          drop_moa: result.drop_moa,
          drop_mils: result.drop_mils,
          windage_inches: result.windage_inches,
          windage_moa: result.windage_moa,
          windage_mils: result.windage_mils,
          velocity_fps: result.velocity_fps,
          energy_ft_lbs: result.energy_ft_lbs,
          time_of_flight_sec: result.time_of_flight_sec,
          is_verified: drop.persisted? ? drop.is_verified : false
        )
        drop.save!
        drop
      end
    end
  end

  private

  def populate_from_projectile
    self.bullet_weight_grains = projectile.weight_grains
    preferred = projectile.preferred_bc
    self.bullet_bc = preferred[:value]
    self.bc_type = preferred[:type]
  end
end
