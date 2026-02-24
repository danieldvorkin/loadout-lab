# frozen_string_literal: true

class LoadTest < ApplicationRecord
  belongs_to :ballistic_profile

  validates :charge_grains, numericality: { greater_than: 0 }, allow_nil: true
  validates :velocity_fps, numericality: { greater_than: 0 }, allow_nil: true
  validates :group_size_moa, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :group_size_inches, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :distance_yards, numericality: { greater_than: 0, only_integer: true }, allow_nil: true
end
