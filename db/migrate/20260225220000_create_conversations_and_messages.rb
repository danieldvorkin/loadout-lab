class CreateConversationsAndMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.references :listing, null: false, foreign_key: true
      t.references :buyer,   null: false, foreign_key: { to_table: :users }
      t.references :seller,  null: false, foreign_key: { to_table: :users }
      t.datetime   :last_message_at
      t.timestamps
    end

    add_index :conversations, %i[listing_id buyer_id], unique: true
    add_index :conversations, :last_message_at

    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true
      t.references :user,         null: false, foreign_key: true
      t.text       :body,         null: false
      t.boolean    :read,         null: false, default: false
      t.timestamps
    end

    add_index :messages, %i[conversation_id read]
  end
end
