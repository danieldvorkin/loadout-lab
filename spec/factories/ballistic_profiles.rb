FactoryBot.define do
  factory :ballistic_profile do
    sequence(:name) { |n| "Profile #{n}" }
    caliber { "6.5 Creedmoor" }
    muzzle_velocity_fps { 2700 }
    bullet_weight_grains { 140.0 }
    bullet_bc { 0.326 }
    bc_type { "G7" }
    zero_distance_yards { 100 }
    sight_height_inches { 1.5 }
    association :build
  end
end
