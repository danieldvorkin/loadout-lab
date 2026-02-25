# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Manufacturer, type: :model do
  describe 'associations' do
    it { should have_many(:components).dependent(:destroy) }
  end

  describe 'validations' do
    subject { build(:manufacturer) }

    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:name) }
  end

  describe 'factory' do
    it 'creates a valid manufacturer' do
      manufacturer = create(:manufacturer)
      expect(manufacturer).to be_valid
    end
  end

  describe 'attributes' do
    it 'stores country' do
      manufacturer = create(:manufacturer, country: 'USA')
      expect(manufacturer.country).to eq('USA')
    end

    it 'stores website' do
      manufacturer = create(:manufacturer, website: 'https://example.com')
      expect(manufacturer.website).to eq('https://example.com')
    end
  end
end
