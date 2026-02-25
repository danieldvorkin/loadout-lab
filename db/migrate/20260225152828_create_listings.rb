class CreateListings < ActiveRecord::Migration[8.1]
  def change
    create_table :listings do |t|
      t.bigint :user_id, null: false
      t.bigint :component_id, null: false
      t.bigint :build_component_id
      t.integer :listing_type, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.integer :condition, null: false, default: 0
      t.integer :price_cents
      t.string :title, null: false
      t.text :description
      t.string :location
      t.string :contact_info
      t.string :image_url

      t.timestamps
    end

    add_index :listings, :user_id
    add_index :listings, :component_id
    add_index :listings, :status
    add_index :listings, :listing_type
    add_foreign_key :listings, :users
    add_foreign_key :listings, :components
  end
end
