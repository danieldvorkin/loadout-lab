# frozen_string_literal: true

namespace :scraper do
  desc "Test the universal scraper on a single product URL"
  task :product, [:url] => :environment do |_t, args|
    url = args[:url]
    abort "Usage: bin/rails scraper:product[https://example.com/product-page]" if url.blank?

    puts "🔍 Scraping product page: #{url}"
    result = ProductScraper.scrape_product(url)

    if result.nil?
      puts "❌ No data found"
    else
      puts "✅ Product found:"
      result.each do |key, value|
        next if value.blank?
        display = value.is_a?(String) ? value.truncate(120) : value.inspect.truncate(120)
        puts "  #{key}: #{display}"
      end
    end
  end

  desc "Detect what e-commerce platform a site uses"
  task :detect, [:url] => :environment do |_t, args|
    url = args[:url]
    abort "Usage: bin/rails scraper:detect[https://example.com]" if url.blank?

    puts "🔍 Detecting platform for: #{url}"
    platform = ProductScraper.detect_platform(url)
    puts "  Platform: #{platform}"
  end

  desc "Search a site for a product by name"
  task :search, [:url, :query] => :environment do |_t, args|
    url = args[:url]
    query = args[:query]
    abort "Usage: bin/rails scraper:search[https://example.com,'product name']" if url.blank? || query.blank?

    puts "🔍 Searching #{url} for: #{query}"
    result = ProductScraper.search_product(url, query)

    if result.nil?
      puts "❌ No product found"
    else
      puts "✅ Product found:"
      result.each do |key, value|
        next if value.blank?
        display = value.is_a?(String) ? value.truncate(120) : value.inspect.truncate(120)
        puts "  #{key}: #{display}"
      end
    end
  end

  desc "Scrape all products from a site (limited)"
  task :site, [:url, :limit] => :environment do |_t, args|
    url = args[:url]
    limit = (args[:limit] || 10).to_i
    abort "Usage: bin/rails scraper:site[https://example.com,10]" if url.blank?

    puts "🔍 Scraping site: #{url} (limit: #{limit})"
    scraper = ProductScraper.new
    platform = scraper.detect_platform(url)
    puts "  Platform: #{platform}"

    products = scraper.scrape_site(url, limit: limit)
    puts "  Found #{products.length} products\n\n"

    products.each_with_index do |p, i|
      puts "#{i + 1}. #{p[:name]}"
      puts "   💰 $#{'%.2f' % p[:price]}" if p[:price]
      puts "   🖼️  #{p[:image_url]&.truncate(80)}" if p[:image_url]
      puts "   🔗 #{p[:source_url]&.truncate(80)}" if p[:source_url]
      puts ""
    end
  end

  desc "Test scraper against all known manufacturer websites"
  task test_all: :environment do
    puts "🔍 Testing scraper against all manufacturer websites...\n\n"
    scraper = ProductScraper.new

    Manufacturer.where.not(website: [nil, ""]).order(:name).each do |m|
      print "#{m.name} (#{m.website})... "
      begin
        platform = scraper.detect_platform(m.website)
        print "#{platform} — "

        # Try to find one product
        component = m.components.first
        if component
          result = scraper.search_product(m.website, component.name)
          if result&.dig(:image_url).present?
            puts "✅ Found image for '#{component.name}'"
          else
            puts "⏭️  No image for '#{component.name}'"
          end
        else
          puts "⏭️  No components to search"
        end
      rescue StandardError => e
        puts "❌ #{e.message}"
      end
    end
  end
end
