class CreateProjectiles < ActiveRecord::Migration[8.1]
  def change
    create_table :projectiles do |t|
      t.string :manufacturer, null: false
      t.string :name, null: false
      t.decimal :caliber_inches, precision: 6, scale: 4, null: false
      t.decimal :weight_grains, precision: 6, scale: 1, null: false
      t.decimal :bc_g1, precision: 6, scale: 4
      t.decimal :bc_g7, precision: 6, scale: 4
      t.string :bullet_type
      t.string :base_type, default: "boat_tail"
      t.string :recommended_twist

      t.timestamps
    end

    add_index :projectiles, [:caliber_inches, :manufacturer], name: "idx_projectiles_on_caliber_and_mfr"
    add_index :projectiles, :manufacturer
    add_index :projectiles, [:manufacturer, :name], unique: true, name: "idx_projectiles_on_mfr_and_name"
  end
end
