class BuildComponent < ApplicationRecord
  belongs_to :build
  belongs_to :component

  validates :build_id, uniqueness: { scope: [:component_id, :position], message: "already has this component in this position" }

  # Position examples: action, barrel, stock, trigger, scope, mount, bipod, muzzle_device, etc.
  POSITIONS = %w[action barrel stock trigger scope mount rings bipod muzzle_device chassis grip magazine buttpad cheek_riser other].freeze

  validates :position, inclusion: { in: POSITIONS }, allow_nil: true

  # After save, recalculate build totals
  after_save :update_build_totals
  after_destroy :update_build_totals

  private

  def update_build_totals
    build.calculate_totals!
  end
end
