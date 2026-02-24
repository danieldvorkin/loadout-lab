# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:username) }
    it { should validate_uniqueness_of(:username).case_insensitive }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_length_of(:bio).is_at_most(500) }
    
    it 'validates website format when present' do
      user = build(:user, website: 'not-a-url')
      expect(user).not_to be_valid
      expect(user.errors[:website]).to include('must be a valid URL')
    end

    it 'allows valid website URLs' do
      user = build(:user, website: 'https://example.com')
      expect(user).to be_valid
    end

    it 'allows blank website' do
      user = build(:user, website: '')
      expect(user).to be_valid
    end

    it 'validates preferred_discipline inclusion' do
      user = build(:user, preferred_discipline: 'invalid')
      expect(user).not_to be_valid
    end

    it 'allows valid preferred_discipline values' do
      User::DISCIPLINES.each do |discipline|
        user = build(:user, preferred_discipline: discipline)
        expect(user).to be_valid
      end
    end
  end

  describe 'associations' do
    it { should have_many(:builds).dependent(:destroy) }
  end

  describe 'roles' do
    it 'has default role of user' do
      user = create(:user)
      expect(user.role).to eq('user')
    end

    it 'assigns admin role to admin@example.com' do
      # Delete any existing admin user first (from seeds)
      User.where(email: 'admin@example.com').destroy_all
      user = create(:user, email: 'admin@example.com')
      expect(user.role).to eq('admin')
    end

    describe '#admin?' do
      it 'returns true for admin users' do
        # Delete existing admin and create a new one with the special email
        User.where(email: 'admin@example.com').destroy_all
        user = create(:user, email: 'admin@example.com')
        expect(user.admin?).to be true
      end

      it 'returns false for regular users' do
        user = create(:user)
        expect(user.admin?).to be false
      end
    end
  end

  describe 'OAuth' do
    describe '#password_required?' do
      it 'returns false for OAuth users' do
        user = build(:user, :oauth_user)
        expect(user.password_required?).to be false
      end

      it 'returns true for regular users' do
        user = build(:user, password: nil)
        expect(user.password_required?).to be true
      end
    end

    describe '.from_google' do
      it 'creates a new user from Google OAuth' do
        expect {
          User.from_google(
            uid: 'google123',
            email: 'newuser@gmail.com',
            full_name: 'New User'
          )
        }.to change(User, :count).by(1)
      end

      it 'returns existing user if found by uid' do
        existing = create(:user, :oauth_user, uid: 'google123', provider: 'google')
        
        user = User.from_google(
          uid: 'google123',
          email: 'different@gmail.com',
          full_name: 'Some Name'
        )
        
        expect(user).to eq(existing)
      end

      it 'links existing user if found by email' do
        existing = create(:user, email: 'existing@gmail.com')
        
        user = User.from_google(
          uid: 'google123',
          email: 'existing@gmail.com',
          full_name: 'Some Name'
        )
        
        expect(user).to eq(existing.reload)
        expect(user.provider).to eq('google')
        expect(user.uid).to eq('google123')
      end

      it 'generates unique username based on email' do
        user = User.from_google(
          uid: 'google123',
          email: 'john.doe@gmail.com',
          full_name: 'John Doe'
        )
        
        expect(user.username).to start_with('johndoe')
      end
    end
  end

  describe 'profile fields' do
    it 'allows setting bio' do
      user = create(:user, bio: 'I love precision rifles!')
      expect(user.bio).to eq('I love precision rifles!')
    end

    it 'allows setting location' do
      user = create(:user, location: 'Austin, TX')
      expect(user.location).to eq('Austin, TX')
    end

    it 'allows setting social_links as JSON' do
      links = { instagram: 'shooter123', youtube: 'https://youtube.com/@shooter' }
      user = create(:user, social_links: links)
      expect(user.social_links).to eq(links.stringify_keys)
    end

    it 'allows setting notification_preferences as JSON' do
      prefs = { email_updates: false, build_notifications: true }
      user = create(:user, notification_preferences: prefs)
      expect(user.notification_preferences).to eq(prefs.stringify_keys)
    end
  end

  describe 'JTI' do
    it 'generates JTI before create' do
      user = create(:user)
      expect(user.jti).to be_present
    end
  end
end
