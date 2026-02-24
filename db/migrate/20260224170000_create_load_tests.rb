# frozen_string_literal: true

class CreateLoadTests < ActiveRecord::Migration[8.1]
  def change
    create_table :load_tests do |t|
      t.references :ballistic_profile, null: false, foreign_key: true
      t.decimal :charge_grains, precision: 6, scale: 2
      t.integer :velocity_fps
      t.decimal :group_size_moa, precision: 6, scale: 3
      t.decimal :group_size_inches, precision: 6, scale: 3
      t.integer :distance_yards
      t.string :notes

      t.timestamps
    end

    add_index :load_tests,
              [:ballistic_profile_id, :charge_grains, :distance_yards],
              name: "idx_load_tests_on_profile_charge_distance"
  end
end
