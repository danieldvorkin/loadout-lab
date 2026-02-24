# frozen_string_literal: true

namespace :images do
  desc "Populate images for manufacturers and components"
  task populate: :environment do
    puts "🖼️  Starting image population..."
    PopulateImagesJob.perform_now
    puts "✅ Image population complete!"
    print_stats
  end

  desc "Populate only manufacturer images"
  task manufacturers: :environment do
    puts "🖼️  Populating manufacturer images..."
    PopulateImagesJob.perform_now(:manufacturers)
    puts "✅ Done!"
    print_stats
  end

  desc "Populate only component images"
  task components: :environment do
    puts "🖼️  Populating component images..."
    PopulateImagesJob.perform_now(:components)
    puts "✅ Done!"
    print_stats
  end

  desc "Show image coverage statistics"
  task stats: :environment do
    print_stats
  end

  desc "Clear all images (for re-population)"
  task clear: :environment do
    Component.update_all(image_url: nil)
    Manufacturer.update_all(image_url: nil)
    puts "🗑️  All images cleared"
  end

  def print_stats
    total_components = Component.count
    components_with_images = Component.where.not(image_url: [nil, ""]).count
    total_manufacturers = Manufacturer.count
    manufacturers_with_images = Manufacturer.where.not(image_url: [nil, ""]).count

    puts ""
    puts "📊 Image Coverage Stats:"
    puts "  Manufacturers: #{manufacturers_with_images}/#{total_manufacturers} (#{(manufacturers_with_images.to_f / total_manufacturers * 100).round(1)}%)"
    puts "  Components:    #{components_with_images}/#{total_components} (#{(components_with_images.to_f / total_components * 100).round(1)}%)"
    puts ""

    if manufacturers_with_images > 0
      puts "  Manufacturers WITH images:"
      Manufacturer.where.not(image_url: [nil, ""]).order(:name).each do |m|
        puts "    ✅ #{m.name}"
      end
    end

    missing_by_mfr = Component.where(image_url: [nil, ""])
                              .joins(:manufacturer)
                              .group("manufacturers.name")
                              .count
                              .sort_by { |_, v| -v }

    if missing_by_mfr.any?
      puts ""
      puts "  Components MISSING images (by manufacturer):"
      missing_by_mfr.first(15).each do |name, count|
        puts "    ❌ #{name}: #{count} components"
      end
    end
  end
end
