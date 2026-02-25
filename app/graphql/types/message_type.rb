# frozen_string_literal: true

module Types
  class MessageType < Types::BaseObject
    field :id,         ID,                                   null: false
    field :body,       String,                               null: false
    field :read,       Boolean,                              null: false
    field :user,       Types::UserType,                      null: false
    field :created_at, GraphQL::Types::ISO8601DateTime,      null: false

    def user
      dataloader.with(Dataloader::RecordLoader, User).load(object.user_id)
    end
  end
end
