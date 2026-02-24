require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "password_required? returns false for OAuth users" do
    user = User.new(provider: "google", uid: "12345", email: "test@example.com", username: "testuser")
    assert_not user.password_required?
  end

  test "password_required? returns true for non-OAuth users" do
    user = User.new(email: "test@example.com", username: "testuser")
    assert user.password_required?
  end

  test "from_google creates a new user when none exists" do
    user = User.from_google(uid: "google-uid-123", email: "newuser@example.com", full_name: "New User")
    assert user.persisted?
    assert_equal "google", user.provider
    assert_equal "google-uid-123", user.uid
    assert_equal "newuser@example.com", user.email
    assert_equal "New User", user.full_name
  end

  test "from_google finds existing user by provider and uid" do
    existing = User.from_google(uid: "google-uid-456", email: "existing@example.com", full_name: "Existing User")
    found = User.from_google(uid: "google-uid-456", email: "existing@example.com", full_name: "Existing User")
    assert_equal existing.id, found.id
  end

  test "from_google links existing email user to Google" do
    existing = User.create!(
      email: "linked@example.com",
      username: "linkeduser",
      password: "password123",
      password_confirmation: "password123"
    )
    linked = User.from_google(uid: "google-uid-789", email: "linked@example.com", full_name: "Linked User")
    assert_equal existing.id, linked.id
    assert_equal "google", linked.provider
    assert_equal "google-uid-789", linked.uid
  end
end
