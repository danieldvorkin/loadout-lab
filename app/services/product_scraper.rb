# frozen_string_literal: true

require "net/http"
require "json"
require "uri"
require "cgi"

# Universal product scraper that works across any e-commerce platform.
#
# Extraction strategies (in priority order):
#   1. JSON-LD Schema.org Product structured data
#   2. Open Graph / Twitter meta tags
#   3. Microdata (itemprop attributes)
#   4. Shopify JSON API (/products.json)
#   5. HTML heuristic patterns (CDN images, price regex, etc.)
#
# Usage:
#   # Scrape a single product page
#   ProductScraper.scrape_product("https://example.com/product/widget")
#   => { name: "Widget", image_url: "https://...", price_cents: 9900, ... }
#
#   # Discover & scrape all products from a site
#   ProductScraper.scrape_site("https://example.com")
#   => [{ name: "Widget", ... }, ...]
#
#   # Search a site for a specific product
#   ProductScraper.search_product("https://example.com", "ACC Elite Chassis")
#   => { name: "MDT ACC Elite", image_url: "https://...", ... }
#
class ProductScraper
  MAX_PAGES = 10
  REQUEST_DELAY = 0.3 # seconds between requests to be polite
  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

  # =========================================================================
  # PUBLIC API
  # =========================================================================

  # Scrape a single product page and return structured data
  def self.scrape_product(url)
    new.scrape_product(url)
  end

  # Discover and scrape products from a site
  def self.scrape_site(base_url, limit: 250)
    new.scrape_site(base_url, limit: limit)
  end

  # Search a site for a specific product and return its data
  def self.search_product(base_url, query)
    new.search_product(base_url, query)
  end

  # Detect what e-commerce platform a site uses
  def self.detect_platform(url)
    new.detect_platform(url)
  end

  # =========================================================================
  # INSTANCE METHODS
  # =========================================================================

  def scrape_product(url)
    html = fetch_page(url)
    return nil if html.blank?

    result = {}

    # Layer 1: JSON-LD (most reliable, used by all modern e-commerce for SEO)
    jsonld = extract_jsonld_product(html)
    result.merge!(jsonld) if jsonld

    # Layer 2: Open Graph meta tags
    og = extract_og_data(html)
    result.merge!(og) { |_key, old, new_val| old.present? ? old : new_val }

    # Layer 3: Microdata (itemprop attributes)
    micro = extract_microdata(html)
    result.merge!(micro) { |_key, old, new_val| old.present? ? old : new_val }

    # Layer 4: HTML heuristic patterns
    heuristic = extract_heuristic_data(html, url)
    result.merge!(heuristic) { |_key, old, new_val| old.present? ? old : new_val }

    # Normalize & clean
    result[:source_url] = url
    normalize_result(result)
  end

  def scrape_site(base_url, limit: 250)
    platform = detect_platform(base_url)
    products = []

    case platform
    when :shopify
      products = scrape_shopify(base_url, limit: limit)
    when :woocommerce
      products = scrape_woocommerce(base_url, limit: limit)
    else
      # Generic: crawl sitemap or listing pages for product URLs
      product_urls = discover_product_urls(base_url, limit: limit)
      product_urls.each do |url|
        product = scrape_product(url)
        products << product if product&.dig(:name).present?
        sleep REQUEST_DELAY
      end
    end

    products.compact
  end

  def search_product(base_url, query)
    platform = detect_platform(base_url)
    domain = extract_domain(base_url)

    # Strategy 1: Shopify API search
    if platform == :shopify
      result = shopify_search(base_url, query)
      return result if result&.dig(:image_url).present?
    end

    # Strategy 2: Platform-specific search endpoints
    search_urls = build_search_urls(base_url, platform, query)
    search_urls.each do |search_url|
      product_url = find_product_in_search_results(search_url, base_url, query)
      if product_url
        result = scrape_product(product_url)
        return result if result&.dig(:image_url).present?
      end
    end

    # Strategy 3: Try constructing direct product URLs from the query
    slug = slugify(query)
    direct_paths = [
      "/products/#{slug}",
      "/product/#{slug}"
    ]
    direct_paths.each do |path|
      url = "#{base_url.chomp('/')}#{path}"
      result = scrape_product(url)
      return result if result&.dig(:image_url).present?
    end

    nil
  end

  def detect_platform(url)
    # Quick check: try Shopify API first (fastest detection)
    shopify_url = "#{url.chomp('/')}/products.json?limit=1"
    if json_endpoint_works?(shopify_url)
      return :shopify
    end

    # Fetch homepage and detect from HTML signatures
    html = fetch_page(url)
    return :unknown if html.blank?

    if html.include?("cdn.shopify.com") || html.include?("Shopify.theme")
      :shopify
    elsif html.include?("woocommerce") || html.include?("wp-content") || html.include?("WooCommerce")
      :woocommerce
    elsif html.include?("BigCommerce") || html.include?("bigcommerce.com")
      :bigcommerce
    elsif html.include?("Magento") || html.include?("/media/catalog/product") || html.include?("magento")
      :magento
    else
      :unknown
    end
  rescue StandardError
    :unknown
  end

  private

  # =========================================================================
  # LAYER 1: JSON-LD STRUCTURED DATA
  # =========================================================================
  # Nearly all e-commerce sites embed JSON-LD for Google/SEO. It's the most
  # reliable source because it follows Schema.org Product spec exactly.

  def extract_jsonld_product(html)
    scripts = html.scan(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/mi)
    return nil if scripts.empty?

    scripts.each do |script_content|
      begin
        data = JSON.parse(script_content.first.strip)

        # Handle @graph arrays (multiple schemas in one block)
        if data.is_a?(Hash) && data["@graph"].is_a?(Array)
          product = data["@graph"].find { |item| item["@type"]&.to_s&.match?(/Product/i) }
          return parse_jsonld_product(product) if product
        end

        # Handle arrays of schemas
        if data.is_a?(Array)
          product = data.find { |item| item.is_a?(Hash) && item["@type"]&.to_s&.match?(/Product/i) }
          return parse_jsonld_product(product) if product
        end

        # Direct Product schema
        if data.is_a?(Hash) && data["@type"]&.to_s&.match?(/Product/i)
          return parse_jsonld_product(data)
        end
      rescue JSON::ParserError
        next
      end
    end

    nil
  end

  def parse_jsonld_product(data)
    return nil unless data.is_a?(Hash)

    result = {}
    result[:name] = data["name"]&.strip
    result[:description] = data["description"]&.strip&.truncate(500)
    result[:sku] = data["sku"]
    result[:brand] = data.dig("brand", "name") || data["brand"]
    result[:url] = data["url"]

    # Image - can be string, array of strings, or ImageObject
    result[:image_url] = extract_jsonld_image(data["image"])

    # Price - can be in "offers" object
    offers = data["offers"]
    if offers.is_a?(Hash)
      result[:price] = offers["price"]&.to_f
      result[:currency] = offers["priceCurrency"]
      result[:availability] = offers["availability"]&.include?("InStock")
    elsif offers.is_a?(Array) && offers.first.is_a?(Hash)
      result[:price] = offers.first["price"]&.to_f
      result[:currency] = offers.first["priceCurrency"]
      result[:availability] = offers.first["availability"]&.include?("InStock")
    end

    # Weight
    if data["weight"].is_a?(Hash)
      result[:weight_value] = data["weight"]["value"]&.to_f
      result[:weight_unit] = data["weight"]["unitCode"] || data["weight"]["unitText"]
    end

    # Category
    result[:category] = data["category"]

    # Aggregate rating
    if data["aggregateRating"].is_a?(Hash)
      result[:rating] = data["aggregateRating"]["ratingValue"]&.to_f
      result[:review_count] = data["aggregateRating"]["reviewCount"]&.to_i
    end

    result.compact
  end

  def extract_jsonld_image(image_data)
    case image_data
    when String
      image_data
    when Array
      # First element can be string or ImageObject
      first = image_data.first
      first.is_a?(Hash) ? first["url"] || first["contentUrl"] : first
    when Hash
      image_data["url"] || image_data["contentUrl"]
    end
  end

  # =========================================================================
  # LAYER 2: OPEN GRAPH META TAGS
  # =========================================================================

  def extract_og_data(html)
    result = {}

    result[:name] ||= extract_meta(html, "og:title")
    result[:image_url] ||= extract_meta(html, "og:image")
    result[:description] ||= extract_meta(html, "og:description")
    result[:url] ||= extract_meta(html, "og:url")

    # Product-specific OG tags
    result[:price] ||= extract_meta(html, "product:price:amount")&.to_f
    result[:currency] ||= extract_meta(html, "product:price:currency")

    # Twitter card fallbacks
    result[:image_url] ||= extract_meta(html, "twitter:image", attr: "name")
    result[:name] ||= extract_meta(html, "twitter:title", attr: "name")

    result.compact
  end

  def extract_meta(html, property, attr: "property")
    # Try property="..." content="..."
    match = html.match(/<meta[^>]*#{attr}=["']#{Regexp.escape(property)}["'][^>]*content=["']([^"']+)["']/i)
    return match[1] if match

    # Try content="..." property="..."
    match = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*#{attr}=["']#{Regexp.escape(property)}["']/i)
    return match[1] if match

    nil
  end

  # =========================================================================
  # LAYER 3: MICRODATA (itemprop ATTRIBUTES)
  # =========================================================================

  def extract_microdata(html)
    result = {}

    # Product name
    name_match = html.match(/itemprop=["']name["'][^>]*>([^<]+)</i)
    result[:name] = name_match[1].strip if name_match

    # Product image
    img_match = html.match(/itemprop=["']image["'][^>]*(?:src|content)=["']([^"']+)["']/i)
    result[:image_url] = img_match[1] if img_match

    # Price
    price_match = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)
    result[:price] = price_match[1].to_f if price_match

    price_match2 = html.match(/itemprop=["']price["'][^>]*>\s*\$?([\d,.]+)/i)
    result[:price] ||= price_match2[1].gsub(",", "").to_f if price_match2

    # SKU
    sku_match = html.match(/itemprop=["']sku["'][^>]*content=["']([^"']+)["']/i)
    result[:sku] = sku_match[1] if sku_match

    # Brand
    brand_match = html.match(/itemprop=["']brand["'][^>]*>([^<]+)</i)
    result[:brand] = brand_match[1].strip if brand_match

    # Description
    desc_match = html.match(/itemprop=["']description["'][^>]*content=["']([^"']+)["']/i)
    result[:description] = desc_match[1].strip.truncate(500) if desc_match

    result.compact
  end

  # =========================================================================
  # LAYER 4: HTML HEURISTIC PATTERNS
  # =========================================================================

  def extract_heuristic_data(html, page_url)
    result = {}

    # Title from <title> tag
    title_match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if title_match
      title = title_match[1].strip
        .gsub(/\s*[\|\-–—]\s*.*$/, "") # Remove "| Site Name" suffix
        .strip
      result[:name] = title if title.length > 3 && title.length < 200
    end

    # Price detection - common patterns across all platforms
    result[:price] ||= extract_price_from_html(html)

    # Image detection - platform-specific CDN patterns
    result[:image_url] ||= extract_product_image_from_html(html, page_url)

    result.compact
  end

  def extract_price_from_html(html)
    # Common price CSS class patterns used across platforms
    price_patterns = [
      # Shopify
      /class=["'][^"']*price[^"']*["'][^>]*>\s*\$?([\d,]+\.?\d*)/i,
      # WooCommerce
      /class=["']woocommerce-Price-amount[^"']*["'][^>]*>.*?<bdi>.*?\$([\d,]+\.?\d*)/mi,
      # General - price in a span/div near a dollar sign
      />\s*\$([\d,]+\.\d{2})\s*</,
      # data-price attribute
      /data-price=["']([\d.]+)["']/i
    ]

    price_patterns.each do |pattern|
      match = html.match(pattern)
      if match
        price = match[1].gsub(",", "").to_f
        return price if price > 0 && price < 100_000 # Sanity check
      end
    end

    nil
  end

  def extract_product_image_from_html(html, page_url)
    # Priority order of image patterns
    image_patterns = [
      # Shopify CDN (high quality product images)
      /(?:src|data-src)=["'](https:\/\/cdn\.shopify\.com\/s\/files\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
      # BigCommerce CDN
      /(?:src|data-src)=["'](https:\/\/cdn\d+\.bigcommerce\.com\/[^"']+\/products\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
      # Magento product catalog images
      /(?:src|srcset)=["']([^"']*\/media\/catalog\/product\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
      # WooCommerce product images
      /class=["'][^"']*wp-post-image[^"']*["'][^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
      /class=["'][^"']*woocommerce-product-gallery__image[^"']*["'][^>]*(?:href|data-src)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i,
      # WP uploads (general)
      /(?:src|data-src)=["']([^"']*\/wp-content\/uploads\/[^"']+\.(?:jpg|jpeg|png|webp))["']/i,
      # Cloudinary CDN
      /(?:src|data-src)=["'](https:\/\/res\.cloudinary\.com\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
      # Generic product image container patterns
      /class=["'][^"']*product[_-]?image[^"']*["'][^>]*(?:src|data-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
      /id=["'][^"']*product[_-]?image[^"']*["'][^>]*src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i
    ]

    image_patterns.each do |pattern|
      match = html.match(pattern)
      if match
        img = match[1]
        img = absolutize_url(img, page_url)
        return img if valid_product_image?(img)
      end
    end

    nil
  end

  # =========================================================================
  # SHOPIFY SCRAPING
  # =========================================================================

  def scrape_shopify(base_url, limit: 250)
    products = []
    page = 1

    loop do
      break if products.length >= limit
      url = "#{base_url.chomp('/')}/products.json?limit=250&page=#{page}"
      json_products = fetch_json(url)
      break if json_products.blank?

      json_products.each do |p|
        products << normalize_shopify_product(p, base_url)
      end

      break if json_products.length < 250
      page += 1
      break if page > MAX_PAGES
      sleep REQUEST_DELAY
    end

    products
  end

  def shopify_search(base_url, query)
    # Shopify search via JSON API
    encoded = CGI.escape(query)
    url = "#{base_url.chomp('/')}/search/suggest.json?q=#{encoded}&resources[type]=product&limit=5"
    html_search_url = "#{base_url.chomp('/')}/search?q=#{encoded}&type=product"

    # Try JSON search suggest API
    begin
      data = fetch_json_raw(url)
      if data.is_a?(Hash) && data.dig("resources", "results", "products").is_a?(Array)
        product = data["resources"]["results"]["products"].first
        if product
          product_url = product["url"]
          product_url = "#{base_url.chomp('/')}#{product_url}" unless product_url.start_with?("http")
          return scrape_product(product_url)
        end
      end
    rescue StandardError
      # Fall through to HTML search
    end

    # Fallback: search products.json by title
    page = 1
    loop do
      api_url = "#{base_url.chomp('/')}/products.json?limit=250&page=#{page}"
      json_products = fetch_json(api_url)
      break if json_products.blank?

      # Fuzzy match: check if query words appear in title
      query_words = query.downcase.split(/\s+/).reject { |w| w.length < 3 }
      json_products.each do |p|
        title = (p["title"] || "").downcase
        match_count = query_words.count { |w| title.include?(w) }
        if match_count >= [ query_words.length * 0.6, 2 ].min.to_i
          return normalize_shopify_product(p, base_url)
        end
      end

      break if json_products.length < 250
      page += 1
      break if page > MAX_PAGES
      sleep REQUEST_DELAY
    end

    nil
  end

  def normalize_shopify_product(product_data, base_url)
    images = product_data["images"] || []
    variants = product_data["variants"] || []
    first_variant = variants.first || {}

    price = first_variant["price"]&.to_f
    weight_grams = first_variant["grams"]&.to_f

    {
      name: product_data["title"]&.strip,
      image_url: images.first&.dig("src"),
      price: price,
      price_cents: price ? (price * 100).to_i : nil,
      currency: "USD",
      description: product_data["body_html"]&.gsub(/<[^>]+>/, "")&.strip&.truncate(500),
      brand: product_data["vendor"],
      sku: first_variant["sku"],
      weight_oz: weight_grams && weight_grams > 0 ? (weight_grams / 28.3495).round(2) : nil,
      tags: product_data["tags"],
      category: product_data["product_type"],
      availability: first_variant["available"],
      source_url: "#{base_url.chomp('/')}/products/#{product_data['handle']}",
      handle: product_data["handle"],
      variants: variants.map { |v| { name: v["title"], price: v["price"]&.to_f, sku: v["sku"], available: v["available"] } }
    }.compact
  end

  # =========================================================================
  # WOOCOMMERCE SCRAPING
  # =========================================================================

  def scrape_woocommerce(base_url, limit: 250)
    products = []

    # Try the WP REST API first (public endpoints)
    page = 1
    loop do
      break if products.length >= limit
      url = "#{base_url.chomp('/')}/wp-json/wc/store/v1/products?per_page=100&page=#{page}"
      json_products = fetch_json(url)

      # If store API doesn't work, fall back to crawling
      break if json_products.blank?

      json_products.each do |p|
        products << normalize_woocommerce_product(p, base_url)
      end

      break if json_products.length < 100
      page += 1
      break if page > MAX_PAGES
      sleep REQUEST_DELAY
    end

    # Fallback: crawl product listing pages if API didn't work
    if products.empty?
      product_urls = discover_product_urls(base_url, limit: limit)
      product_urls.each do |url|
        product = scrape_product(url)
        products << product if product&.dig(:name).present?
        sleep REQUEST_DELAY
      end
    end

    products
  end

  def normalize_woocommerce_product(data, base_url)
    price_str = data["prices"]&.dig("price") || data["price"]
    price = price_str.to_f / 100.0 if price_str # WC Store API returns cents

    images = data["images"] || []
    {
      name: data["name"]&.strip,
      image_url: images.first&.dig("src") || images.first&.dig("thumbnail"),
      price: price,
      price_cents: price ? (price * 100).to_i : nil,
      description: data["short_description"]&.gsub(/<[^>]+>/, "")&.strip&.truncate(500),
      sku: data["sku"],
      source_url: data["permalink"] || "#{base_url.chomp('/')}/product/#{data['slug']}",
      availability: data["is_in_stock"]
    }.compact
  end

  # =========================================================================
  # GENERIC PRODUCT URL DISCOVERY
  # =========================================================================

  def discover_product_urls(base_url, limit: 250)
    urls = Set.new
    domain = extract_domain(base_url)

    # Strategy 1: Sitemap
    sitemap_urls = parse_sitemap(base_url)
    product_urls_from_sitemap = sitemap_urls.select { |u| u.match?(/\/products?\/|\/shop\//i) }
    urls.merge(product_urls_from_sitemap.first(limit))

    # Strategy 2: Crawl main pages for product links
    if urls.empty?
      crawl_pages = [ "", "/shop", "/products", "/collections", "/product-category" ]
      crawl_pages.each do |path|
        page_url = "#{base_url.chomp('/')}#{path}"
        html = fetch_page(page_url)
        next if html.blank?

        # Extract links that look like product pages
        html.scan(/href=["']([^"']+)["']/i).flatten.each do |link|
          link = absolutize_url(link, page_url)
          next unless link.start_with?("http")
          next unless same_domain?(link, domain)
          next if link.match?(/\.(css|js|xml|json|png|jpg|gif|svg|pdf)/i)
          next if link.match?(/\/(cart|checkout|account|login|register|contact|about|blog|faq|shipping|return)/i)

          if link.match?(/\/products?\/[^\/]+$|\/shop\/[^\/]+\/?$/i)
            urls << link
          end
        end

        break if urls.length >= limit
        sleep REQUEST_DELAY
      end
    end

    urls.to_a.first(limit)
  end

  def parse_sitemap(base_url)
    urls = []
    sitemap_paths = [ "/sitemap.xml", "/sitemap_index.xml", "/sitemap_products_1.xml" ]

    sitemap_paths.each do |path|
      url = "#{base_url.chomp('/')}#{path}"
      xml = fetch_page(url)
      next if xml.blank?

      # Extract URLs from sitemap
      xml.scan(/<loc>([^<]+)<\/loc>/i).flatten.each do |loc|
        urls << loc.strip
      end

      break if urls.any?
    end

    urls
  end

  # =========================================================================
  # SEARCH-BASED DISCOVERY
  # =========================================================================

  def build_search_urls(base_url, platform, query)
    encoded = CGI.escape(query)
    base = base_url.chomp("/")

    urls = []
    case platform
    when :shopify
      urls << "#{base}/search?q=#{encoded}&type=product"
    when :woocommerce
      urls << "#{base}/?s=#{encoded}&post_type=product"
    when :magento
      urls << "#{base}/catalogsearch/result/?q=#{encoded}"
      urls << "#{base}/ca/catalogsearch/result/?q=#{encoded}" # MDT uses /ca/ prefix
    when :bigcommerce
      urls << "#{base}/search.php?search_query=#{encoded}"
    end

    # Universal fallback
    urls << "#{base}/search?q=#{encoded}"
    urls << "#{base}/?s=#{encoded}"

    urls
  end

  def find_product_in_search_results(search_url, base_url, query)
    html = fetch_page(search_url)
    return nil if html.blank?

    domain = extract_domain(base_url)
    query_words = query.downcase.split(/\s+/).reject { |w| w.length < 3 }

    # Collect all links from the search results page
    candidates = []
    html.scan(/href=["']([^"']+)["'][^>]*>([^<]*)</i).each do |link, text|
      link = absolutize_url(link, search_url)
      next unless same_domain?(link, domain)
      next if link.match?(/\/(cart|checkout|account|search|login)/i)
      next unless link.match?(/\/products?\/|\/shop\/|\/catalog\/product/i) || text.downcase.include?(query_words.first.to_s)

      # Score by how many query words appear in the link text or URL
      score = query_words.count { |w| text.downcase.include?(w) || link.downcase.include?(w) }
      candidates << { url: link, score: score } if score > 0
    end

    # Also check for product image links that contain query keywords
    html.scan(/href=["']([^"']+)["']/i).flatten.each do |link|
      link = absolutize_url(link, search_url)
      next unless same_domain?(link, domain)
      next unless link.match?(/\/products?\/|\/shop\/|\/catalog\/product/i)

      score = query_words.count { |w| link.downcase.include?(w) }
      candidates << { url: link, score: score } if score > 0
    end

    best = candidates.uniq { |c| c[:url] }.max_by { |c| c[:score] }
    best&.dig(:url)
  end

  # =========================================================================
  # HTTP HELPERS
  # =========================================================================

  def fetch_page(url)
    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")
    http.open_timeout = 6
    http.read_timeout = 10

    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT
    request["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    request["Accept-Language"] = "en-US,en;q=0.5"

    response = http.request(request)

    # Follow redirects (up to 3)
    3.times do
      break unless response.is_a?(Net::HTTPRedirection)
      redirect = response["location"]
      redirect = absolutize_url(redirect, url) unless redirect&.start_with?("http")
      uri = URI.parse(redirect)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == "https")
      http.open_timeout = 6
      http.read_timeout = 10
      request = Net::HTTP::Get.new(uri)
      request["User-Agent"] = USER_AGENT
      request["Accept"] = "text/html,application/xhtml+xml"
      response = http.request(request)
    end

    response.is_a?(Net::HTTPSuccess) ? response.body.force_encoding("UTF-8").encode("UTF-8", invalid: :replace, undef: :replace, replace: "") : nil
  rescue StandardError
    nil
  end

  def fetch_json(url)
    data = fetch_json_raw(url)
    return data["products"] if data.is_a?(Hash) && data["products"].is_a?(Array)
    return data if data.is_a?(Array)
    []
  rescue StandardError
    []
  end

  def fetch_json_raw(url)
    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == "https")
    http.open_timeout = 6
    http.read_timeout = 10

    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT
    request["Accept"] = "application/json"

    response = http.request(request)
    return nil unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  rescue StandardError
    nil
  end

  def json_endpoint_works?(url)
    data = fetch_json_raw(url)
    data.is_a?(Hash) && data.key?("products")
  rescue StandardError
    false
  end

  # =========================================================================
  # URL & VALIDATION HELPERS
  # =========================================================================

  def extract_domain(url)
    URI.parse(url).host&.sub(/^www\./, "")
  rescue URI::InvalidURIError
    nil
  end

  def same_domain?(url, domain)
    extract_domain(url) == domain
  rescue StandardError
    false
  end

  def absolutize_url(path, base_url)
    return path if path&.start_with?("http://", "https://")
    return nil if path.blank?

    base_uri = URI.parse(base_url)
    if path.start_with?("//")
      "#{base_uri.scheme}:#{path}"
    elsif path.start_with?("/")
      "#{base_uri.scheme}://#{base_uri.host}#{path}"
    else
      "#{base_uri.scheme}://#{base_uri.host}/#{path}"
    end
  rescue URI::InvalidURIError
    path
  end

  def slugify(text)
    text.downcase
        .gsub(/[^\w\s-]/, "")
        .gsub(/\s+/, "-")
        .gsub(/-+/, "-")
        .gsub(/^-|-$/, "")
  end

  def valid_product_image?(url)
    return false if url.blank?
    return false if url.length < 15
    return false if url.include?("spacer.gif") || url.include?("placeholder") || url.include?("data:image")
    return false if url.include?("logo") && !url.include?("product")
    return false if url.include?("favicon") || url.include?("icon")
    return false if url.include?("banner") || url.include?("slider") || url.include?("hero")
    return false if url.match?(/\d+x\d+/) && url.match?(/[_-](?:1x1|50x50|100x100|32x32|16x16)[\._]/)

    url.match?(/\.(jpg|jpeg|png|webp|gif)/i) ||
      url.include?("cdn.shopify.com") ||
      url.include?("bigcommerce.com") ||
      url.include?("/media/catalog/") ||
      url.include?("/wp-content/uploads/") ||
      url.include?("cloudinary.com")
  end

  def normalize_result(result)
    return nil if result[:name].blank? && result[:image_url].blank?

    # Convert price to cents if we have a price but not price_cents
    if result[:price] && !result[:price_cents]
      result[:price_cents] = (result[:price] * 100).to_i
    end

    # Clean up name
    if result[:name]
      result[:name] = result[:name]
        .gsub(/&amp;/, "&")
        .gsub(/&lt;/, "<")
        .gsub(/&gt;/, ">")
        .gsub(/&#\d+;/, "")
        .strip
    end

    result
  end
end
