class Build < ApplicationRecord
  belongs_to :user
  has_many :build_components, dependent: :destroy
  has_many :components, through: :build_components
  has_many :ballistic_profiles, dependent: :destroy

  validates :name, presence: true

  # Disciplines for precision rifle builds
  DISCIPLINES = %w[prs nrl benchrest f-class tactical hunting].freeze

  validates :discipline, inclusion: { in: DISCIPLINES }, allow_nil: true

  # Calculate totals from components
  def calculate_totals!
    self.total_weight_oz = build_components.joins(:component).sum("components.weight_oz")
    self.total_cost_cents = build_components.joins(:component).sum("components.msrp_cents")
    self.new_cost_cents = build_components
                         .joins(:component)
                         .where(build_components: { owned: false })
                         .sum("components.msrp_cents")
    save!
  end

  def owned_cost_cents
    total_cost_cents.to_i - new_cost_cents.to_i
  end
end
