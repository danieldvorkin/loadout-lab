FactoryBot.define do
  factory :component do
    sequence(:name) { |n| "Component #{n}" }
    type { "action" }  # Must be lowercase to match TYPES constant
    weight_oz { Faker::Number.decimal(l_digits: 1, r_digits: 2) }
    msrp_cents { Faker::Number.between(from: 10000, to: 500000) }
    discontinued { false }
    specs { { material: "Steel", color: "Black" } }
    association :manufacturer
  end
end
