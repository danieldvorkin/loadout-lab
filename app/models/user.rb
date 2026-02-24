class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable,
         :registerable,
         :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: self

  has_many :builds, dependent: :destroy

  # Roles enum - admin@example.com gets admin, everyone else is user
  enum :role, { user: 0, admin: 1 }

  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :email, presence: true, uniqueness: { case_sensitive: false }

  # Generate JTI on create
  before_create :set_jti
  before_create :assign_role

  def admin?
    role == "admin"
  end

  private

  def set_jti
    self.jti ||= SecureRandom.uuid
  end

  def assign_role
    self.role = email == "admin@example.com" ? :admin : :user
  end
end
