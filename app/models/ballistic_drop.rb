# frozen_string_literal: true

class BallisticDrop < ApplicationRecord
  belongs_to :ballistic_profile

  validates :distance_yards, presence: true,
            numericality: { greater_than: 0, only_integer: true }
  validates :distance_yards, uniqueness: { scope: :ballistic_profile_id,
            message: "already has a drop entry at this distance" }

  validates :drop_inches, numericality: true, allow_nil: true
  validates :drop_moa, numericality: true, allow_nil: true
  validates :drop_mils, numericality: true, allow_nil: true
  validates :windage_inches, numericality: true, allow_nil: true
  validates :windage_moa, numericality: true, allow_nil: true
  validates :windage_mils, numericality: true, allow_nil: true
  validates :velocity_fps, numericality: { greater_than: 0 }, allow_nil: true
  validates :energy_ft_lbs, numericality: { greater_than: 0 }, allow_nil: true
  validates :time_of_flight_sec, numericality: { greater_than: 0 }, allow_nil: true

  # Convert between MOA and Mils if one is provided
  # 1 MOA = 0.2909 Mils
  MOA_TO_MIL = 0.2909

  def moa_from_mils
    return nil unless drop_mils
    (drop_mils / MOA_TO_MIL).round(2)
  end

  def mils_from_moa
    return nil unless drop_moa
    (drop_moa * MOA_TO_MIL).round(2)
  end
end
