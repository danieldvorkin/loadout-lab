class CreateBuilds < ActiveRecord::Migration[8.1]
  def change
    create_table :builds do |t|
      t.string :name
      t.string :discipline
      t.decimal :total_weight_oz
      t.integer :total_cost_cents
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
