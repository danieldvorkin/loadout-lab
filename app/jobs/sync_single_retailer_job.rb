# frozen_string_literal: true

# Job to sync a single retailer on demand
class SyncSingleRetailerJob < ApplicationJob
  queue_as :default

  def perform(retailer_key)
    SyncProductsJob.new.perform(retailer_key)
  end
end
