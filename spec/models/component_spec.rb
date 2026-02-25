# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Component, type: :model do
  describe 'associations' do
    it { should belong_to(:manufacturer) }
    it { should have_many(:build_components).dependent(:destroy) }
    it { should have_many(:builds).through(:build_components) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_numericality_of(:weight_oz).is_greater_than_or_equal_to(0).allow_nil }
    it { should validate_numericality_of(:msrp_cents).is_greater_than_or_equal_to(0).only_integer.allow_nil }
  end

  describe 'factory' do
    it 'creates a valid component' do
      component = create(:component)
      expect(component).to be_valid
    end
  end

  describe 'attributes' do
    let(:manufacturer) { create(:manufacturer) }

    it 'stores specs as JSON' do
      component = create(:component, specs: { caliber: '.308', twist_rate: '1:10' })
      expect(component.specs['caliber']).to eq('.308')
      expect(component.specs['twist_rate']).to eq('1:10')
    end

    it 'tracks weight in ounces' do
      component = create(:component, weight_oz: 32.5)
      expect(component.weight_oz).to eq(32.5)
    end

    it 'tracks price in cents' do
      component = create(:component, msrp_cents: 149900)
      expect(component.msrp_cents).to eq(149900)
    end

    it 'can be marked as discontinued' do
      component = create(:component, discontinued: true)
      expect(component.discontinued).to be true
    end
  end

  describe 'scopes' do
    let!(:active_component) { create(:component, discontinued: false) }
    let!(:discontinued_component) { create(:component, discontinued: true) }

    describe '.active' do
      it 'returns only active components' do
        expect(Component.active).to include(active_component)
        expect(Component.active).not_to include(discontinued_component)
      end
    end

    describe '.discontinued' do
      it 'returns only discontinued components' do
        expect(Component.discontinued).to include(discontinued_component)
        expect(Component.discontinued).not_to include(active_component)
      end
    end
  end
end
