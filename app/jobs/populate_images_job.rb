# frozen_string_literal: true

require "timeout"

class PopulateImagesJob < ApplicationJob
  queue_as :default

  def perform(scope = :all)
    case scope.to_sym
    when :manufacturers
      populate_manufacturer_images
    when :components
      populate_component_images
    when :all
      populate_manufacturer_images
      populate_component_images
    end
  end

  private

  # =========================================================================
  # MANUFACTURER IMAGES — Google Favicon V2 (100% success rate)
  # =========================================================================

  def populate_manufacturer_images
    manufacturers = Manufacturer.where(image_url: [ nil, "" ])
    total = manufacturers.count
    updated = 0

    Rails.logger.info "[PopulateImages] Processing #{total} manufacturers without images..."

    manufacturers.find_each do |manufacturer|
      image_url = find_manufacturer_image(manufacturer)
      if image_url.present?
        manufacturer.update!(image_url: image_url)
        updated += 1
        Rails.logger.info "[PopulateImages] ✅ #{manufacturer.name}: #{image_url.truncate(80)}"
      else
        Rails.logger.info "[PopulateImages] ⏭️  #{manufacturer.name}: no image found"
      end
    rescue StandardError => e
      Rails.logger.warn "[PopulateImages] ❌ #{manufacturer.name}: #{e.message}"
    end

    Rails.logger.info "[PopulateImages] Manufacturer images: #{updated}/#{total} updated"
  end

  def find_manufacturer_image(manufacturer)
    return nil if manufacturer.website.blank?

    domain = extract_domain(manufacturer.website)
    return nil if domain.blank?

    # Strategy 1: Try OG image from homepage (high-quality logo)
    scraper = ProductScraper.new
    html = scraper.send(:fetch_page, manufacturer.website)
    if html.present?
      og = scraper.send(:extract_og_data, html)
      image = og[:image_url]
      return image if image.present? && !image.include?("placeholder")
    end

    # Strategy 2: Google Favicon V2 API (128px — always works)
    "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://#{domain}&size=128"
  end

  # =========================================================================
  # COMPONENT IMAGES — Uses ProductScraper.search_product
  # =========================================================================

  def populate_component_images
    components = Component.where(image_url: [ nil, "" ]).includes(:manufacturer)
    total = components.count
    updated = 0
    skipped = 0

    $stdout.puts "[PopulateImages] Processing #{total} components without images..."
    $stdout.flush

    scraper = ProductScraper.new

    # Group by manufacturer so we can detect platform once per manufacturer
    components.group_by(&:manufacturer).each do |manufacturer, mfr_components|
      next if manufacturer.nil?

      website = manufacturer.website
      if website.blank?
        $stdout.puts "[PopulateImages] ⏭️  #{manufacturer.name}: no website, skipping #{mfr_components.count} components"
        $stdout.flush
        skipped += mfr_components.count
        next
      end

      # Detect platform once per manufacturer
      platform = scraper.detect_platform(website)
      $stdout.puts "[PopulateImages] 🔍 #{manufacturer.name} (#{platform}) — #{mfr_components.count} components"
      $stdout.flush

      mfr_components.each do |component|
        image_url = find_component_image(scraper, component, website)
        if image_url.present?
          component.update!(image_url: image_url)
          updated += 1
          $stdout.puts "[PopulateImages]   ✅ #{component.name}"
        else
          $stdout.puts "[PopulateImages]   ⏭️  #{component.name}: no image"
        end
        $stdout.flush
      rescue StandardError => e
        $stdout.puts "[PopulateImages]   ❌ #{component.name}: #{e.message}"
        $stdout.flush
      end
    end

    $stdout.puts "[PopulateImages] Component images: #{updated}/#{total} updated (#{skipped} skipped)"
    $stdout.flush
  end

  def find_component_image(scraper, component, manufacturer_website)
    # Wrap in timeout to avoid hanging on slow sites
    Timeout.timeout(30) do
      # Use ProductScraper's search_product to find the product page and extract image
      result = scraper.search_product(manufacturer_website, component.name)
      return result[:image_url] if result&.dig(:image_url).present?

      # Fallback: try with simplified name (remove manufacturer prefix)
      simple_name = simplify_component_name(component.name, component.manufacturer&.name)
      if simple_name != component.name
        result = scraper.search_product(manufacturer_website, simple_name)
        return result[:image_url] if result&.dig(:image_url).present?
      end
    end

    nil
  rescue Timeout::Error
    Rails.logger.warn "[PopulateImages]   ⏰ Timeout searching for #{component.name}"
    nil
  end

  def simplify_component_name(name, manufacturer_name)
    return name if manufacturer_name.blank?

    # Remove manufacturer name prefix (e.g. "MDT ACC Elite Chassis" -> "ACC Elite Chassis")
    simplified = name.dup
    manufacturer_name.split(/[\s()]+/).reject { |w| w.length < 3 }.each do |word|
      simplified = simplified.sub(/\b#{Regexp.escape(word)}\b\s*/i, "")
    end
    simplified.strip.presence || name
  end

  # =========================================================================
  # HELPERS
  # =========================================================================

  def extract_domain(website_url)
    URI.parse(website_url).host&.sub(/^www\./, "")
  rescue URI::InvalidURIError
    nil
  end
end
