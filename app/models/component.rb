class Component < ApplicationRecord
  # Disable STI since we use 'type' as a component category field, not for inheritance
  self.inheritance_column = nil

  belongs_to :manufacturer
  has_many :build_components, dependent: :destroy
  has_many :builds, through: :build_components

  validates :name, presence: true
  validates :weight_oz, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :msrp_cents, numericality: { greater_than_or_equal_to: 0, only_integer: true }, allow_nil: true

  # Component types/categories
  TYPES = %w[
    action barrel stock chassis trigger scope mount rings bipod
    muzzle_device grip magazine buttpad cheek_riser other
  ].freeze

  validates :type, inclusion: { in: TYPES }, allow_nil: true

  # Default scope to exclude discontinued items
  scope :active, -> { where(discontinued: [false, nil]) }
  scope :discontinued, -> { where(discontinued: true) }
  scope :by_type, ->(type) { where(type: type) }
end
