class CreateBallisticProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :ballistic_profiles do |t|
      t.references :build, null: false, foreign_key: true
      t.string :caliber
      t.decimal :bullet_weight_grains
      t.decimal :bullet_bc
      t.string :bc_type
      t.integer :muzzle_velocity_fps
      t.integer :zero_distance_yards
      t.decimal :sight_height_inches
      t.string :twist_rate
      t.decimal :barrel_length_inches
      t.integer :altitude_feet
      t.integer :temperature_f
      t.integer :humidity_percent
      t.decimal :pressure_inhg
      t.integer :wind_speed_mph
      t.integer :wind_angle_degrees
      t.string :name
      t.text :notes

      t.timestamps
    end
  end
end
