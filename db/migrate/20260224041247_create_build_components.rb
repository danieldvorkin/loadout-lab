class CreateBuildComponents < ActiveRecord::Migration[8.1]
  def change
    create_table :build_components do |t|
      t.references :build, null: false, foreign_key: true
      t.references :component, null: false, foreign_key: true
      t.string :position

      t.timestamps
      t.jsonb :specs, default: {}

      add_index :components, :specs, using: :gin
      add_index :components, :type
    end
  end
end
