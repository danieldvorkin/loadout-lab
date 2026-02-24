# frozen_string_literal: true

class Projectile < ApplicationRecord
  has_many :ballistic_profiles, dependent: :nullify

  validates :manufacturer, presence: true
  validates :name, presence: true, uniqueness: { scope: :manufacturer }
  validates :caliber_inches, presence: true, numericality: { greater_than: 0 }
  validates :weight_grains, presence: true, numericality: { greater_than: 0 }
  validates :bc_g1, numericality: { greater_than: 0, less_than: 2 }, allow_nil: true
  validates :bc_g7, numericality: { greater_than: 0, less_than: 2 }, allow_nil: true
  validates :base_type, inclusion: { in: %w[boat_tail flat_base hybrid] }, allow_nil: true

  scope :by_caliber, ->(caliber_inches) { where(caliber_inches: caliber_inches) }
  scope :by_manufacturer, ->(manufacturer) { where(manufacturer: manufacturer) }
  scope :ordered, -> { order(:manufacturer, :weight_grains, :name) }

  # Map cartridge names to bullet diameters (inches)
  CARTRIDGE_DIAMETER_MAP = {
    ".223 Remington" => 0.224,
    "6mm Creedmoor" => 0.243,
    "6mm BR" => 0.243,
    "6mm Dasher" => 0.243,
    ".260 Remington" => 0.264,
    "6.5 Creedmoor" => 0.264,
    "6.5 PRC" => 0.264,
    "6.5x47 Lapua" => 0.264,
    ".284 Winchester" => 0.284,
    "7mm PRC" => 0.284,
    ".308 Winchester" => 0.308,
    ".300 Winchester Magnum" => 0.308,
    ".300 PRC" => 0.308,
    ".300 Norma Magnum" => 0.308,
    ".338 Lapua Magnum" => 0.338
  }.freeze

  MANUFACTURERS = %w[Hornady Sierra Berger Nosler Lapua Barnes].freeze

  def self.for_cartridge(cartridge_name)
    diameter = CARTRIDGE_DIAMETER_MAP[cartridge_name]
    return none unless diameter

    by_caliber(diameter).ordered
  end

  def self.available_manufacturers
    distinct.pluck(:manufacturer).sort
  end

  def display_name
    "#{manufacturer} #{weight_grains.to_i}gr #{name}"
  end

  # Returns the preferred BC (G7 for boat-tail, G1 otherwise)
  def preferred_bc
    if base_type == "flat_base"
      { value: bc_g1, type: "G1" }
    else
      { value: bc_g7 || bc_g1, type: bc_g7 ? "G7" : "G1" }
    end
  end
end
