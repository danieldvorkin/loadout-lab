FactoryBot.define do
  factory :projectile do
    manufacturer { "Hornady" }
    sequence(:name) { |n| "#{weight_grains.to_i}gr Test Bullet #{n}" }
    caliber_inches { 0.264 }
    weight_grains { 140.0 }
    bc_g1 { 0.646 }
    bc_g7 { 0.326 }
    bullet_type { "ELD-M" }
    base_type { "boat_tail" }
    recommended_twist { "1:8" }
  end
end
