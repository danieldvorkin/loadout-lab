# frozen_string_literal: true

module Mutations
  class SendMessage < BaseMutation
    argument :conversation_id, ID,     required: true
    argument :body,            String, required: true

    field :message, Types::MessageType, null: true
    field :errors,  [ String ],           null: false

    def resolve(conversation_id:, body:)
      return { message: nil, errors: [ "Not authenticated" ] } unless context[:current_user]

      current_user = context[:current_user]
      conversation = Conversation.find_by(id: conversation_id)
      return { message: nil, errors: [ "Conversation not found" ] } unless conversation
      return { message: nil, errors: [ "Not authorized" ] }         unless conversation.participant?(current_user)

      message = conversation.messages.build(user: current_user, body: body.strip)
      if message.save
        { message: message, errors: [] }
      else
        { message: nil, errors: message.errors.full_messages }
      end
    end
  end
end
