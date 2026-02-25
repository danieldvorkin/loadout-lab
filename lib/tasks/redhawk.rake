# frozen_string_literal: true

namespace :redhawk do
  desc "Import all build-relevant components from redhawkrifles.com"
  task import: :environment do
    puts "Starting Red Hawk Rifles import..."
    stats = RedHawkRiflesImporter.run!
    puts "\nFinal counts in DB:"
    puts "  Components: #{Component.count}"
    puts "  Manufacturers: #{Manufacturer.count}"
  end

  desc "Dry-run the Red Hawk Rifles import (no DB writes)"
  task "import:dry_run": :environment do
    puts "DRY RUN – no records will be written\n"
    RedHawkRiflesImporter.run!(dry_run: true)
  end

  desc "Import only a specific category, e.g. rake redhawk:import_category[rifle-parts]"
  task :import_category, [ :slug ] => :environment do |_t, args|
    slug = args[:slug]
    if slug.blank? || !RedHawkRiflesImporter::CATEGORIES.key?(slug)
      puts "Available categories:"
      RedHawkRiflesImporter::CATEGORIES.each_key { |k| puts "  #{k}" }
      exit 1
    end
    RedHawkRiflesImporter.run!(categories: [ slug ])
  end

  desc "Show component counts by type"
  task stats: :environment do
    puts "\nComponents by type:"
    Component::TYPES.each do |t|
      count = Component.where(type: t).count
      puts "  #{t.ljust(16)} #{count}" if count > 0
    end
    puts "\nTotal: #{Component.count}"

    puts "\nComponents by manufacturer (top 20):"
    Component.joins(:manufacturer)
             .group("manufacturers.name")
             .order("count_all DESC")
             .limit(20)
             .count
             .each { |name, count| puts "  #{name.ljust(40)} #{count}" }
  end
end
