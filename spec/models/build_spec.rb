# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Build, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:build_components).dependent(:destroy) }
    it { should have_many(:components).through(:build_components) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
  end

  describe 'factory' do
    it 'creates a valid build' do
      build = create(:build)
      expect(build).to be_valid
    end
  end

  describe 'discipline' do
    it 'allows setting discipline' do
      build = create(:build, discipline: 'prs')
      expect(build.discipline).to eq('prs')
    end
  end

  describe 'weight and cost tracking' do
    let(:build) { create(:build) }
    let(:manufacturer) { create(:manufacturer) }
    
    it 'tracks total weight' do
      build.update(total_weight_oz: 120.5)
      expect(build.total_weight_oz).to eq(120.5)
    end

    it 'tracks total cost' do
      build.update(total_cost_cents: 350000)
      expect(build.total_cost_cents).to eq(350000)
    end
  end
end
