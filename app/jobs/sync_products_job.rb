# frozen_string_literal: true

class SyncProductsJob < ApplicationJob
  queue_as :default

  # Retailers to sync — scraper auto-detects platform (Shopify, WooCommerce, Magento, etc.)
  RETAILERS = {
    triggertech: {
      name: "TriggerTech",
      base_url: "https://triggertech.com",
      country: "Canada"
    },
    area419: {
      name: "Area 419",
      base_url: "https://area419.com",
      country: "USA"
    },
    mdttac: {
      name: "MDT (Modular Driven Technologies)",
      base_url: "https://mdttac.com",
      country: "Canada"
    },
    cadex: {
      name: "Cadex Defence",
      base_url: "https://cadexdefence.com",
      country: "Canada"
    },
    gobigtactical: {
      name: "Go Big Tactical",
      base_url: "https://gobigtactical.com",
      country: "Canada"
    }
  }.freeze

  CATEGORY_MAPPINGS = {
    /chassis|stock.?system/i => "chassis",
    /trigger/i => "trigger",
    /scope|riflescope|optic(?!al)|sight|reticle/i => "scope",
    /mount|base|rail|picatinny|arca/i => "mount",
    /ring|scope.?ring/i => "rings",
    /barrel|blank/i => "barrel",
    /bipod/i => "bipod",
    /brake|suppressor|silencer|muzzle|flash.?hider|compensator/i => "muzzle_device",
    /stock|buttstock/i => "stock",
    /grip|pistol.?grip/i => "grip",
    /magazine|mag\b/i => "magazine",
    /action|receiver|bolt.?action/i => "action",
    /buttpad|recoil.?pad/i => "buttpad",
    /cheek.?riser|cheekpiece/i => "cheek_riser"
  }.freeze

  def perform(retailer_key = nil)
    if retailer_key
      sync_retailer(retailer_key.to_sym)
    else
      sync_all_retailers
    end
  end

  private

  def sync_all_retailers
    Rails.logger.info "[SyncProducts] Starting sync for all retailers..."

    RETAILERS.each_key do |key|
      sync_retailer(key)
    rescue StandardError => e
      Rails.logger.error "[SyncProducts] Error syncing #{key}: #{e.message}"
      next
    end

    Rails.logger.info "[SyncProducts] Sync complete!"
  end

  def sync_retailer(key)
    retailer = RETAILERS[key]
    return unless retailer

    Rails.logger.info "[SyncProducts] Syncing #{retailer[:name]}..."

    scraper = ProductScraper.new
    platform = scraper.detect_platform(retailer[:base_url])
    Rails.logger.info "[SyncProducts]   Platform detected: #{platform}"

    products = scraper.scrape_site(retailer[:base_url], limit: 250)
    Rails.logger.info "[SyncProducts]   Found #{products.length} products"

    return if products.blank?

    manufacturer = find_or_create_manufacturer(retailer)

    created = 0
    updated = 0
    products.each do |product_data|
      result = process_product(product_data, manufacturer, retailer)
      created += 1 if result == :created
      updated += 1 if result == :updated
    rescue StandardError => e
      Rails.logger.warn "[SyncProducts]   Error processing product: #{e.message}"
      next
    end

    Rails.logger.info "[SyncProducts]   #{retailer[:name]}: #{created} created, #{updated} updated"
  end

  def find_or_create_manufacturer(retailer)
    manufacturer = Manufacturer.find_or_create_by!(name: retailer[:name]) do |m|
      m.website = retailer[:base_url]
      m.country = retailer[:country]
    end

    if manufacturer.image_url.blank? && retailer[:base_url].present?
      domain = URI.parse(retailer[:base_url]).host rescue nil
      if domain
        manufacturer.update(
          image_url: "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://#{domain}&size=128"
        )
      end
    end

    manufacturer
  end

  def process_product(product_data, manufacturer, retailer)
    name = product_data[:name]&.strip
    return nil if name.blank?

    component_type = determine_type(product_data)
    return nil unless component_type

    image_url = product_data[:image_url]
    price_cents = product_data[:price_cents] || (product_data[:price] ? (product_data[:price] * 100).to_i : 0)
    weight_oz = product_data[:weight_oz]

    specs = {
      source: retailer[:name],
      source_url: product_data[:source_url],
      last_synced: Time.current.iso8601,
      sku: product_data[:sku],
      vendor: product_data[:brand],
      tags: product_data[:tags],
      category: product_data[:category]
    }.compact

    component = Component.find_by(name: name)
    if component
      updates = { specs: specs }
      updates[:image_url] = image_url if image_url.present? && component.image_url.blank?
      updates[:msrp_cents] = price_cents if price_cents&.positive? && (component.msrp_cents.nil? || component.msrp_cents.zero?)
      updates[:weight_oz] = weight_oz if weight_oz.present? && component.weight_oz.nil?

      component.update!(updates)
      :updated
    else
      Component.create!(
        name: name,
        type: component_type,
        manufacturer: manufacturer,
        msrp_cents: price_cents,
        weight_oz: weight_oz,
        image_url: image_url,
        specs: specs,
        discontinued: false
      )
      :created
    end
  end

  def determine_type(product_data)
    searchable = [
      product_data[:name],
      product_data[:tags],
      product_data[:category],
      product_data[:description]
    ].compact.join(" ")

    CATEGORY_MAPPINGS.each do |pattern, type|
      return type if searchable.match?(pattern)
    end

    "other"
  end
end
