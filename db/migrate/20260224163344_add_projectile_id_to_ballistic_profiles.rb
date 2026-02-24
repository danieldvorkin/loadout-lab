class AddProjectileIdToBallisticProfiles < ActiveRecord::Migration[8.1]
  def change
    add_reference :ballistic_profiles, :projectile, null: true, foreign_key: true
  end
end
