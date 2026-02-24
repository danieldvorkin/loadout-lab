class AddImageUrlToComponentsAndManufacturers < ActiveRecord::Migration[8.1]
  def change
    add_column :components, :image_url, :string
    add_column :manufacturers, :image_url, :string
  end
end
