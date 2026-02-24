FactoryBot.define do
  factory :manufacturer do
    sequence(:name) { |n| "Manufacturer #{n}" }
    country { Faker::Address.country }
    website { Faker::Internet.url }
  end
end
