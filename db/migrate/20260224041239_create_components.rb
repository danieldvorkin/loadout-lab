class CreateComponents < ActiveRecord::Migration[8.1]
  def change
    create_table :components do |t|
      t.string :name
      t.string :type
      t.decimal :weight_oz
      t.integer :msrp_cents
      t.references :manufacturer, null: false, foreign_key: true
      t.jsonb :specs
      t.boolean :discontinued

      t.timestamps
    end
  end
end
