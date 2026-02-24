class CreateBallisticDrops < ActiveRecord::Migration[8.1]
  def change
    create_table :ballistic_drops do |t|
      t.references :ballistic_profile, null: false, foreign_key: true
      t.integer :distance_yards
      t.decimal :drop_inches
      t.decimal :drop_moa
      t.decimal :drop_mils
      t.decimal :windage_inches
      t.decimal :windage_moa
      t.decimal :windage_mils
      t.integer :velocity_fps
      t.integer :energy_ft_lbs
      t.decimal :time_of_flight_sec
      t.boolean :is_verified
      t.string :notes

      t.timestamps
    end

    add_index :ballistic_drops, [:ballistic_profile_id, :distance_yards], unique: true, name: 'idx_drops_on_profile_and_distance'
  end
end
