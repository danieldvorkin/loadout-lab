FactoryBot.define do
  factory :build do
    sequence(:name) { |n| "Build #{n}" }
    discipline { "prs" }
    association :user
    total_weight_oz { 0 }
    total_cost_cents { 0 }
  end
end
