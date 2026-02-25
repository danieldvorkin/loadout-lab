# frozen_string_literal: true

class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  validates :body, presence: true, length: { maximum: 5000 }

  after_create :touch_conversation

  private

  def touch_conversation
    conversation.update_column(:last_message_at, created_at)
  end
end
