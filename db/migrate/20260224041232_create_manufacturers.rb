class CreateManufacturers < ActiveRecord::Migration[8.1]
  def change
    create_table :manufacturers do |t|
      t.string :name
      t.string :website
      t.string :country

      t.timestamps
    end
  end
end
