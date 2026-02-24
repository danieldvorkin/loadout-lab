FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:username) { |n| "user#{n}" }
    password { "password123" }
    password_confirmation { "password123" }
    full_name { Faker::Name.name }
    phone_number { Faker::PhoneNumber.phone_number }
    role { :user }

    trait :admin do
      sequence(:email) { |n| "admin#{n}@example.com" }
      sequence(:username) { |n| "admin#{n}" }
      role { :admin }
    end

    trait :with_profile do
      bio { Faker::Lorem.paragraph }
      location { "#{Faker::Address.city}, #{Faker::Address.state}" }
      website { Faker::Internet.url }
      preferred_discipline { User::DISCIPLINES.sample }
      date_of_birth { Faker::Date.birthday(min_age: 18, max_age: 65) }
      social_links { { instagram: Faker::Internet.username, youtube: Faker::Internet.url } }
      notification_preferences { { email_updates: true, build_notifications: true } }
    end

    trait :oauth_user do
      provider { "google" }
      sequence(:uid) { |n| "google_uid_#{n}" }
      password { SecureRandom.hex(24) }
    end
  end
end
