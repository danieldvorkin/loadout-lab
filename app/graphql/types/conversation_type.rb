# frozen_string_literal: true

module Types
  class ConversationType < Types::BaseObject
    field :id,               ID,                              null: false
    field :listing,          Types::ListingType,              null: false
    field :buyer,            Types::UserType,                 null: false
    field :seller,           Types::UserType,                 null: false
    field :messages,         [ Types::MessageType ],            null: false
    field :latest_message,   Types::MessageType,              null: true
    field :last_message_at,  GraphQL::Types::ISO8601DateTime, null: true
    field :unread_count,     Integer,                         null: false
    field :created_at,       GraphQL::Types::ISO8601DateTime, null: false

    def listing
      dataloader.with(Dataloader::RecordLoader, Listing).load(object.listing_id)
    end

    def buyer
      dataloader.with(Dataloader::RecordLoader, User).load(object.buyer_id)
    end

    def seller
      dataloader.with(Dataloader::RecordLoader, User).load(object.seller_id)
    end

    # Messages have an order scope on the model (created_at: :asc) which the
    # preloader respects, so the returned array is already in chronological order.
    def messages
      dataloader.with(Dataloader::AssociationLoader, Conversation, :messages).load(object)
    end

    def latest_message
      dataloader.with(Dataloader::AssociationLoader, Conversation, :messages).load(object).then do |msgs|
        msgs.last
      end
    end

    # Reuses the already-batched messages — no extra query per conversation.
    def unread_count
      current_user = context[:current_user]
      return 0 unless current_user

      dataloader.with(Dataloader::AssociationLoader, Conversation, :messages).load(object).then do |msgs|
        msgs.count { |m| !m.read && m.user_id != current_user.id }
      end
    end
  end
end
