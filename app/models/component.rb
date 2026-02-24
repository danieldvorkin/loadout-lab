class Component < ApplicationRecord
  belongs_to :manufacturer
  has_many :build_components, dependent: :destroy
  has_many :builds, through: :build_components

  validates :name, presence: true
  validates :weight_oz, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :msrp_cents, numericality: { greater_than_or_equal_to: 0, only_integer: true }, allow_nil: true

  # Default scope to exclude discontinued items
  scope :active, -> { where(discontinued: [false, nil]) }
  scope :discontinued, -> { where(discontinued: true) }
end
