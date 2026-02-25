# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

# Scrapes and imports rifle build components from redhawkrifles.com (BigCommerce)
#
# redhawkrifles.com is a headless BigCommerce store. Category listing pages are
# fully JavaScript-rendered, so Net::HTTP fetches return skeleton HTML with no
# product grid. Individual PRODUCT pages, however, are server-side rendered with
# full JSON-LD structured data, Open Graph tags, and pricing.
#
# Strategy:
#   1. Collect product URLs from a curated seed list + raw HTML anchor scanning
#   2. Scrape each individual product page via Net::HTTP (works perfectly)
#   3. Parse JSON-LD structured data for name, price, image, brand
#   4. Apply type determination and spec parsing from the product name
#   5. Upsert into the components table
#
# Categories:
#   stocks-and-chassis-systems  → chassis, stock
#   rifle-parts                 → barrel, action, trigger, muzzle_device, magazine
#   optics                      → scope
#   optic-parts-and-accessories → mount, rings
#
# Usage:
#   RedHawkRiflesImporter.run!
#   RedHawkRiflesImporter.run!(dry_run: true)
#   RedHawkRiflesImporter.run!(categories: ["rifle-parts"])
#
class RedHawkRiflesImporter
  BASE_URL      = "https://redhawkrifles.com"
  REQUEST_DELAY = 0.8   # seconds between page requests (be polite)
  MAX_PAGES     = 30    # max pages per category (for anchor scanning fallback)
  PAGE_SIZE     = 36    # BigCommerce default items-per-page

  USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " \
               "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

  # Category URL slug => scraping hint symbol
  CATEGORIES = {
    "stocks-and-chassis-systems"  => :stocks_chassis,
    "rifle-parts"                 => :rifle_parts,
    "optics"                      => :optics,
    "optic-parts-and-accessories" => :optic_accessories
  }.freeze

  # ──────────────────────────────────────────────────────────────────────────────
  # SEED PRODUCT URLS
  # Collected from JS-rendered category pages (fetch_webpage tool).
  # Category listing pages return skeleton HTML via Net::HTTP (BigCommerce
  # headless), but individual product pages are server-side rendered.
  # These URLs are organized by category slug → array of product URL slugs.
  # ──────────────────────────────────────────────────────────────────────────────
  SEED_URLS = {
    "stocks-and-chassis-systems" => %w[
      mesa-precision-arms-altitude-carbon-fiber-stock-remington-700
      peak-44-bastion-carbon-fiber-remington-700-universal
      mdt-acc-elite-chassis-system-remington-700
      mdt-hnt26-lightweight-chassis-folding-remington-700-long-action
      xlr-industries-element4-0-chassis-system-remington-700
      xlr-industries-element4-0-magnesium-chassis-remington-700
      masterpiece-arms-ba-hybrid-chassis-remington-700
      grayboe-phoenix-2-fiberglass-stock-remington-700
      grayboe-eagle-non-adjustable-remington-700
      ag-composites-alpine-hunter-carbon-fiber-stock-r700
      mdt-lss-gen-2-chassis-system-remington-700
      mdt-xrs-chassis-system-remington-700
      cadex-defence-strike-chassis-system-remington-700
      peak-44-picatinny-rail-remington-700
      xlr-industries-envy-chassis-system-remington-700
      manners-tf4a-stock-remington-700-short-action
      mcmillan-a5-stock-remington-700-short-action
      mdt-field-stock-chassis-system
      mdt-hnt26-lightweight-chassis-folding-remington-700-short-action
      mdt-acc-chassis-premier-gen-2-remington-700-short-action
      mdt-ess-chassis-remington-700-short-action
      mdt-lss-xl-gen-2-chassis-remington-700-short-action
      hs-precision-psv002-pro-series-varmint-remington-700-short-action-bdl
      hs-precision-pst035-pro-series-tactical-a2-non-adjustable-remington-700-short-action-bdl
      ag-composites-privateer-carbon-fiber-stock-remington-700
      mcmillan-game-warden-2-0-remington-700-short-action
      proof-research-stock-lightweight-hunter
      ag-composites-adjustable-alpine-hunter-carbon-fiber-stock-r700
      ag-composites-alpine-hunter-fiberglass-stock-r700
      mcmillan-game-warden-2-0-remington-700-long-action
      mcmillan-hunters-edge-sporter-remington-700-long-action
      mcmillan-game-hunter-remington-700-short-action
      mcmillan-game-hunter-remington-700-long-action
      mcmillan-hunters-edge-sendero-remington-700-short-action
      grayboe-trekker-fiberglass-stock-remington-700
      hs-precision-psv096-pro-series-varmint-remington-700-short-action-bdl
      hs-precision-psv029-pro-series-varmint-remington-700-long-action-bdl
      hs-precision-pss046-pro-series-sporter-remington-700-long-action-bdl
      hs-precision-psv140-pro-series-varmint-howa-1500-weatherby-vanguard-short-action
      hs-precision-pss138-pro-series-sporter-howa-1500-weatherby-vanguard-long-action
      discontinued-masterpiece-arms-ba-comp-chassis-remington-700
      mdt-carbine-stock-composite
      xlr-industries-bag-rider-smoke-carbon-buttstock
      xlr-industries-shortened-buffer-tube
      hawkins-precision-hunter-detachable-magazine-medium-action
      mdt-metal-aics-magazines-300-prc-cip-3-850-oal
      mdt-metal-aics-magazines-338lm-3-715-oal
      mdt-polymer-aics-magazines-308
      gray-ops-magazine-base-pad-aw
      mdt-forend-weights-gen-2-m-lok-2pk
      mdt-forend-weights-acc-chassis-5pk
      mdt-forend-weights-xrs-chassis
      mdt-m-lok-thumb-rest
      gray-ops-weight-mpa-ba-comp-complete-kit
    ],
    "rifle-parts" => %w[
      bartlein-264-6-5mm-caliber-carbon-fiber-5r-barrels
      bartlein-30-caliber-carbon-fiber-5r-barrels
      bartlein-carbon-fiber-barrel-blank-243-6mm-cal
      bartlein-338-caliber-stainless-steel-5r-barrels
      bartlein-264-6-5mm-caliber-stainless-steel-5r-barrels
      bartlein-308-caliber-stainless-steel-5r-barrels
      bartlein-30-caliber-stainless-steel-5r-barrels
      bartlein-6mm-caliber-stainless-steel-5r-barrels
      benchmark-barrels-30-caliber-carbon-fiber-wrapped-bolt-action-barrels
      benchmark-barrels-284-7mm-caliber-carbon-fiber-wrapped-bolt-action-barrels
      benchmark-barrels-264-6-5mm-caliber-carbon-fiber-wrapped-bolt-action-barrels
      benchmark-barrels-6mm-caliber-carbon-fiber-wrapped-bolt-action-barrels
      benchmark-barrels-stainless-steel-barrel-blank-264-6-5mm-cal
      benchmark-barrels-stainless-steel-barrel-blank-308-cal
      benchmark-barrels-stainless-steel-barrel-blank-284-7mm-cal
      benchmark-barrels-stainless-steel-barrel-blank-30-cal
      proof-research-carbon-fiber-barrel-blank-30-cal-sendero-contour
      proof-research-carbon-fiber-barrel-blank-284-7mm-cal-sendero-light-contour
      proof-research-carbon-fiber-barrel-blank-224-cal-sendero-contour
      proof-research-carbon-fiber-barrel-blank-264-6-5mm-cal-sendero-contour
      snowy-mountain-rifles-carbon-fiber-prefit-barrels
      snowy-mountain-rifles-stainless-steel-prefit-barrels
      lilja-precision-rifle-barrels-stainless-steel-barrel-blank-30-cal
      lilja-precision-rifle-barrels-stainless-steel-barrel-blank-6-5mm-cal
      lilja-precision-rifle-barrels-stainless-steel-barrel-blank-6mm-cal
      custom-rifle-barrels-stainless-steel-barrel-blank-30-cal
      viking-armament-stainless-steel-prefit-barrels
      impact-precision-737r-receiver-short-action
      impact-precision-nbk-receiver-short-action
      impact-precision-nbk-receiver-long-action
      defiance-machine-deviant-action
      defiance-machine-anti-x-action
      defiance-machine-ruckus-hunter-action
      aero-precision-solus-action
      zermatt-arms-receiver-origin
      stiller-predator-receiver-short-action
      stiller-tac300-receiver-long-action
      lone-peak-arms-razor-action
      triggertech-diamond-trigger-remington-700
      triggertech-diamond-trigger-two-stage-remington-700
      triggertech-primary-trigger-remington-700
      timney-triggers-elite-hunter-remington-700-black
      bix-n-andy-trigger-tac-sport-pro-x-remington-700
      bix-n-andy-trigger-tac-sport-pro-x-2-stage-remington-700
      bix-n-andy-trigger-dakota-remington-700
      hawkins-precision-muzzle-brake-updraft-self-timing
      hawkins-precision-muzzle-brake-3-port
      meraki-machine-m1-self-timing-muzzle-brake
      area-419-hellfire-self-timing-muzzle-brake
      rhr-bottom-metal-remington-700-bdl
      hawkins-precision-bottom-metal-oberndorf-m5-short-medium-long-action
      heritage-arms-bottom-metal-m5-aics-dbm
      mdt-precision-bottom-metal-aics-m5-short-action
      wyatts-detachable-box-magazine-bottom-metal-only
      wyatt-s-extended-length-internal-magazine-box
      hs-precision-detachable-magazine-complete-assembly-short-action
      hs-precision-detachable-magazine-complete-assembly-long-action
      hawkins-precision-hunter-detachable-magazine-short-action-chassis-fit
      accurate-mag-aics-long-action-magazine-300-win-mag
      accurate-mag-aics-long-action-magazine-30-06
      mdt-polymer-aics-magazines-308
    ],
    "optics" => %w[
      demo-like-new-zeiss-rifle-scope-conquest-v4-6-24x50
      demo-special-like-new-zeiss-rifle-scope-conquest-v4-6-24x50-65-zmoai-t20-reticle-ballistic-elev-wind-turrets
      demo-like-new-zeiss-rifle-scope-conquest-v4-4-16x44
      clearance-zeiss-conquest-v4-6-24x50-rifle-scope-93-zmoa-1-reticle
      demo-like-new-zeiss-rifle-scope-conquest-v4-4-16x50
      demo-like-new-nightforce-nx8-f1-riflescope-4-32x50mm-moar-illuminated
      demo-like-new-zeiss-rifle-scope-conquest-v6-3-18x50
      demo-like-new-nightforce-nx8-f2-riflescope-4-32x50mm-moar-cf2d
      demo-like-new-zeiss-rifle-scope-conquest-v4-3-12x56
      demo-like-new-nightforce-shv-rifle-scope-5-20x56mm-moar
      clearance-demo-like-new-zeiss-binoculars-conquest-hdx-15x56
      demo-like-new-nightforce-nx8-f1-riflescope-2-5-20x50mm-moar-illuminated
      demo-like-new-nightforce-atacr-rifle-scope-7-35x56mm-moar-t-center-only-illuminated
      demo-like-new-zeiss-rifle-scope-lrp-s3-4-25x50
      nightforce-nx8-rifle-scope-4-32x50mm-f1
      demo-like-new-zeiss-rifle-scope-conquest-v6-5-30x50
      nightforce-nx8-riflescope-2-5-20x50mm
      zeiss-rifle-scope-lrp-s3-4-25x50
      demo-like-new-zeiss-binoculars-terra-ed
      demo-like-new-nightforce-nx8-f2-riflescope-2-5-20x50mm-moar-cf2d
      swarovski-rifle-scope-z6-3-18x50-4w-reticle-w-ballistic-turret
      nightforce-nxs-rifle-scope-5-5-22x50mm-moar-t-center-only-illuminated
      demo-like-new-nightforce-nxs-rifle-scope-5-5-22x50mm-moar-t-center-only-illuminated
      demo-like-new-nightforce-atacr-rifle-scope-5-25x56mm-moar-t-center-only-illuminated
      demo-like-new-nightforce-nxs-rifle-scope-5-5-22x50mm-moar-illuminated
      nightforce-atacr-rifle-scope-7-35x56mm-f2-second-focal-plane
      nightforce-nxs-rifle-scope-5-5-22x50mm-moar-illuminated
      demo-like-new-nightforce-nxs-rifle-scope-5-5-22x56mm-moar-illuminated
      nightforce-nx8-f2-riflescope-4-32x50mm-mil-cf2d
      zeiss-rifle-scope-conquest-v6-2-12x50-60-plex-illuminated-reticle-ballistic-elevation-turret
      zeiss-rifle-scope-conquest-v4-3-12x56
      demo-like-new-nightforce-atacr-rifle-scope-5-25x56mm-moar-t-center-only-illuminated
      demo-like-new-zeiss-binoculars-sfl-10x40
      demo-like-new-zeiss-rifle-scope-conquest-v4-3-12x44
      demo-like-new-zeiss-spotting-scope-victory-harpia
    ],
    "optic-parts-and-accessories" => %w[
      hawkins-precision-scope-rings-ultra-light-tactical-30mm-34mm-35mm
      hawkins-precision-scope-rings-long-range-hybrid-30mm-34mm
      hawkins-precision-scope-rings-featherweight-1-inch-30mm
      talley-one-piece-picatinny-base
      nightforce-x-treme-duty-ultralite-rings-4-screw-30mm-multiple-heights
      hawkins-precision-scope-rings-heavy-tactical-34mm-35mm-36mm
      hawkins-precision-scope-rings-offset-level-top-half-ring-30mm-34mm
      hawkins-precision-scope-rings-heavy-tactical-one-piece-34mm-35mm-36mm-0-moa-20-moa
      talley-one-piece-picatinny-base-with-anti-cant-indicator
      talley-one-piece-scope-ring-mounts-remington-700-30mm-multiple-heights
      hawkins-precision-scope-rings-heavy-tactical-cantilever-34mm
      gray-ops-scope-mount
      gray-ops-scope-rings
      nightforce-x-treme-duty-one-piece-steel-base-remington-700-short-action-20-moa
      mdt-scope-rings-premier
      talley-one-piece-scope-ring-mounts-stiller-precision-8-40-screws-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-remington-700-1-inch-multiple-heights
      talley-one-piece-scope-ring-mounts-tikka-t3-t3x-1-inch-multiple-heights
      leupold-scope-rings-prw2-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-defiance-machine-34mm-multiple-heights
      talley-one-piece-scope-ring-mounts-browning-x-bolt-1-inch-multiple-heights
      talley-one-piece-scope-ring-mounts-browning-x-bolt-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-defiance-machine-1-inch-multiple-heights
      talley-one-piece-scope-ring-mounts-defiance-machine-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-stiller-precision-8-40-screws-34mm-multiple-heights
      talley-one-piece-scope-ring-mounts-rcm-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-winchester-model-70-sa-1-inch-multiple-heights
      talley-one-piece-scope-ring-mounts-stiller-precision-6-48-screws-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-stiller-precision-6-48-screws-1-inch-multiple-heights
      talley-one-piece-scope-ring-mounts-rcm-1-inch-multiple-heights
      gray-ops-scope-accessory-accessory-rail
      leupold-scope-rings-qrw-1-inch-multiple-heights
      nightforce-x-treme-duty-one-piece-steel-base-remington-700-long-action-20-moa
      nightforce-x-treme-duty-one-piece-steel-base-remington-700-short-action-40-moa
      nightforce-x-treme-duty-one-piece-steel-base-remington-700-long-action-40-moa
      nightforce-x-treme-duty-top-half-ring-upgrade-34mm-w-level
      leupold-scope-rings-prw2-34mm-multiple-heights
      talley-one-piece-scope-ring-mounts-browning-x-bolt-34mm-multiple-heights
      leupold-scope-rings-prw2-1-inch-multiple-heights
      nightforce-x-treme-duty-ultralite-rings-6-screw-30mm-multiple-heights
      nightforce-x-treme-duty-ultralite-rings-4-screw-34mm-multiple-heights
      nightforce-x-treme-duty-ultralite-rings-6-screw-34mm-multiple-heights
      mdt-scope-rings-elite
      gray-ops-arca-plate-mini-pro
      gray-ops-arca-plate-amp-elite
      gray-ops-arca-plate-hunter
      gray-ops-arca-plate-mini-v2
      gray-ops-scope-accessory-diving-board
      defiance-machine-20-moa-picatinny-scope-base
      aero-precision-solus-night-vision-bridge
      talley-one-piece-scope-ring-mounts-remington-700-long-action-20-moa-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-remington-700-short-action-20-moa-30mm-multiple-heights
      xlr-industries-scope-base-remington-700
      talley-one-piece-scope-ring-mounts-remington-700-34mm-multiple-heights
      talley-one-piece-scope-ring-mounts-tikka-t3-t3x-30mm-multiple-heights
      talley-one-piece-scope-ring-mounts-winchester-model-70-la-post-64-30mm-multiple-heights
      zeiss-scope-rings-ultralight-with-level
      zeiss-3-sunshade-v4-v6-lrp-s5
    ]
  }.freeze

  # Ordered type determination rules – first match wins.
  # Order matters: more specific patterns before general ones.
  TYPE_RULES = [
    # ── Optic mounting hardware (must come before scope/action/ring generics) ──
    [/scope\s+ring\s+mount|one[- ]piece\s+scope\s+ring|arca\s+plate|scope\s+rings?\s+-\s+\w/i,      "rings"],
    [/picatinny\s+base|steel\s+base.*(?:short|long)\s+action.*moa|scope\s+base|scope\s+mount\b/i,   "mount"],
    [/\barca\b/i,                                                                                     "mount"],
    # ── Chassis & stocks ──
    [/\bchassis\b/i,                                                                                  "chassis"],
    [/\bstock\b|buttstock/i,                                                                          "stock"],
    # ── Barrels ──
    [/barrel|prefit/i,                                                                                "barrel"],
    # ── Muzzle devices ──
    [/muzzle\s+brake|muzzle\s+device|flash\s+hider|compensator/i,                                   "muzzle_device"],
    # ── Triggers ──
    [/\btrigger\b(?!\s+pin|guard)/i,                                                                  "trigger"],
    # ── Actions (receivers) — must come AFTER mounts/bases to avoid false matches ──
    [/\baction\b|\breceiver\b/i,                                                                      "action"],
    # ── Scopes & optics ──
    [/rifle\s+scope|riflescope|\bscope\b|\boptic\b/i,                                               "scope"],
    # ── Rings (generic fallback) ──
    [/\bring\b.*(?:mount|scope)|ring\s+set/i,                                                        "rings"],
    # ── Magazines ──
    [/\bmagazine\b|\bmag\b(?!\w)/i,                                                                  "magazine"],
    # ── Bipods ──
    [/\bbipod\b/i,                                                                                    "bipod"],
  ].freeze

  # Products matching any of these patterns are skipped entirely
  SKIP_PATTERNS = /
    t-shirt|hoodie|\bhat\b|\bcap\b|sticker|patch|apparel|lanyard|\bpen\b|
    lapping\s+compound|lapping\s+kit|removal\s+tool|cleaning\s+kit|
    gun\s+lube|gun\s+oil|solvent|paste\b|grease|benchtop|toolkit|
    bit\s+pack|multi\s+tool|ratcheting|bench\s+block|torque\s+limiter|armorers|
    action\s+screw\s+set|trigger\s+pin\s+set|firing\s+pin\s+removal|bolt\s+spring\s+tool|
    internal\s+magazine|
    cheek\s+riser|butt\s+pad\b|recoil\s+pad\b(?!.*stock)|
    binocular|rangefinder|chronograph|monocular|spotting\s+scope|
    scope\s+cap|scope\s+cover|neoprene\s+cover|lens\s+cap|objective\s+cap|
    throw\s+lever|power\s+throw|sunshade|fog\s+defender|antifog|lens\s+care|
    binocular\s+harness|binocular\s+suspender|forehead\s+rest|
    scope\s+accessory|diving\s+board|accessory\s+rail|bubble\s+level\s+set|
    magnification\s+extender|night\s+vision\s+bridge|
    forend\s+weight|thumb\s+rest|m-lok\s+thumb|weight\s+kit|base\s+pad\b|
    shortened\s+buffer|carbine\s+stock
  /xi

  # ============================================================================
  # PUBLIC API
  # ============================================================================

  def self.run!(dry_run: false, verbose: true, categories: nil)
    new(dry_run: dry_run, verbose: verbose, categories: categories).run!
  end

  def initialize(dry_run: false, verbose: true, categories: nil)
    @dry_run    = dry_run
    @verbose    = verbose
    @categories = categories ? CATEGORIES.slice(*categories) : CATEGORIES
    @mfr_cache  = {}
    @seen_urls  = Set.new
    @stats      = { created: 0, updated: 0, skipped: 0, errors: 0 }
  end

  def run!
    log "🦅  Red Hawk Rifles Importer#{@dry_run ? ' (DRY RUN)' : ''}"
    log "=" * 65

    @categories.each do |slug, hint|
      log "\n📦  Category: #{slug}"
      products = scrape_category(slug, hint)
      log "    → #{products.length} relevant products found"

      products.each do |product|
        process_product(product)
      rescue StandardError => e
        log "    ❌  Error on '#{product[:name]}': #{e.message}"
        @stats[:errors] += 1
      end
    end

    log "\n" + "=" * 65
    log "✅  Created: #{@stats[:created]}  Updated: #{@stats[:updated]}  " \
        "Skipped: #{@stats[:skipped]}  Errors: #{@stats[:errors]}"
    @stats
  end

  # ============================================================================
  # SCRAPING
  # ============================================================================

  private

  # Collect all product URLs for a category, then scrape each product page.
  #
  # redhawkrifles.com category listing pages are fully JavaScript-rendered
  # (BigCommerce headless). Net::HTTP gets a ~190KB skeleton HTML with no
  # product grid. Individual product pages ARE server-side rendered with full
  # JSON-LD, Open Graph, and price data.
  #
  # URL discovery strategy (in order):
  #   1. Curated seed list from SEED_URLS (collected via JS-rendered browser)
  #   2. Anchor scanning on raw category HTML (catches any new products
  #      whose slugs appear in navigation/breadcrumbs even in skeleton HTML)
  #
  def scrape_category(slug, hint)
    all_products = []
    seen_urls    = Set.new

    # Step 1: Build URL list from seed + HTML anchor scan
    product_urls = collect_product_urls(slug)
    log "    → #{product_urls.length} product URLs collected"

    # Step 2: Scrape each product page individually (SSR, JSON-LD works great)
    product_urls.each_with_index do |url, idx|
      next if @seen_urls.include?(url)
      @seen_urls << url

      sleep REQUEST_DELAY if idx > 0

      product = scrape_product_page(url, hint)
      next unless product

      all_products << product
      log "    [#{idx + 1}/#{product_urls.length}] #{product[:type].upcase.ljust(14)} #{product[:name]}"
    rescue StandardError => e
      log "    ⚠️  Error scraping #{url}: #{e.message}"
    end

    all_products
  end

  # Combine seed URLs with any additional URLs found via HTML anchor scanning
  def collect_product_urls(slug)
    urls = Set.new

    # Seeded URLs (from JS-rendered category pages, curated)
    (SEED_URLS[slug] || []).each do |product_slug|
      urls << "#{BASE_URL}/#{product_slug}/"
    end

    # Supplement with anchor scanning on raw HTML (skeleton still has some hrefs)
    scan_urls = scan_category_anchors(slug)
    scan_urls.each { |u| urls << u }

    urls.to_a
  end

  # Scan raw category page HTML for product-like anchor hrefs.
  # Even though the product grid is JS-rendered, some slugs appear in
  # breadcrumbs, related links, or navigation in the skeleton HTML.
  def scan_category_anchors(slug)
    found = Set.new
    max_scan_pages = [MAX_PAGES, 3].min

    max_scan_pages.times do |i|
      page = i + 1
      url  = "#{BASE_URL}/#{slug}/?page=#{page}"
      html = fetch_page(url)
      next if html.nil?

      # Extract all hrefs that look like product slugs (10–80 char lowercase slugs)
      html.scan(/href=["'](\/[a-z][a-z0-9-]{8,79}\/)["']/i) do |match|
        href = match[0]
        next if href.match?(
          %r{/(cart|checkout|account|login|compare|search|brands|
               stocks-and-chassis-systems|rifle-parts|optics|optic-parts-and-accessories|
               accessories1?|tools|weekly-deals|blog|about|contact|sitemap|
               email-sms|pro-member|military|dealer|shipping|international|
               privacy|peak44|login)\b}xi
        )
        next if href.include?("?") || href.include?("#")
        found << "#{BASE_URL}#{href}"
      end
    end

    found.to_a
  end

  # Scrape a single product page via Net::HTTP and build a product hash.
  # Uses JSON-LD → Open Graph → HTML heuristics (same as ProductScraper).
  def scrape_product_page(url, hint)
    html = fetch_page(url)
    return nil if html.nil? || html.length < 5_000  # skeleton/404 page

    # ── Extract structured data ────────────────────────────────────────────
    name       = extract_name_from_page(html)
    return nil unless name.present? && name.length > 4

    # Strip marker prefixes (*DISCONTINUED*, *DEMO/LIKE NEW*, *CLEARANCE*)
    discontinued     = name.match?(/discontinued/i)
    demo_or_clearance = name.match?(/demo|clearance|like\s*new/i)
    clean_name       = name.gsub(/\*[^*]+\*\s*/i, "").strip
    clean_name       = clean_name.gsub(/\A[*\s]+|[*\s]+\z/, "").strip

    return nil if clean_name.blank?
    return nil if clean_name.match?(SKIP_PATTERNS)

    type = determine_type(clean_name, hint)
    return nil unless type

    brand       = extract_brand_from_page(html) || extract_brand_from_name(clean_name)
    image_url   = extract_image_from_page(html)
    price_cents = extract_price_cents_from_page(html)

    specs = build_specs(clean_name, type)
    specs[:source]      = "Red Hawk Rifles"
    specs[:source_url]  = url
    specs[:last_synced] = Time.current.iso8601

    {
      name:         clean_name,
      brand:        brand.presence,
      image_url:    image_url,
      price_cents:  price_cents,
      type:         type,
      specs:        specs,
      source_url:   url,
      discontinued: discontinued,
      demo:         demo_or_clearance
    }
  end

  # ── Page-level data extraction ─────────────────────────────────────────────

  def extract_name_from_page(html)
    # Layer 1: JSON-LD Product name
    if (m = html.match(/"@type"\s*:\s*"Product".*?"name"\s*:\s*"([^"]+)"/m))
      return decode_html(m[1].strip)
    end

    # Layer 2: Open Graph title (usually "Product Name | Red Hawk Rifles")
    if (m = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i))
      name = m[1].strip.gsub(/\s*\|\s*Red\s+Hawk\s+Rifles.*$/i, "").strip
      return decode_html(name) if name.length > 4
    end

    # Layer 3: <title> tag
    if (m = html.match(/<title[^>]*>([^<]+)<\/title>/i))
      name = m[1].strip.gsub(/\s*[\|–\-]\s*Red\s+Hawk\s+Rifles.*$/i, "").strip
      return decode_html(name) if name.length > 4
    end

    nil
  end

  def extract_brand_from_page(html)
    # JSON-LD brand
    if (m = html.match(/"brand"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/m))
      return m[1].strip
    end

    # Open Graph brand tag
    if (m = html.match(/<meta[^>]*property=["']product:brand["'][^>]*content=["']([^"']+)["']/i))
      return m[1].strip
    end

    nil
  end

  def extract_image_from_page(html)
    # BigCommerce product image patterns (priority order)
    patterns = [
      /(?:data-src|src)=["'](https?:\/\/cdn\d*\.bigcommerce\.com\/[^"']+\/products\/\d+\/images\/[^"']+\.(?:jpg|jpeg|png|webp))(?:\?[^"']*)?["']/i,
      /"image"\s*:\s*"(https?:\/\/cdn\d*\.bigcommerce\.com\/[^"]+\.(?:jpg|jpeg|png|webp))"/i,
      /<meta[^>]*property=["']og:image["'][^>]*content=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp))[^"']*["']/i,
      /(?:data-src|src)=["'](https?:\/\/cdn\d*\.bigcommerce\.com\/[^"']+\.(?:jpg|jpeg|png|webp))(?:\?[^"']*)?["']/i,
    ]
    patterns.each do |p|
      m = html.match(p)
      next unless m
      img = m[1]
      next if img.match?(/stencil\/original|\/logo|icon|badge|banner|slider|hero|footer/i)
      return img
    end
    nil
  end

  def extract_price_cents_from_page(html)
    # JSON-LD offers price
    if (m = html.match(/"price"\s*:\s*"?([\d,]+\.?\d*)"?.*?"priceCurrency"/m))
      val = m[1].gsub(",", "").to_f
      return (val * 100).to_i if val > 0 && val < 50_000
    end
    if (m = html.match(/"offers".*?"price"\s*:\s*"?([\d,]+\.?\d*)"?/m))
      val = m[1].gsub(",", "").to_f
      return (val * 100).to_i if val > 0 && val < 50_000
    end

    # Open Graph price
    if (m = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([\d,]+\.?\d*)["']/i))
      val = m[1].gsub(",", "").to_f
      return (val * 100).to_i if val > 0 && val < 50_000
    end

    # HTML price patterns
    [
      />\s*\$([\d,]+\.\d{2})\s*</,
      /data-product-price=["']([\d,]+\.?\d*)["']/i,
    ].each do |p|
      m = html.match(p)
      next unless m
      val = m[1].gsub(",", "").to_f
      return (val * 100).to_i if val > 0 && val < 50_000
    end

    nil
  end

  # ============================================================================
  # TYPE DETERMINATION
  # ============================================================================

  def determine_type(name, hint)
    return nil if name.match?(SKIP_PATTERNS)

    TYPE_RULES.each do |pattern, type|
      return type if name.match?(pattern)
    end

    # Category-level fallbacks for ambiguous names
    case hint
    when :optics         then nil  # Only match via TYPE_RULES
    when :optic_accessories
      return "rings" if name.match?(/ring/i)
      return "mount" if name.match?(/mount|base|rail/i)
      nil
    end
  end

  # ============================================================================
  # SPEC PARSING FROM PRODUCT NAME
  # ============================================================================

  def build_specs(name, type)
    case type
    when "barrel"       then parse_barrel_specs(name)
    when "action"       then parse_action_specs(name)
    when "chassis"      then parse_chassis_specs(name)
    when "stock"        then parse_stock_specs(name)
    when "scope"        then parse_scope_specs(name)
    when "muzzle_device" then parse_muzzle_specs(name)
    when "trigger"      then parse_trigger_specs(name)
    when "mount", "rings" then parse_optic_accessory_specs(name)
    else {}
    end.compact
  end

  # Barrel: "Bartlein - Carbon Fiber - .300-.308 - 5R - 8T - #14 M24/M40 (2.75\" Shank) - 20\" Finish"
  def parse_barrel_specs(name)
    specs = {}

    # Material
    specs[:material] = "Carbon Fiber"    if name.match?(/carbon\s*fiber/i)
    specs[:material] = "Stainless Steel" if name.match?(/stainless\s*steel/i)

    # Caliber – decimal format (.224, .264, .284, .300, .308, .338, .300-.308, etc.)
    if (m = name.match(/(\.\d{3})\s*[-–]?\s*(\.\d{3})?/))
      specs[:caliber] = [m[1], m[2]].compact.uniq.join("/")
    end

    # Caliber in mm parentheses – (6.5mm), (7mm), (8mm)
    specs[:caliber_mm] = $1 if name.match?(/\(([\d.]+)\s*mm\)/i) && name =~ /\(([\d.]+)\s*mm\)/i

    # Named caliber formats: "300 PRC", "308 Win", "6.5 Creedmoor", "6.5 PRC", "7mm Rem Mag"
    if (m = name.match(/\b((?:6|7|8|338|300|308|260|243|257|264|284|30|6\.5|7)\s*(?:mm\s*)?
                         (?:PRC|Creedmoor|SAUM|WSM|RUM|Lapua|Win|Mag|Norma|BR|BRX|Dasher)?)/xi))
      specs[:named_caliber] = m[1].strip unless m[1].match?(/^\d$/)
    end

    # Rifling (5R, 4G, 3G, 5C, etc.)
    specs[:rifling]    = $1.upcase if name =~ /\b(\d[RGC])\b/i

    # Twist rate: "8T" → "1:8",  "7.5T" → "1:7.5",  "9.35T" → "1:9.35"
    specs[:twist_rate] = "1:#{$1}" if name =~ /\b(\d{1,2}(?:\.\d+)?)T\b/i

    # Contour / profile
    if (m = name.match(/#(\d+)\s+([^,\-\(]+)/i))
      specs[:contour] = m[0].strip
    elsif (m = name.match(/\b(Sendero|Heavy\s+Palma|Palma|Light\s+Varmint|Heavy\s+Varmint|
                            Varmint|Sporter|Magnum|M24\/M40|M24|M40|Tactical|Bull)\b/xi))
      specs[:contour] = m[0].strip
    end

    # Shank diameter: (2.00" Shank), (2.75" Shank), (3.00" Shank)
    specs[:shank_inches] = $1.to_f if name =~ /\(?([\d.]+)["″']\s*[Ss]hank/i

    # Barrel length: "20\" Finish", "24\" Finish", "26\"", etc.
    specs[:length_inches] = $1.to_i if name =~ /\b(1[68]|2[024680]|28|30)\s*["″]\s*(?:[Ff]inish|[Bb]arrel)?/i

    # Barrel type
    specs[:barrel_type] = "Prefit" if name.match?(/prefit/i)
    specs[:barrel_type] = "Blank"  if name.match?(/blank/i) && !specs[:barrel_type]

    specs
  end

  # Action: "Impact Precision - 737R Receiver - Short Action"
  #         "Defiance Machine - AnTi X Action"
  #         "Defiance Machine - Deviant Comp Action"
  def parse_action_specs(name)
    specs = {}

    specs[:action_length] = "Short Action" if name.match?(/short\s+action|\bSA\b/i)
    specs[:action_length] = "Long Action"  if name.match?(/long\s+action|\bLA\b/i)
    specs[:action_length] = "Magnum"       if name.match?(/magnum\s+action/i)

    specs[:handedness] = "Right Hand" if name.match?(/right\s+hand|\bRH\b/i)
    specs[:handedness] = "Left Hand"  if name.match?(/left\s+hand|\bLH\b/i)

    specs[:material] = "Titanium" if name.match?(/\bTi\b|titanium/i)
    specs[:material] = "Stainless Steel" if name.match?(/stainless/i) && !specs[:material]
    specs[:material] = "Aluminum"        if name.match?(/aluminum|aluminium/i) && !specs[:material]

    # Extract model from "Brand - Model - Type" format
    parts = name.split(/\s*[-–]\s+/)
    specs[:model] = parts[1]&.strip&.gsub(/action|receiver/i, "")&.strip if parts.length >= 2

    specs
  end

  # Chassis: "MDT - ACC Elite Chassis System - Remington 700"
  #          "MDT - HNT26 Lightweight Chassis (Folding) - Remington 700 Long Action"
  def parse_chassis_specs(name)
    specs = {}
    inlets = []

    inlets << "Remington 700"         if name.match?(/remington\s*700|rem\s*700|r700/i)
    inlets << "Tikka T3/T3X"          if name.match?(/tikka\s*t3(?!.*ctr)/i)
    inlets << "Tikka CTR"             if name.match?(/tikka\s*ctr/i)
    inlets << "Aero Precision SOLUS"  if name.match?(/\bsolus\b/i)
    inlets << "Zermatt Origin"        if name.match?(/zermatt.*origin|origin\s*r700/i)
    inlets << "Zermatt TL3/SR3"       if name.match?(/\bTL3\b|\bSR3\b/i)
    inlets << "Defiance"              if name.match?(/defiance/i)
    inlets << "Impact Precision"      if name.match?(/impact\s*precision/i)
    inlets << "Stiller"               if name.match?(/\bstiller\b/i)
    inlets << "Lone Peak"             if name.match?(/lone\s*peak/i)
    inlets << "Savage 110"            if name.match?(/savage\s*110/i)
    inlets << "Ruger American"        if name.match?(/ruger\s*american/i)
    inlets << "Winchester Model 70"   if name.match?(/winchester.*70|model\s*70/i)

    specs[:inlet]         = inlets.join(", ") if inlets.any?
    specs[:action_length] = "Long Action"   if name.match?(/long\s*action/i)
    specs[:action_length] = "Short Action"  if name.match?(/short\s*action/i) && !specs[:action_length]
    specs[:folding]       = "Yes"           if name.match?(/folding/i)
    specs[:material]      = "Magnesium"     if name.match?(/magnesium/i)
    specs[:material]      = "Aluminum"      if name.match?(/aluminum|aluminium/i) && !specs[:material]
    specs[:material]      = "Carbon Fiber"  if name.match?(/carbon\s*fiber/i) && !specs[:material]

    specs
  end

  # Stock: "P2 Pure Precision - Altitude Carbon Fiber Stock - Remington 700"
  #        "Grayboe - Phoenix 2 Fiberglass Stock - Remington 700"
  def parse_stock_specs(name)
    specs = {}
    inlets = []

    inlets << "Remington 700"   if name.match?(/remington\s*700|rem\s*700/i)
    inlets << "Tikka T3/T3X"    if name.match?(/tikka\s*t3(?!.*ctr)/i)
    inlets << "Tikka CTR"       if name.match?(/tikka\s*ctr/i)
    inlets << "Savage"          if name.match?(/\bsavage\b/i)
    inlets << "Howa"            if name.match?(/\bhowa\b/i)
    inlets << "Winchester 70"   if name.match?(/winchester.*70|model\s*70/i)

    specs[:inlet]    = inlets.join(", ") if inlets.any?
    specs[:material] = "Carbon Fiber"  if name.match?(/carbon\s*fiber/i)
    specs[:material] = "Fiberglass"    if name.match?(/fiberglass/i) && !specs[:material]
    specs[:material] = "Composite"     if name.match?(/composite/i) && !specs[:material]
    specs[:material] = "Wood"          if name.match?(/\bwood\b/i) && !specs[:material]

    specs
  end

  # Scope: "Leupold - Rifle Scope - Mark 5HD - 5-25x56 FFP"
  #        "Zeiss - Rifle Scope - Conquest V4 - 6-24x50"
  #        "Nightforce - ATACR Rifle Scope - 7-35x56mm"
  def parse_scope_specs(name)
    specs = {}

    # Variable power: "5-25x56", "6-24x50", "3-12x56", "4-16x44", "7-35x56"
    if (m = name.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+)/))
      specs[:magnification] = "#{m[1]}-#{m[2]}x"
      specs[:objective_mm]  = m[3].to_i
    # Fixed power: "10x42"
    elsif (m = name.match(/(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+)/))
      specs[:magnification] = "#{m[1]}x"
      specs[:objective_mm]  = m[2].to_i
    end

    specs[:focal_plane] = "FFP" if name.match?(/\bFFP\b|first\s+focal/i)
    specs[:focal_plane] = "SFP" if name.match?(/\bSFP\b|second\s+focal/i)

    specs[:tube_diameter_mm] = 34   if name.match?(/\b34\s*mm\b/i)
    specs[:tube_diameter_mm] = 35   if name.match?(/\b35\s*mm\b/i)
    specs[:tube_diameter_mm] = 30   if name.match?(/\b30\s*mm\b/i)
    specs[:tube_diameter_mm] = 25.4 if name.match?(/1"\s*tube|1-inch\s*tube/i)

    specs
  end

  # Muzzle device: "Hawkins Precision - Muzzle Brake - Backdraft Self-Timing"
  #                "Area 419 - Hellfire Muzzle Brake - 5/8-24"
  def parse_muzzle_specs(name)
    specs = {}

    # Thread pitch (5/8-24, 3/4-24, 1/2-28, M18×1, etc.)
    specs[:thread_pitch] = $&.strip if name =~ /\b\d+\/\d+-\d+\b|M\d+[x×]\d+(?:\.\d+)?/i

    # Caliber
    specs[:caliber] = $&.strip if name =~ /\.\d{3}/

    specs
  end

  # Trigger: "TriggerTech - Diamond Trigger - Remington 700"
  def parse_trigger_specs(name)
    specs = {}

    specs[:platform] = "Remington 700" if name.match?(/remington\s*700|rem\s*700/i)
    specs[:platform] = "Tikka T3/T3X"  if name.match?(/tikka\s*t3/i)
    specs[:platform] = "Savage"        if name.match?(/\bsavage\b/i)

    specs
  end

  # Mounts/Rings: "Nightforce – BEAST 6-35x56mm Integrated Mount"
  #               "Spuhr - Scope Mount - ISMS"
  def parse_optic_accessory_specs(name)
    specs = {}

    specs[:ring_diameter_mm] = $1.to_f if name =~ /\b(\d{2}(?:\.\d+)?)\s*mm\b/i
    specs[:rail_type] = "Picatinny"  if name.match?(/picatinny|1913|\bMIL-STD\b/i)
    specs[:rail_type] = "ARCA"       if name.match?(/\barca\b/i) && !specs[:rail_type]
    specs[:moa_cant]  = $1.to_i       if name =~ /(\d+)\s*MOA\s*(?:cant|tilt|base)/i

    specs
  end

  # ============================================================================
  # DATABASE IMPORT
  # ============================================================================

  def process_product(product)
    name = product[:name].to_s.strip
    return if name.blank?

    # Skip demo/clearance items to keep DB clean
    if product[:demo]
      @stats[:skipped] += 1
      return
    end

    type = product[:type]
    return unless type && Component::TYPES.include?(type)

    brand = product[:brand].presence ||
            extract_brand_from_name(name) ||
            "Red Hawk Rifles"

    manufacturer = @mfr_cache[brand] ||= Manufacturer.find_or_create_by!(name: brand) do |m|
      m.country = "USA"
    end

    if @dry_run
      action = Component.exists?(name: name) ? "UPDATE" : "CREATE"
      log "    [#{action}] #{type.upcase.ljust(14)} #{name}"
      @stats[action == "CREATE" ? :created : :updated] += 1
      return
    end

    existing = Component.find_by(name: name)

    if existing
      updates = {}
      updates[:image_url]    = product[:image_url]   if product[:image_url].present? && existing.image_url.blank?
      updates[:msrp_cents]   = product[:price_cents]  if product[:price_cents]&.positive? && existing.msrp_cents.to_i.zero?
      updates[:discontinued] = true                   if product[:discontinued] && !existing.discontinued?
      merged                 = (existing.specs || {}).merge(product[:specs] || {})
      updates[:specs]        = merged                  if merged != existing.specs

      existing.update!(updates) if updates.any?
      @stats[:updated] += 1
    else
      Component.create!(
        name:         name,
        type:         type,
        manufacturer: manufacturer,
        msrp_cents:   product[:price_cents],
        image_url:    product[:image_url],
        specs:        product[:specs] || {},
        discontinued: product[:discontinued] || false
      )
      @stats[:created] += 1
    end
  end

  # ============================================================================
  # HELPERS
  # ============================================================================

  # Most RHR product names follow "Brand - Product Name" or "Brand Name - Product Model - Specs"
  def extract_brand_from_name(name)
    parts = name.split(/\s*[-–]\s+/, 2)
    return nil if parts.length < 2

    brand = parts.first.strip
    return nil if brand.length > 60 || brand.length < 2
    return nil if brand.match?(/discontinued|demo|clearance|sale|\*/i)

    brand
  end

  def price_from_str(str)
    val = str.to_s.gsub(",", "").to_f
    return nil if val <= 0 || val > 50_000
    (val * 100).to_i
  end

  def decode_html(text)
    text.to_s
        .gsub("&amp;",  "&")
        .gsub("&lt;",   "<")
        .gsub("&gt;",   ">")
        .gsub("&#39;",  "'")
        .gsub("&apos;", "'")
        .gsub("&quot;", '"')
        .gsub("&nbsp;", " ")
        .gsub(/&#(\d+);/) { $1.to_i.chr(Encoding::UTF_8) rescue "" }
        .gsub(/\s+/, " ")
        .strip
  end

  def fetch_page(url)
    uri  = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl      = (uri.scheme == "https")
    http.open_timeout = 10
    http.read_timeout = 20

    req = Net::HTTP::Get.new(uri.request_uri)
    req["User-Agent"]      = USER_AGENT
    req["Accept"]          = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    req["Accept-Language"] = "en-US,en;q=0.5"
    req["Accept-Encoding"] = "identity"

    resp = http.request(req)

    # Follow up to 3 redirects
    3.times do
      break unless resp.is_a?(Net::HTTPRedirection)
      location = resp["location"]
      location = "#{BASE_URL}#{location}" if location&.start_with?("/")
      uri  = URI.parse(location)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == "https")
      req  = Net::HTTP::Get.new(uri.request_uri)
      req["User-Agent"] = USER_AGENT
      resp = http.request(req)
    end

    return nil unless resp.is_a?(Net::HTTPSuccess)
    resp.body.force_encoding("UTF-8").encode("UTF-8", invalid: :replace, undef: :replace, replace: "")
  rescue StandardError => e
    log "    ⚠️  HTTP error for #{url}: #{e.message}"
    nil
  end

  def log(msg)
    puts msg if @verbose
    Rails.logger.info("[RHR] #{msg}") if defined?(Rails)
  end
end
