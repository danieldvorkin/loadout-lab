# frozen_string_literal: true

module Mutations
  class StartConversation < BaseMutation
    argument :listing_id, ID,     required: true
    argument :message,    String, required: false

    field :conversation, Types::ConversationType, null: true
    field :errors,       [String],                null: false

    def resolve(listing_id:, message: nil)
      return { conversation: nil, errors: ['Not authenticated'] } unless context[:current_user]

      current_user = context[:current_user]
      listing      = Listing.find_by(id: listing_id)
      return { conversation: nil, errors: ['Listing not found'] }           unless listing
      return { conversation: nil, errors: ["You can't message yourself"] }   if listing.user_id == current_user.id

      conversation = Conversation.find_or_initialize_by(
        listing_id: listing.id,
        buyer_id:   current_user.id
      )

      unless conversation.persisted?
        conversation.seller_id = listing.user_id
        unless conversation.save
          return { conversation: nil, errors: conversation.errors.full_messages }
        end
      end

      conversation.messages.create!(user: current_user, body: message.strip) if message.present?

      { conversation: conversation.reload, errors: [] }
    end
  end
end
