# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_24_061301) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "build_components", force: :cascade do |t|
    t.bigint "build_id", null: false
    t.bigint "component_id", null: false
    t.datetime "created_at", null: false
    t.string "position"
    t.jsonb "specs", default: {}
    t.datetime "updated_at", null: false
    t.index ["build_id"], name: "index_build_components_on_build_id"
    t.index ["component_id"], name: "index_build_components_on_component_id"
  end

  create_table "builds", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "discipline"
    t.string "name"
    t.integer "total_cost_cents"
    t.decimal "total_weight_oz"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_builds_on_user_id"
  end

  create_table "components", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "discontinued"
    t.bigint "manufacturer_id", null: false
    t.integer "msrp_cents"
    t.string "name"
    t.jsonb "specs"
    t.string "type"
    t.datetime "updated_at", null: false
    t.decimal "weight_oz"
    t.index ["manufacturer_id"], name: "index_components_on_manufacturer_id"
    t.index ["specs"], name: "index_components_on_specs", using: :gin
    t.index ["type"], name: "index_components_on_type"
  end

  create_table "manufacturers", force: :cascade do |t|
    t.string "country"
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
    t.string "website"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.text "bio"
    t.datetime "created_at", null: false
    t.date "date_of_birth"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "full_name", default: "", null: false
    t.string "jti", null: false
    t.string "location"
    t.jsonb "notification_preferences", default: {"email_updates" => true, "build_notifications" => true}
    t.string "phone_number", default: "", null: false
    t.string "preferred_discipline"
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.jsonb "social_links", default: {}
    t.string "uid"
    t.datetime "updated_at", null: false
    t.string "username", null: false
    t.string "website"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  add_foreign_key "build_components", "builds"
  add_foreign_key "build_components", "components"
  add_foreign_key "builds", "users"
  add_foreign_key "components", "manufacturers"
end
