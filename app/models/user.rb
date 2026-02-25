class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable,
         :registerable,
         :validatable,
         :jwt_authenticatable,
         jwt_revocation_strategy: self

  has_many :builds,               dependent: :destroy
  has_many :listings,              dependent: :destroy
  has_many :sent_conversations,    class_name: 'Conversation', foreign_key: :buyer_id,  dependent: :destroy
  has_many :received_conversations, class_name: 'Conversation', foreign_key: :seller_id, dependent: :destroy
  has_many :messages,              dependent: :destroy

  # Roles enum - admin@example.com gets admin, everyone else is user
  enum :role, { user: 0, admin: 1 }

  # Disciplines enum for preferred_discipline
  DISCIPLINES = %w[prs nrl hunting long_range tactical benchrest].freeze

  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :website, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: "must be a valid URL" }, allow_blank: true
  validates :preferred_discipline, inclusion: { in: DISCIPLINES }, allow_blank: true
  validates :bio, length: { maximum: 500 }, allow_blank: true

  # Allow OAuth users to skip password validation
  def password_required?
    provider.blank? ? super : false
  end

  # Find or create user from Google OAuth payload
  def self.from_google(uid:, email:, full_name:, avatar_url: nil)
    user = find_by(provider: "google", uid: uid)
    user ||= find_by(email: email)

    if user
      # Update OAuth info and profile picture if new
      user.update(provider: "google", uid: uid, avatar_url: avatar_url) if user.provider.blank? || (avatar_url && user.avatar_url.blank?)
      user
    else
      base_username = email.split("@").first.gsub(/[^a-zA-Z0-9_]/, "")
      username = base_username
      username = "#{base_username}_#{uid.last(6)}" if exists?(username: base_username)

      create!(
        provider: "google",
        uid: uid,
        email: email,
        username: username,
        full_name: full_name || "",
        avatar_url: avatar_url,
        password: SecureRandom.hex(24)
      )
    end
  end

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
