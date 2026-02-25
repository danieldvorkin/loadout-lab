# frozen_string_literal: true

class Listing < ApplicationRecord
  belongs_to :user
  belongs_to :component
  belongs_to :build_component, optional: true

  enum :listing_type, { showcase: 0, for_sale: 1 }, prefix: true
  enum :status, { active: 0, sold: 1, removed: 2 }, prefix: true
  enum :condition, { new_condition: 0, like_new: 1, good: 2, fair: 3 }, prefix: false

  validates :title, presence: true, length: { maximum: 120 }
  validates :listing_type, presence: true
  validates :status, presence: true
  validates :condition, presence: true
  validates :price_cents, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :description, length: { maximum: 2000 }, allow_blank: true

  # Only for_sale listings can have a price
  validates :price_cents, absence: true, if: :listing_type_showcase?

  scope :active, -> { where(status: :active) }
  scope :for_sale, -> { where(listing_type: :for_sale) }
  scope :showcase, -> { where(listing_type: :showcase) }
  scope :recent, -> { order(created_at: :desc) }

  def price_dollars
    return nil unless price_cents
    price_cents / 100.0
  end
end
