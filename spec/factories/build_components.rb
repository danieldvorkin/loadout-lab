FactoryBot.define do
  factory :build_component do
    association :build
    association :component
    position { "action" }
    specs { {} }
  end
end
