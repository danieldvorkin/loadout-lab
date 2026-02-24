# frozen_string_literal: true

namespace :products do
  desc "Sync products from all retailers"
  task sync_all: :environment do
    puts "Starting product sync from all retailers..."
    SyncProductsJob.perform_now
    puts "Done!"
  end

  desc "Sync products from a specific retailer (e.g., rake products:sync_retailer[mdt])"
  task :sync_retailer, [:retailer_key] => :environment do |_t, args|
    retailer_key = args[:retailer_key]
    
    if retailer_key.blank?
      puts "Please provide a retailer key. Available retailers:"
      SyncProductsJob::RETAILERS.each do |key, config|
        puts "  - #{key}: #{config[:name]}"
      end
      exit 1
    end

    unless SyncProductsJob::RETAILERS.key?(retailer_key.to_sym)
      puts "Unknown retailer: #{retailer_key}"
      puts "Available retailers:"
      SyncProductsJob::RETAILERS.each do |key, config|
        puts "  - #{key}: #{config[:name]}"
      end
      exit 1
    end

    puts "Syncing products from #{retailer_key}..."
    SyncProductsJob.perform_now(retailer_key)
    puts "Done!"
  end

  desc "List all available retailers"
  task list_retailers: :environment do
    puts "Available retailers for product sync:"
    puts ""
    SyncProductsJob::RETAILERS.each do |key, config|
      puts "  #{key.to_s.ljust(20)} - #{config[:name]} (#{config[:country]})"
      puts "  #{' ' * 20}   #{config[:api_url]}"
      puts ""
    end
  end

  desc "Show product statistics"
  task stats: :environment do
    puts "Product Statistics"
    puts "=" * 50
    puts ""
    puts "Total Components: #{Component.count}"
    puts "Total Manufacturers: #{Manufacturer.count}"
    puts ""
    puts "Components by Type:"
    Component.group(:type).count.sort_by { |_k, v| -v }.each do |type, count|
      puts "  #{type.to_s.ljust(20)} #{count}"
    end
    puts ""
    puts "Top 10 Manufacturers by Component Count:"
    Manufacturer.left_joins(:components)
                .group(:id)
                .order("COUNT(components.id) DESC")
                .limit(10)
                .each do |m|
      puts "  #{m.name.truncate(35).ljust(35)} #{m.components.count}"
    end
  end
end
