class AddProfileFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :bio, :text
    add_column :users, :location, :string
    add_column :users, :avatar_url, :string
    add_column :users, :date_of_birth, :date
    add_column :users, :preferred_discipline, :string
    add_column :users, :website, :string
    add_column :users, :social_links, :jsonb, default: {}
    add_column :users, :notification_preferences, :jsonb, default: { email_updates: true, build_notifications: true }
  end
end
