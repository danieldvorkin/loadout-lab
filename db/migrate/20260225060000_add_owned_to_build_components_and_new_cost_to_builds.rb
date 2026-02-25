class AddOwnedToBuildComponentsAndNewCostToBuilds < ActiveRecord::Migration[8.1]
  def up
    add_column :build_components, :owned, :boolean, default: false, null: false
    add_column :builds, :new_cost_cents, :integer, default: 0, null: false

    Build.reset_column_information
    Build.find_each(&:calculate_totals!)
  end

  def down
    remove_column :build_components, :owned
    remove_column :builds, :new_cost_cents
  end
end
