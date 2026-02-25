# frozen_string_literal: true

FactoryBot.define do
  factory :listing do
    sequence(:title) { |n| "Listing #{n}" }
    description { "A well-maintained component for sale." }
    listing_type { :for_sale }
    status { :active }
    condition { :good }
    price_cents { 45_000 }
    location { "Austin, TX" }
    association :user
    association :component

    trait :showcase do
      listing_type { :showcase }
      price_cents { nil }
    end

    trait :sold do
      status { :sold }
    end
  end
end
