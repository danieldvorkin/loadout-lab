# frozen_string_literal: true

module Mutations
  class MarkConversationRead < BaseMutation
    argument :conversation_id, ID, required: true

    field :success, Boolean,  null: false
    field :errors,  [ String ], null: false

    def resolve(conversation_id:)
      return { success: false, errors: [ "Not authenticated" ] } unless context[:current_user]

      current_user = context[:current_user]
      conversation = Conversation.find_by(id: conversation_id)
      return { success: false, errors: [ "Conversation not found" ] } unless conversation
      return { success: false, errors: [ "Not authorized" ] }         unless conversation.participant?(current_user)

      conversation.messages
                  .where(read: false)
                  .where.not(user_id: current_user.id)
                  .update_all(read: true)

      { success: true, errors: [] }
    end
  end
end
