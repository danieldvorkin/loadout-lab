class Manufacturer < ApplicationRecord
  has_many :components, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validates :website, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), allow_blank: true }
end
