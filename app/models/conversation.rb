# frozen_string_literal: true

class Conversation < ApplicationRecord
  belongs_to :listing
  belongs_to :buyer,  class_name: "User"
  belongs_to :seller, class_name: "User"
  has_many :messages, -> { order(created_at: :asc) }, dependent: :destroy

  validates :buyer_id, uniqueness: { scope: :listing_id }
  validate :buyer_and_seller_must_differ

  scope :for_user, ->(user) { where(buyer: user).or(where(seller: user)) }
  scope :recent, -> { order(Arel.sql("last_message_at DESC NULLS LAST, created_at DESC")) }

  def participant?(user)
    buyer_id == user.id || seller_id == user.id
  end

  def other_participant(user)
    buyer_id == user.id ? seller : buyer
  end

  def latest_message
    messages.last
  end

  private

  def buyer_and_seller_must_differ
    errors.add(:buyer, "can't message yourself") if buyer_id == seller_id
  end
end
