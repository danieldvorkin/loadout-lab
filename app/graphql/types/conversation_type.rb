# frozen_string_literal: true

module Types
  class ConversationType < Types::BaseObject
    field :id,               ID,                              null: false
    field :listing,          Types::ListingType,              null: false
    field :buyer,            Types::UserType,                 null: false
    field :seller,           Types::UserType,                 null: false
    field :messages,         [Types::MessageType],            null: false
    field :latest_message,   Types::MessageType,              null: true
    field :last_message_at,  GraphQL::Types::ISO8601DateTime, null: true
    field :unread_count,     Integer,                         null: false
    field :created_at,       GraphQL::Types::ISO8601DateTime, null: false

    def messages
      object.messages.order(created_at: :asc)
    end

    def latest_message
      object.messages.last
    end

    def unread_count
      current_user = context[:current_user]
      return 0 unless current_user

      object.messages.where(read: false).where.not(user_id: current_user.id).count
    end
  end
end
