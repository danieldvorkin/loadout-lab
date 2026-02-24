# frozen_string_literal: true

class SyncProductsJob < ApplicationJob
  queue_as :default

  RETAILERS = {
    mdt: {
      name: "MDT (Modular Driven Technologies)",
      base_url: "https://mdttac.com",
      api_url: "https://mdttac.com/products.json",
      country: "Canada"
    },
    area419: {
      name: "Area 419",
      base_url: "https://area419.com",
      api_url: "https://area419.com/products.json",
      country: "USA"
    },
    cadex: {
      name: "Cadex Defence",
      base_url: "https://cadexdefence.com",
      api_url: "https://cadexdefence.com/products.json",
      country: "Canada"
    },
    triggertech: {
      name: "TriggerTech",
      base_url: "https://triggertech.com",
      api_url: "https://triggertech.com/products.json",
      country: "Canada"
    },
    gobigtactical: {
      name: "Go Big Tactical",
      base_url: "https://gobigtactical.com",
      api_url: "https://gobigtactical.com/products.json",
      country: "Canada"
    },
    rdsc: {
      name: "RDSC (R&D Sports)",
      base_url: "https://rdsc.ca",
      api_url: "https://rdsc.ca/products.json",
      country: "Canada"
    },
    dominionoutdoors: {
      name: "Dominion Outdoors",
      base_url: "https://dominionoutdoors.ca",
      api_url: "https://dominionoutdoors.ca/products.json",
      country: "Canada"
    },
    wolverinesupplies: {
      name: "Wolverine Supplies",
      base_url: "https://wolverinesupplies.com",
      api_url: "https://wolverinesupplies.com/products.json",
      country: "Canada"
    },
    reliablegun: {
      name: "Reliable Gun",
      base_url: "https://reliablegun.com",
      api_url: "https://reliablegun.com/products.json",
      country: "Canada"
    },
    northprosports: {
      name: "North Pro Sports",
      base_url: "https://northprosports.com",
      api_url: "https://northprosports.com/products.json",
      country: "Canada"
    }
  }.freeze

  CATEGORY_MAPPINGS = {
    # Chassis related keywords
    /chassis|stock.?system/i => "chassis",
    # Trigger keywords
    /trigger/i => "trigger",
    # Scope/Optic keywords
    /scope|riflescope|optic(?!al)|sight|reticle/i => "scope",
    # Mount keywords
    /mount|base|rail|picatinny|arca/i => "mount",
    # Ring keywords
    /ring|scope.?ring/i => "rings",
    # Barrel keywords
    /barrel|blank/i => "barrel",
    # Bipod keywords
    /bipod/i => "bipod",
    # Muzzle device keywords
    /brake|suppressor|silencer|muzzle|flash.?hider|compensator/i => "muzzle_device",
    # Stock keywords
    /stock|buttstock/i => "stock",
    # Grip keywords
    /grip|pistol.?grip/i => "grip",
    # Magazine keywords
    /magazine|mag\b/i => "magazine",
    # Action keywords
    /action|receiver|bolt.?action/i => "action",
    # Buttpad keywords
    /buttpad|recoil.?pad/i => "buttpad",
    # Cheek riser keywords
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
    Rails.logger.info "[SyncProductsJob] Starting sync for all retailers..."
    
    RETAILERS.each_key do |key|
      sync_retailer(key)
    rescue StandardError => e
      Rails.logger.error "[SyncProductsJob] Error syncing #{key}: #{e.message}"
      next
    end

    Rails.logger.info "[SyncProductsJob] Sync complete!"
  end

  def sync_retailer(key)
    retailer = RETAILERS[key]
    return unless retailer

    Rails.logger.info "[SyncProductsJob] Syncing products from #{retailer[:name]}..."

    products = fetch_products(retailer[:api_url])
    return if products.blank?

    manufacturer = find_or_create_manufacturer(retailer)
    
    products.each do |product_data|
      process_product(product_data, manufacturer, retailer)
    rescue StandardError => e
      Rails.logger.warn "[SyncProductsJob] Error processing product: #{e.message}"
      next
    end

    Rails.logger.info "[SyncProductsJob] Synced #{products.count} products from #{retailer[:name]}"
  end

  def fetch_products(api_url)
    uri = URI.parse(api_url)
    response = Net::HTTP.get_response(uri)
    
    return [] unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    data["products"] || []
  rescue StandardError => e
    Rails.logger.error "[SyncProductsJob] Failed to fetch products from #{api_url}: #{e.message}"
    []
  end

  def find_or_create_manufacturer(retailer)
    Manufacturer.find_or_create_by!(name: retailer[:name]) do |m|
      m.website = retailer[:base_url]
      m.country = retailer[:country]
    end
  end

  def process_product(product_data, manufacturer, retailer)
    name = product_data["title"]&.strip
    return if name.blank?

    # Skip if already exists
    return if Component.exists?(name: name)

    # Determine component type from title/tags
    component_type = determine_type(product_data)
    return unless component_type

    # Extract price (convert to cents)
    price_cents = extract_price(product_data)

    # Extract weight if available
    weight_oz = extract_weight(product_data)

    # Build specs from product data
    specs = build_specs(product_data, retailer)

    Component.create!(
      name: name,
      type: component_type,
      manufacturer: manufacturer,
      msrp_cents: price_cents,
      weight_oz: weight_oz,
      specs: specs,
      discontinued: false
    )

    Rails.logger.info "[SyncProductsJob] Created component: #{name}"
  end

  def determine_type(product_data)
    title = product_data["title"] || ""
    tags = Array(product_data["tags"]).join(" ")
    product_type = product_data["product_type"] || ""
    
    searchable = "#{title} #{tags} #{product_type}"

    CATEGORY_MAPPINGS.each do |pattern, type|
      return type if searchable.match?(pattern)
    end

    # Default to "other" for unmatched products
    "other"
  end

  def extract_price(product_data)
    variants = product_data["variants"] || []
    first_variant = variants.first || {}
    
    price = first_variant["price"]&.to_f || 0
    (price * 100).to_i
  end

  def extract_weight(product_data)
    variants = product_data["variants"] || []
    first_variant = variants.first || {}
    
    weight_grams = first_variant["grams"]&.to_f || 0
    return nil if weight_grams.zero?

    # Convert grams to ounces
    (weight_grams / 28.3495).round(2)
  end

  def build_specs(product_data, retailer)
    specs = {
      source: retailer[:name],
      source_url: "#{retailer[:base_url]}/products/#{product_data['handle']}",
      last_synced: Time.current.iso8601
    }

    # Add vendor if different from retailer
    if product_data["vendor"].present? && product_data["vendor"] != retailer[:name]
      specs[:vendor] = product_data["vendor"]
    end

    # Add tags
    if product_data["tags"].present?
      specs[:tags] = product_data["tags"]
    end

    # Add SKU from first variant
    variants = product_data["variants"] || []
    if variants.first&.dig("sku").present?
      specs[:sku] = variants.first["sku"]
    end

    specs
  end
end
