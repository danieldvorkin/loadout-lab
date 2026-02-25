# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "🌱 Seeding PRS Builder database..."

# =============================================================================
# MANUFACTURERS
# =============================================================================
puts "Creating manufacturers..."

manufacturers_data = [
  # Canadian Manufacturers
  { name: "MDT (Modular Driven Technologies)", website: "https://mdttac.com", country: "Canada" },
  { name: "Cadex Defence", website: "https://cadexdefence.com", country: "Canada" },
  { name: "TriggerTech", website: "https://triggertech.com", country: "Canada" },
  { name: "Area 419", website: "https://area419.com", country: "USA" },
  { name: "Accuracy International", website: "https://www.accuracyinternational.com", country: "UK" },

  # Optics Manufacturers
  { name: "Vortex Optics", website: "https://vortexoptics.com", country: "USA" },
  { name: "Nightforce Optics", website: "https://nightforceoptics.com", country: "USA" },
  { name: "Leupold", website: "https://leupold.com", country: "USA" },
  { name: "Kahles", website: "https://kahles.at", country: "Austria" },
  { name: "Schmidt & Bender", website: "https://schmidtundbender.de", country: "Germany" },
  { name: "Zeiss", website: "https://zeiss.com", country: "Germany" },
  { name: "Athlon Optics", website: "https://athlonoptics.com", country: "USA" },
  { name: "Primary Arms", website: "https://primaryarms.com", country: "USA" },
  { name: "Riton Optics", website: "https://ritonoptics.com", country: "USA" },
  { name: "Tangent Theta", website: "https://tangenttheta.com", country: "Canada" },
  { name: "Zero Compromise Optics", website: "https://zerocompromise.com", country: "Austria" },

  # Action/Receiver Manufacturers
  { name: "Bighorn Arms", website: "https://bighornarms.com", country: "USA" },
  { name: "Defiance Machine", website: "https://defiancemachine.com", country: "USA" },
  { name: "Lone Peak Arms", website: "https://lonepeakarms.com", country: "USA" },
  { name: "Impact Precision", website: "https://impactprecisionllc.com", country: "USA" },
  { name: "Kelbly's", website: "https://kelbly.com", country: "USA" },
  { name: "Stiller Actions", website: "https://stilleractions.com", country: "USA" },
  { name: "Curtis Custom", website: "https://curtisactions.com", country: "USA" },
  { name: "Nucleus", website: "https://americanrifle.com", country: "USA" },

  # Barrel Manufacturers
  { name: "Bartlein Barrels", website: "https://bartleinbarrels.com", country: "USA" },
  { name: "Krieger Barrels", website: "https://kriegerbarrels.com", country: "USA" },
  { name: "Proof Research", website: "https://proofresearch.com", country: "USA" },
  { name: "Benchmark Barrels", website: "https://benchmarkbarrels.com", country: "USA" },
  { name: "Hawk Hill Custom", website: "https://hawkhillcustom.com", country: "USA" },
  { name: "Preferred Barrel Blanks", website: "https://preferredbarrels.com", country: "USA" },
  { name: "X-Caliber", website: "https://x-caliber.net", country: "USA" },
  { name: "Lilja Barrels", website: "https://riflebarrels.com", country: "USA" },

  # Stock/Chassis Manufacturers
  { name: "Manners Composite Stocks", website: "https://mannersstocks.com", country: "USA" },
  { name: "McMillan", website: "https://mcmillanusa.com", country: "USA" },
  { name: "Foundation Stocks", website: "https://foundationstocks.com", country: "USA" },
  { name: "Grayboe", website: "https://grayboe.com", country: "USA" },
  { name: "Oryx Chassis", website: "https://mdttac.com", country: "Canada" },
  { name: "XLR Industries", website: "https://xlrindustries.com", country: "USA" },
  { name: "KRG (Kinetic Research Group)", website: "https://kineticresearchgroup.com", country: "USA" },
  { name: "MPA (Masterpiece Arms)", website: "https://masterpiecearms.com", country: "USA" },

  # Bipod Manufacturers
  { name: "Atlas Bipods", website: "https://accu-shot.com", country: "USA" },
  { name: "Harris Bipods", website: "https://harrisbipods.com", country: "USA" },
  { name: "Ckye-Pod", website: "https://ckye-pod.com", country: "USA" },
  { name: "RYDR Industries", website: "https://rydrindustries.com", country: "Canada" },

  # Muzzle Device Manufacturers
  { name: "Thunderbeast Arms", website: "https://thunderbeastarms.com", country: "USA" },
  { name: "Dead Air Armament", website: "https://deadairsilencers.com", country: "USA" },
  { name: "SilencerCo", website: "https://silencerco.com", country: "USA" },
  { name: "Without Warning", website: "https://withoutwarningmfg.com", country: "USA" },
  { name: "Salmon River Solutions", website: "https://salmonriversolutions.com", country: "USA" },

  # Scope Ring/Mount Manufacturers
  { name: "Spuhr", website: "https://spuhr.biz", country: "Sweden" },
  { name: "Seekins Precision", website: "https://seekinsprecision.com", country: "USA" },
  { name: "Badger Ordnance", website: "https://badgerordnance.com", country: "USA" },
  { name: "American Rifle Company (ARC)", website: "https://americanrifle.com", country: "USA" },
  { name: "Warne", website: "https://warnemfg.com", country: "USA" },
  { name: "ERA-TAC", website: "https://recknagel.de", country: "Germany" },

  # Trigger Manufacturers
  { name: "Timney Triggers", website: "https://timneytriggers.com", country: "USA" },
  { name: "Bix'n Andy", website: "https://bixnandy.com", country: "Austria" },
  { name: "Jewel Trigger", website: "https://jeweltrigger.com", country: "USA" },
  { name: "Huber Concepts", website: "https://huberconcepts.com", country: "USA" },

  # Accessory Manufacturers
  { name: "Warne", website: "https://warnemfg.com", country: "USA" },
  { name: "Really Right Stuff", website: "https://reallyrightstuff.com", country: "USA" },
  { name: "Wiebad", website: "https://wiebad.com", country: "USA" },
  { name: "Tab Gear", website: "https://tabgear.com", country: "USA" },
  { name: "Armageddon Gear", website: "https://armageddongear.com", country: "USA" },
  { name: "Cole-TAC", website: "https://cole-tac.com", country: "USA" },
  { name: "Garmin", website: "https://garmin.com", country: "USA" },
  { name: "MagnetoSpeed", website: "https://magnetospeed.com", country: "USA" },
  { name: "LabRadar", website: "https://mylabradar.com", country: "USA" }
]

manufacturers = {}
manufacturers_data.each do |data|
  manufacturer = Manufacturer.find_or_create_by!(name: data[:name]) do |m|
    m.website = data[:website]
    m.country = data[:country]
  end
  manufacturers[data[:name]] = manufacturer
end

puts "✅ Created #{Manufacturer.count} manufacturers"

# =============================================================================
# COMPONENTS
# =============================================================================
puts "Creating components..."

components_data = [
  # =====================
  # MDT CHASSIS SYSTEMS
  # =====================
  { name: "MDT ACC Elite Chassis System", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 96.0, msrp_cents: 199900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x", "Savage" ], material: "Aluminum", color: "Black", arca_rail: true, folding_stock: true, adjustable_lop: true, adjustable_cheek: true }, discontinued: false },
  { name: "MDT ESS Chassis System", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 54.0, msrp_cents: 79900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x" ], material: "Aluminum", color: "Black", arca_rail: true, folding_stock: false }, discontinued: false },
  { name: "MDT LSS-XL Gen 2 Chassis", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 26.0, msrp_cents: 49900, specs: { action_compatibility: [ "Remington 700", "Savage", "Howa 1500" ], material: "Aluminum", color: "Black" }, discontinued: false },
  { name: "MDT XRS Chassis System", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 48.0, msrp_cents: 89900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x" ], material: "Aluminum/Polymer", color: "Black", arca_rail: true }, discontinued: false },
  { name: "MDT HNT26 Chassis System", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 26.0, msrp_cents: 69900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x" ], material: "Carbon Fiber/Aluminum", color: "Black", hunting: true }, discontinued: false },
  { name: "MDT Tac21 Chassis System", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 64.0, msrp_cents: 94900, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum", color: "Black", folding_stock: true }, discontinued: false },
  { name: "MDT LSS Gen 3 Chassis System", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 28.0, msrp_cents: 54900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x", "Savage" ], material: "Aluminum", modular: true }, discontinued: false },
  { name: "MDT Oryx Chassis - Tikka T3x", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 48.0, msrp_cents: 44900, specs: { action_compatibility: [ "Tikka T3x" ], material: "Aluminum/Polymer", color: "Black" }, discontinued: false },
  { name: "MDT Oryx Chassis - Remington 700 SA", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 48.0, msrp_cents: 44900, specs: { action_compatibility: [ "Remington 700 SA" ], material: "Aluminum/Polymer", color: "FDE" }, discontinued: false },

  # MDT Accessories
  { name: "MDT Skeleton Carbine Stock", type: "stock", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 16.0, msrp_cents: 22900, specs: { material: "Aluminum", color: "Black", adjustable_lop: true, adjustable_cheek: true }, discontinued: false },
  { name: "MDT Skeleton Rifle Stock", type: "stock", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 20.0, msrp_cents: 24900, specs: { material: "Aluminum", color: "Black", adjustable_lop: true, adjustable_cheek: true }, discontinued: false },
  { name: "MDT Vertical Grip Elite", type: "grip", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 7900, specs: { material: "Aluminum", color: "Black" }, discontinued: false },
  { name: "MDT Premier Scope Ring 34mm High", type: "rings", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 5.0, msrp_cents: 19900, specs: { diameter: "34mm", height: "High", material: "Aluminum" }, discontinued: false },
  { name: "MDT Premier Scope Ring 34mm Medium", type: "rings", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.5, msrp_cents: 19900, specs: { diameter: "34mm", height: "Medium", material: "Aluminum" }, discontinued: false },
  { name: "MDT CKYE-POD Gen 2 Bipod", type: "bipod", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 14.0, msrp_cents: 44900, specs: { height: "6-10 inches", material: "Aluminum", arca_compatible: true }, discontinued: false },
  { name: "MDT Comp Brake .30 Cal 5/8x24", type: "muzzle_device", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 12900, specs: { caliber: ".30", thread: "5/8x24", material: "Steel" }, discontinued: false },
  { name: "MDT Elite Muzzle Brake .308 5/8x24", type: "muzzle_device", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 5.5, msrp_cents: 14900, specs: { caliber: ".308", thread: "5/8x24", material: "Steel", self_timing: false }, discontinued: false },
  { name: "MDT AICS Pattern Magazine 10rd .308", type: "magazine", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 5900, specs: { capacity: 10, caliber: ".308", pattern: "AICS" }, discontinued: false },
  { name: "MDT AICS Pattern Magazine 10rd 6.5CM", type: "magazine", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 5900, specs: { capacity: 10, caliber: "6.5 Creedmoor", pattern: "AICS" }, discontinued: false },

  # =====================
  # CADEX DEFENCE
  # =====================
  { name: "Cadex CDX-50 Tremor", type: "chassis", manufacturer: "Cadex Defence", weight_oz: 512.0, msrp_cents: 899900, specs: { caliber: ".50 BMG", action_compatibility: [ "Cadex" ], material: "Aluminum", folding_stock: true }, discontinued: false },
  { name: "Cadex CDX-R7 FCP Chassis", type: "chassis", manufacturer: "Cadex Defence", weight_oz: 84.0, msrp_cents: 229900, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum", color: "Sniper Grey", folding_stock: true }, discontinued: false },
  { name: "Cadex CDX-R7 LCP Chassis", type: "chassis", manufacturer: "Cadex Defence", weight_oz: 72.0, msrp_cents: 199900, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum", color: "Black", hunting: true }, discontinued: false },
  { name: "Cadex Strike Dual Chassis System", type: "chassis", manufacturer: "Cadex Defence", weight_oz: 80.0, msrp_cents: 259900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x" ], material: "Aluminum", dual_caliber: true }, discontinued: false },
  { name: "Cadex MX1 Muzzle Brake .308 5/8x24", type: "muzzle_device", manufacturer: "Cadex Defence", weight_oz: 5.0, msrp_cents: 14900, specs: { caliber: ".308", thread: "5/8x24", material: "Steel" }, discontinued: false },
  { name: "Cadex Defence Falcon Bipod", type: "bipod", manufacturer: "Cadex Defence", weight_oz: 12.0, msrp_cents: 39900, specs: { height: "6-9 inches", material: "Aluminum", arca_compatible: true }, discontinued: false },

  # =====================
  # TRIGGERTECH
  # =====================
  { name: "TriggerTech Diamond Flat - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Remington 700", pull_weight: "4oz-32oz", style: "Flat", safety: true }, discontinued: false },
  { name: "TriggerTech Diamond Curved - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Remington 700", pull_weight: "4oz-32oz", style: "Curved", safety: true }, discontinued: false },
  { name: "TriggerTech Primary Flat - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 17900, specs: { action_compatibility: "Remington 700", pull_weight: "1.5lbs-4lbs", style: "Flat", safety: true }, discontinued: false },
  { name: "TriggerTech Primary Curved - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 17900, specs: { action_compatibility: "Remington 700", pull_weight: "1.5lbs-4lbs", style: "Curved", safety: true }, discontinued: false },
  { name: "TriggerTech Special Flat - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 22900, specs: { action_compatibility: "Remington 700", pull_weight: "1lb-3.5lbs", style: "Flat", safety: true }, discontinued: false },
  { name: "TriggerTech Diamond Flat - Tikka T3x", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Tikka T3x", pull_weight: "4oz-32oz", style: "Flat", safety: true }, discontinued: false },
  { name: "TriggerTech Diamond Pro Curved - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.2, msrp_cents: 34900, specs: { action_compatibility: "Remington 700", pull_weight: "2oz-24oz", style: "Pro Curved", safety: true, prs_legal: true }, discontinued: false },
  { name: "TriggerTech Excalibur Pro - Tikka T3x", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.2, msrp_cents: 32900, specs: { action_compatibility: "Tikka T3x", pull_weight: "2.5oz-5lbs", style: "Flat" }, discontinued: false },

  # =====================
  # AREA 419
  # =====================
  { name: "Area 419 Hellfire Self-Timing Muzzle Brake .30 Cal", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 4.5, msrp_cents: 17000, specs: { caliber: ".30", thread: "5/8x24", material: "Steel", self_timing: true }, discontinued: false },
  { name: "Area 419 Hellfire Match Self-Timing Brake .30 Cal", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 5.0, msrp_cents: 19500, specs: { caliber: ".30", thread: "5/8x24", material: "Steel", self_timing: true, match: true }, discontinued: false },
  { name: "Area 419 Hellfire Self-Timing Muzzle Brake 6.5mm", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 4.0, msrp_cents: 17000, specs: { caliber: "6.5mm", thread: "5/8x24", material: "Steel", self_timing: true }, discontinued: false },
  { name: "Area 419 Hellfire Universal Adapter", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 1.5, msrp_cents: 4000, specs: { type: "Adapter", compatible: "Hellfire Brakes" }, discontinued: false },
  { name: "Area 419 Hellfire Suppressor Mount 5/8x24", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 3.0, msrp_cents: 10000, specs: { thread: "5/8x24", type: "Suppressor Mount" }, discontinued: false },
  { name: "Area 419 ARCALOCK Universal Dovetail Rail 4.25\"", type: "mount", manufacturer: "Area 419", weight_oz: 2.0, msrp_cents: 4500, specs: { length: "4.25 inches", pattern: "ARCA", material: "Aluminum" }, discontinued: false },
  { name: "Area 419 ARCALOCK Clamp", type: "mount", manufacturer: "Area 419", weight_oz: 3.5, msrp_cents: 8500, specs: { pattern: "ARCA", material: "Aluminum" }, discontinued: false },
  { name: "Area 419 Scope Mount 30mm 0 MOA", type: "mount", manufacturer: "Area 419", weight_oz: 8.0, msrp_cents: 32500, specs: { diameter: "30mm", cant: "0 MOA", material: "Aluminum" }, discontinued: false },
  { name: "Area 419 Scope Mount 34mm 20 MOA", type: "mount", manufacturer: "Area 419", weight_oz: 9.0, msrp_cents: 34500, specs: { diameter: "34mm", cant: "20 MOA", material: "Aluminum" }, discontinued: false },
  { name: "Area 419 Scope Mount 34mm 0 MOA", type: "mount", manufacturer: "Area 419", weight_oz: 9.0, msrp_cents: 34500, specs: { diameter: "34mm", cant: "0 MOA", material: "Aluminum" }, discontinued: false },
  { name: "Area 419 CZ457 Scope Base 0 MOA", type: "mount", manufacturer: "Area 419", weight_oz: 2.5, msrp_cents: 10000, specs: { action: "CZ 457", cant: "0 MOA" }, discontinued: false },
  { name: "Area 419 CZ457 Scope Base 20 MOA", type: "mount", manufacturer: "Area 419", weight_oz: 2.5, msrp_cents: 11500, specs: { action: "CZ 457", cant: "20 MOA" }, discontinued: false },
  { name: "Area 419 ZERO Gen 2 Reloading Press", type: "other", manufacturer: "Area 419", weight_oz: 320.0, msrp_cents: 140000, specs: { type: "Reloading Press", arbor: true }, discontinued: false },
  { name: "Area 419 Billet Loading Block", type: "other", manufacturer: "Area 419", weight_oz: 8.0, msrp_cents: 5500, specs: { type: "Reloading Accessory", material: "Aluminum" }, discontinued: false },
  { name: "Area 419 Master Funnel Kit", type: "other", manufacturer: "Area 419", weight_oz: 4.0, msrp_cents: 10000, specs: { type: "Reloading Accessory" }, discontinued: false },

  # =====================
  # VORTEX OPTICS
  # =====================
  { name: "Vortex Razor HD Gen III 6-36x56 EBR-7D MRAD", type: "scope", manufacturer: "Vortex Optics", weight_oz: 46.0, msrp_cents: 399900, specs: { magnification: "6-36x", objective: "56mm", reticle: "EBR-7D MRAD", tube_diameter: "34mm", turrets: "Exposed", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Razor HD Gen II 4.5-27x56 EBR-7C MRAD", type: "scope", manufacturer: "Vortex Optics", weight_oz: 48.0, msrp_cents: 269900, specs: { magnification: "4.5-27x", objective: "56mm", reticle: "EBR-7C MRAD", tube_diameter: "34mm", turrets: "Exposed", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Viper PST Gen II 5-25x50 EBR-7C MRAD", type: "scope", manufacturer: "Vortex Optics", weight_oz: 30.0, msrp_cents: 99900, specs: { magnification: "5-25x", objective: "50mm", reticle: "EBR-7C MRAD", tube_diameter: "30mm", turrets: "Exposed", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Viper PST Gen II 5-25x50 EBR-2D MOA", type: "scope", manufacturer: "Vortex Optics", weight_oz: 30.0, msrp_cents: 99900, specs: { magnification: "5-25x", objective: "50mm", reticle: "EBR-2D MOA", tube_diameter: "30mm", turrets: "Exposed", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Diamondback Tactical 6-24x50 EBR-2C MRAD", type: "scope", manufacturer: "Vortex Optics", weight_oz: 23.0, msrp_cents: 49900, specs: { magnification: "6-24x", objective: "50mm", reticle: "EBR-2C MRAD", tube_diameter: "30mm", turrets: "Exposed", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Crossfire HD 4-12x44 BDC", type: "scope", manufacturer: "Vortex Optics", weight_oz: 15.0, msrp_cents: 31999, specs: { magnification: "4-12x", objective: "44mm", reticle: "BDC", tube_diameter: "1 inch", turrets: "Capped" }, discontinued: false },
  { name: "Vortex Strike Eagle 5-25x56 EBR-7C MRAD", type: "scope", manufacturer: "Vortex Optics", weight_oz: 28.0, msrp_cents: 59900, specs: { magnification: "5-25x", objective: "56mm", reticle: "EBR-7C MRAD", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Pro Scope Ring 34mm High", type: "rings", manufacturer: "Vortex Optics", weight_oz: 6.0, msrp_cents: 17900, specs: { diameter: "34mm", height: "High", material: "Aluminum" }, discontinued: false },
  { name: "Vortex Pro Scope Ring 30mm Medium", type: "rings", manufacturer: "Vortex Optics", weight_oz: 5.0, msrp_cents: 14900, specs: { diameter: "30mm", height: "Medium", material: "Aluminum" }, discontinued: false },
  { name: "Vortex Precision Matched Rings 34mm High", type: "rings", manufacturer: "Vortex Optics", weight_oz: 6.5, msrp_cents: 24900, specs: { diameter: "34mm", height: "High", material: "Aluminum", matched: true }, discontinued: false },

  # =====================
  # NIGHTFORCE OPTICS
  # =====================
  { name: "Nightforce ATACR 7-35x56 F1 MOAR-T", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 38.0, msrp_cents: 399500, specs: { magnification: "7-35x", objective: "56mm", reticle: "MOAR-T", tube_diameter: "34mm", first_focal_plane: true, zero_stop: true }, discontinued: false },
  { name: "Nightforce ATACR 5-25x56 F1 Mil-XT", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 30.0, msrp_cents: 339500, specs: { magnification: "5-25x", objective: "56mm", reticle: "Mil-XT", tube_diameter: "34mm", first_focal_plane: true, zero_stop: true }, discontinued: false },
  { name: "Nightforce NX8 4-32x50 F1 MOAR", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 30.0, msrp_cents: 249500, specs: { magnification: "4-32x", objective: "50mm", reticle: "MOAR", tube_diameter: "30mm", first_focal_plane: true }, discontinued: false },
  { name: "Nightforce SHV 4-14x56 MOAR", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 28.0, msrp_cents: 129500, specs: { magnification: "4-14x", objective: "56mm", reticle: "MOAR", tube_diameter: "30mm" }, discontinued: false },
  { name: "Nightforce SHV 5-20x56 MOAR", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 30.0, msrp_cents: 144500, specs: { magnification: "5-20x", objective: "56mm", reticle: "MOAR", tube_diameter: "30mm" }, discontinued: false },
  { name: "Nightforce Competition 15-55x52 CTR-3", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 32.0, msrp_cents: 299500, specs: { magnification: "15-55x", objective: "52mm", reticle: "CTR-3", tube_diameter: "30mm", benchrest: true }, discontinued: false },
  { name: "Nightforce Ultralite 30mm Rings High", type: "rings", manufacturer: "Nightforce Optics", weight_oz: 4.0, msrp_cents: 19900, specs: { diameter: "30mm", height: "High", material: "Titanium" }, discontinued: false },
  { name: "Nightforce Ultralite 34mm Rings High", type: "rings", manufacturer: "Nightforce Optics", weight_oz: 4.5, msrp_cents: 24900, specs: { diameter: "34mm", height: "High", material: "Titanium" }, discontinued: false },
  { name: "Nightforce Unimount 34mm 20 MOA", type: "mount", manufacturer: "Nightforce Optics", weight_oz: 10.0, msrp_cents: 39500, specs: { diameter: "34mm", cant: "20 MOA", material: "Aluminum" }, discontinued: false },

  # =====================
  # LEUPOLD
  # =====================
  { name: "Leupold Mark 5HD 5-25x56 FFP Tremor 3", type: "scope", manufacturer: "Leupold", weight_oz: 30.0, msrp_cents: 279999, specs: { magnification: "5-25x", objective: "56mm", reticle: "Tremor 3", tube_diameter: "35mm", first_focal_plane: true }, discontinued: false },
  { name: "Leupold Mark 5HD 7-35x56 FFP Tremor 3", type: "scope", manufacturer: "Leupold", weight_oz: 32.0, msrp_cents: 309999, specs: { magnification: "7-35x", objective: "56mm", reticle: "Tremor 3", tube_diameter: "35mm", first_focal_plane: true }, discontinued: false },
  { name: "Leupold VX-Freedom 4-12x40 CDS Tri-MOA", type: "scope", manufacturer: "Leupold", weight_oz: 13.0, msrp_cents: 83758, specs: { magnification: "4-12x", objective: "40mm", reticle: "Tri-MOA", tube_diameter: "1 inch" }, discontinued: false },
  { name: "Leupold Mark 4 20 MOA Base Rem 700 SA", type: "mount", manufacturer: "Leupold", weight_oz: 2.5, msrp_cents: 8999, specs: { action: "Remington 700 SA", cant: "20 MOA" }, discontinued: false },
  { name: "Leupold Backcountry Cross-Slot Rings 30mm High", type: "rings", manufacturer: "Leupold", weight_oz: 4.0, msrp_cents: 14999, specs: { diameter: "30mm", height: "High", material: "Aluminum" }, discontinued: false },

  # =====================
  # KAHLES
  # =====================
  { name: "Kahles K525i 5-25x56 SKMR4", type: "scope", manufacturer: "Kahles", weight_oz: 34.0, msrp_cents: 329900, specs: { magnification: "5-25x", objective: "56mm", reticle: "SKMR4", tube_diameter: "34mm", first_focal_plane: true, made_in: "Austria" }, discontinued: false },
  { name: "Kahles K318i 3.5-18x50 MOAK", type: "scope", manufacturer: "Kahles", weight_oz: 27.0, msrp_cents: 279900, specs: { magnification: "3.5-18x", objective: "50mm", reticle: "MOAK", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Kahles K624i 6-24x56 SKMR", type: "scope", manufacturer: "Kahles", weight_oz: 28.0, msrp_cents: 289900, specs: { magnification: "6-24x", objective: "56mm", reticle: "SKMR", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },

  # =====================
  # ZERO COMPROMISE OPTICS
  # =====================
  { name: "ZCO ZC527 5-27x56 MPCT3", type: "scope", manufacturer: "Zero Compromise Optics", weight_oz: 36.0, msrp_cents: 399900, specs: { magnification: "5-27x", objective: "56mm", reticle: "MPCT3", tube_diameter: "36mm", first_focal_plane: true, made_in: "Austria" }, discontinued: false },
  { name: "ZCO ZC840 8-40x56 MPCT3", type: "scope", manufacturer: "Zero Compromise Optics", weight_oz: 38.0, msrp_cents: 459900, specs: { magnification: "8-40x", objective: "56mm", reticle: "MPCT3", tube_diameter: "36mm", first_focal_plane: true }, discontinued: false },

  # =====================
  # TANGENT THETA
  # =====================
  { name: "Tangent Theta TT525P 5-25x56 Gen 3 XR", type: "scope", manufacturer: "Tangent Theta", weight_oz: 38.0, msrp_cents: 479900, specs: { magnification: "5-25x", objective: "56mm", reticle: "Gen 3 XR", tube_diameter: "34mm", first_focal_plane: true, made_in: "Canada" }, discontinued: false },
  { name: "Tangent Theta TT315M 3-15x50", type: "scope", manufacturer: "Tangent Theta", weight_oz: 32.0, msrp_cents: 399900, specs: { magnification: "3-15x", objective: "50mm", tube_diameter: "30mm", first_focal_plane: true, made_in: "Canada" }, discontinued: false },

  # =====================
  # ATLAS BIPODS
  # =====================
  { name: "Atlas BT46-LW17 PSR Bipod", type: "bipod", manufacturer: "Atlas Bipods", weight_oz: 12.0, msrp_cents: 29900, specs: { height: "4.75-9 inches", legs: "5 positions", material: "Aluminum", mount: "Picatinny" }, discontinued: false },
  { name: "Atlas BT47-LW17 PSR Bipod", type: "bipod", manufacturer: "Atlas Bipods", weight_oz: 14.0, msrp_cents: 33900, specs: { height: "5.5-13 inches", legs: "5 positions", material: "Aluminum", mount: "Picatinny" }, discontinued: false },
  { name: "Atlas CAL Bipod BT19 Gen 2", type: "bipod", manufacturer: "Atlas Bipods", weight_oz: 10.0, msrp_cents: 26900, specs: { height: "4.25-8.5 inches", legs: "5 positions", material: "Aluminum", mount: "Picatinny" }, discontinued: false },
  { name: "Atlas Super CAL Bipod BT65", type: "bipod", manufacturer: "Atlas Bipods", weight_oz: 18.0, msrp_cents: 44900, specs: { height: "5.5-13 inches", legs: "5 positions", material: "Aluminum", mount: "ARCA" }, discontinued: false },

  # =====================
  # HARRIS BIPODS
  # =====================
  { name: "Harris S-BRM Bipod 6-9\"", type: "bipod", manufacturer: "Harris Bipods", weight_oz: 10.0, msrp_cents: 11900, specs: { height: "6-9 inches", legs: "Notched", material: "Steel" }, discontinued: false },
  { name: "Harris LM-S Bipod 9-13\"", type: "bipod", manufacturer: "Harris Bipods", weight_oz: 14.0, msrp_cents: 12900, specs: { height: "9-13 inches", legs: "Notched", material: "Steel" }, discontinued: false },
  { name: "Harris 1A2-BRM Bipod 6-9\" Picatinny", type: "bipod", manufacturer: "Harris Bipods", weight_oz: 12.0, msrp_cents: 14900, specs: { height: "6-9 inches", mount: "Picatinny", material: "Steel" }, discontinued: false },

  # =====================
  # RYDR INDUSTRIES
  # =====================
  { name: "RYDR-9 Match Carbon Fiber Bipod ARCA/Pic", type: "bipod", manufacturer: "RYDR Industries", weight_oz: 9.0, msrp_cents: 43499, specs: { height: "5-9 inches", material: "Carbon Fiber", mount: "ARCA/Picatinny", made_in: "Canada" }, discontinued: false },
  { name: "RYDR-9 Hunter Carbon Fiber Bipod", type: "bipod", manufacturer: "RYDR Industries", weight_oz: 7.5, msrp_cents: 39999, specs: { height: "5-9 inches", material: "Carbon Fiber", hunting: true, made_in: "Canada" }, discontinued: false },

  # =====================
  # KRG (KINETIC RESEARCH GROUP)
  # =====================
  { name: "KRG Bravo Chassis - Remington 700", type: "chassis", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 48.0, msrp_cents: 39900, specs: { action_compatibility: [ "Remington 700 SA" ], material: "Polymer/Aluminum", color: "Black" }, discontinued: false },
  { name: "KRG Bravo Chassis - Tikka T3x", type: "chassis", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 48.0, msrp_cents: 39900, specs: { action_compatibility: [ "Tikka T3x" ], material: "Polymer/Aluminum", color: "FDE" }, discontinued: false },
  { name: "KRG Whiskey-3 Chassis - Remington 700", type: "chassis", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 72.0, msrp_cents: 89900, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum", color: "Black", folding_stock: true }, discontinued: false },
  { name: "KRG Whiskey-3 Chassis - Tikka T3x", type: "chassis", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 72.0, msrp_cents: 89900, specs: { action_compatibility: [ "Tikka T3x" ], material: "Aluminum", folding_stock: true }, discontinued: false },
  { name: "KRG X-Ray Chassis", type: "chassis", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 58.0, msrp_cents: 44900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x" ], material: "Polymer/Aluminum" }, discontinued: false },
  { name: "KRG SV Folder", type: "stock", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 24.0, msrp_cents: 44900, specs: { material: "Polymer", folding: true, adjustable_lop: true }, discontinued: false },

  # =====================
  # MPA (MASTERPIECE ARMS)
  # =====================
  { name: "MPA BA Competition Chassis", type: "chassis", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 80.0, msrp_cents: 129900, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum", arca_rail: true, barricade_stop: true }, discontinued: false },
  { name: "MPA BA Hybrid Chassis", type: "chassis", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 68.0, msrp_cents: 99900, specs: { action_compatibility: [ "Remington 700", "Tikka T3x" ], material: "Aluminum", hybrid: true }, discontinued: false },
  { name: "MPA Matrix Chassis", type: "chassis", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 64.0, msrp_cents: 84900, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum" }, discontinued: false },
  { name: "MPA Enhanced Vertical Grip", type: "grip", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 4.5, msrp_cents: 8900, specs: { material: "Aluminum", color: "Black" }, discontinued: false },

  # =====================
  # SPUHR
  # =====================
  { name: "Spuhr ISMS SP-4602 34mm 0 MOA", type: "mount", manufacturer: "Spuhr", weight_oz: 11.0, msrp_cents: 47500, specs: { diameter: "34mm", cant: "0 MOA", material: "Aluminum", made_in: "Sweden" }, discontinued: false },
  { name: "Spuhr ISMS SP-4603 34mm 6 MIL", type: "mount", manufacturer: "Spuhr", weight_oz: 11.0, msrp_cents: 47500, specs: { diameter: "34mm", cant: "6 MIL (20.6 MOA)", material: "Aluminum" }, discontinued: false },
  { name: "Spuhr ISMS SP-3602 30mm 0 MOA", type: "mount", manufacturer: "Spuhr", weight_oz: 10.0, msrp_cents: 44500, specs: { diameter: "30mm", cant: "0 MOA", material: "Aluminum" }, discontinued: false },
  { name: "Spuhr ISMS SP-5602 35mm 0 MOA", type: "mount", manufacturer: "Spuhr", weight_oz: 12.0, msrp_cents: 49500, specs: { diameter: "35mm", cant: "0 MOA", material: "Aluminum", for_leupold_mark5: true }, discontinued: false },
  { name: "Spuhr ISMS SP-7602 36mm 0 MOA", type: "mount", manufacturer: "Spuhr", weight_oz: 12.0, msrp_cents: 52500, specs: { diameter: "36mm", cant: "0 MOA", material: "Aluminum", for_zco: true }, discontinued: false },

  # =====================
  # BADGER ORDNANCE
  # =====================
  { name: "Badger Ordnance Condition One Mount 34mm 20 MOA", type: "mount", manufacturer: "Badger Ordnance", weight_oz: 9.0, msrp_cents: 36500, specs: { diameter: "34mm", cant: "20 MOA", material: "Aluminum", color: "Black" }, discontinued: false },
  { name: "Badger Ordnance Condition One Mount 34mm 0 MOA", type: "mount", manufacturer: "Badger Ordnance", weight_oz: 9.0, msrp_cents: 36500, specs: { diameter: "34mm", cant: "0 MOA", material: "Aluminum" }, discontinued: false },
  { name: "Badger Ordnance Condition One Mount 30mm 20 MOA", type: "mount", manufacturer: "Badger Ordnance", weight_oz: 8.0, msrp_cents: 33500, specs: { diameter: "30mm", cant: "20 MOA" }, discontinued: false },
  { name: "Badger Ordnance J-ARM with RMR Plate", type: "mount", manufacturer: "Badger Ordnance", weight_oz: 2.5, msrp_cents: 10900, specs: { type: "Accessory Mount", compatible: "Condition One", for: "RMR" }, discontinued: false },

  # =====================
  # TIMNEY TRIGGERS
  # =====================
  { name: "Timney Elite Hunter - Remington 700", type: "trigger", manufacturer: "Timney Triggers", weight_oz: 3.0, msrp_cents: 17900, specs: { action_compatibility: "Remington 700", pull_weight: "1.5-4lbs", adjustable: true }, discontinued: false },
  { name: "Timney Calvin Elite - Remington 700", type: "trigger", manufacturer: "Timney Triggers", weight_oz: 3.2, msrp_cents: 28900, specs: { action_compatibility: "Remington 700", pull_weight: "8oz-2.5lbs", adjustable: true, two_stage: true }, discontinued: false },
  { name: "Timney Trigger - Tikka T3x", type: "trigger", manufacturer: "Timney Triggers", weight_oz: 3.0, msrp_cents: 14900, specs: { action_compatibility: "Tikka T3x", pull_weight: "1.5-4lbs" }, discontinued: false },

  # =====================
  # BIX'N ANDY
  # =====================
  { name: "Bix'n Andy TacSport Pro - Remington 700", type: "trigger", manufacturer: "Bix'n Andy", weight_oz: 3.5, msrp_cents: 49900, specs: { action_compatibility: "Remington 700", pull_weight: "50g-1000g", two_stage: true, made_in: "Austria" }, discontinued: false },
  { name: "Bix'n Andy TacSport - Tikka T3x", type: "trigger", manufacturer: "Bix'n Andy", weight_oz: 3.5, msrp_cents: 42900, specs: { action_compatibility: "Tikka T3x", pull_weight: "50g-1000g", two_stage: true }, discontinued: false },
  { name: "Bix'n Andy Dakota - Remington 700", type: "trigger", manufacturer: "Bix'n Andy", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Remington 700", pull_weight: "100g-800g" }, discontinued: false },

  # =====================
  # BARTLEIN BARRELS
  # =====================
  { name: "Bartlein Heavy Palma 6.5mm 1:8 30\"", type: "barrel", manufacturer: "Bartlein Barrels", weight_oz: 80.0, msrp_cents: 52500, specs: { caliber: "6.5mm", twist: "1:8", length: "30 inches", contour: "Heavy Palma", cut_rifled: true }, discontinued: false },
  { name: "Bartlein M24 .308 1:10 26\"", type: "barrel", manufacturer: "Bartlein Barrels", weight_oz: 72.0, msrp_cents: 48500, specs: { caliber: ".308", twist: "1:10", length: "26 inches", contour: "M24", cut_rifled: true }, discontinued: false },
  { name: "Bartlein MTU 6mm 1:7.5 28\"", type: "barrel", manufacturer: "Bartlein Barrels", weight_oz: 64.0, msrp_cents: 49500, specs: { caliber: "6mm", twist: "1:7.5", length: "28 inches", contour: "MTU", cut_rifled: true }, discontinued: false },
  { name: "Bartlein Heavy Varmint .224 1:8 24\"", type: "barrel", manufacturer: "Bartlein Barrels", weight_oz: 56.0, msrp_cents: 42500, specs: { caliber: ".224", twist: "1:8", length: "24 inches", contour: "Heavy Varmint", cut_rifled: true }, discontinued: false },

  # =====================
  # KRIEGER BARRELS
  # =====================
  { name: "Krieger Heavy Palma 6.5mm 1:8 28\"", type: "barrel", manufacturer: "Krieger Barrels", weight_oz: 76.0, msrp_cents: 48500, specs: { caliber: "6.5mm", twist: "1:8", length: "28 inches", contour: "Heavy Palma", cut_rifled: true }, discontinued: false },
  { name: "Krieger MTU .308 1:10 26\"", type: "barrel", manufacturer: "Krieger Barrels", weight_oz: 68.0, msrp_cents: 44500, specs: { caliber: ".308", twist: "1:10", length: "26 inches", contour: "MTU", cut_rifled: true }, discontinued: false },
  { name: "Krieger M40 .308 1:11.25 24\"", type: "barrel", manufacturer: "Krieger Barrels", weight_oz: 64.0, msrp_cents: 42500, specs: { caliber: ".308", twist: "1:11.25", length: "24 inches", contour: "M40" }, discontinued: false },

  # =====================
  # PROOF RESEARCH
  # =====================
  { name: "Proof Research Carbon Fiber Sendero 6.5 Creedmoor 26\"", type: "barrel", manufacturer: "Proof Research", weight_oz: 32.0, msrp_cents: 89900, specs: { caliber: "6.5 Creedmoor", twist: "1:8", length: "26 inches", contour: "Sendero", carbon_fiber: true }, discontinued: false },
  { name: "Proof Research Carbon Fiber MTU .308 24\"", type: "barrel", manufacturer: "Proof Research", weight_oz: 36.0, msrp_cents: 94900, specs: { caliber: ".308", twist: "1:10", length: "24 inches", contour: "MTU", carbon_fiber: true }, discontinued: false },
  { name: "Proof Research Carbon Fiber Light Palma 6mm 28\"", type: "barrel", manufacturer: "Proof Research", weight_oz: 28.0, msrp_cents: 99900, specs: { caliber: "6mm", twist: "1:7.5", length: "28 inches", carbon_fiber: true, hunting: true }, discontinued: false },

  # =====================
  # ACTIONS
  # =====================
  { name: "Bighorn Origin Short Action", type: "action", manufacturer: "Bighorn Arms", weight_oz: 42.0, msrp_cents: 119900, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel", trigger_compatible: "Remington 700" }, discontinued: false },
  { name: "Bighorn TL3 Short Action", type: "action", manufacturer: "Bighorn Arms", weight_oz: 38.0, msrp_cents: 129900, specs: { action_length: "Short", bolt_face: ".473", three_lug: true }, discontinued: false },
  { name: "Defiance Deviant Tactical Short Action", type: "action", manufacturer: "Defiance Machine", weight_oz: 44.0, msrp_cents: 139900, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel", integral_lug: true }, discontinued: false },
  { name: "Defiance Tenacity Long Action", type: "action", manufacturer: "Defiance Machine", weight_oz: 48.0, msrp_cents: 119900, specs: { action_length: "Long", bolt_face: ".532", material: "Stainless Steel" }, discontinued: false },
  { name: "Lone Peak Razor Short Action", type: "action", manufacturer: "Lone Peak Arms", weight_oz: 40.0, msrp_cents: 109900, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel" }, discontinued: false },
  { name: "Impact Precision 737R", type: "action", manufacturer: "Impact Precision", weight_oz: 44.0, msrp_cents: 149900, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel", fluted_bolt: true }, discontinued: false },
  { name: "Curtis Axiom Short Action", type: "action", manufacturer: "Curtis Custom", weight_oz: 42.0, msrp_cents: 189900, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel", spiral_fluted: true }, discontinued: false },
  { name: "ARC Nucleus Short Action", type: "action", manufacturer: "Nucleus", weight_oz: 38.0, msrp_cents: 99500, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel", modular: true }, discontinued: false },

  # =====================
  # MANNERS STOCKS
  # =====================
  { name: "Manners PRS2 Carbon Stock - Remington 700 SA", type: "stock", manufacturer: "Manners Composite Stocks", weight_oz: 48.0, msrp_cents: 89900, specs: { action_inlet: "Remington 700 SA", material: "Carbon Fiber", mini_chassis: true, adjustable_cheek: true }, discontinued: false },
  { name: "Manners EH1A Carbon Stock", type: "stock", manufacturer: "Manners Composite Stocks", weight_oz: 32.0, msrp_cents: 74900, specs: { action_inlet: "Remington 700 SA", material: "Carbon Fiber", hunting: true }, discontinued: false },
  { name: "Manners MCS-T Elite Tac", type: "stock", manufacturer: "Manners Composite Stocks", weight_oz: 56.0, msrp_cents: 99900, specs: { action_inlet: "Remington 700", material: "Carbon Fiber", folding: true }, discontinued: false },

  # =====================
  # MCMILLAN
  # =====================
  { name: "McMillan A5 Stock - Remington 700 SA", type: "stock", manufacturer: "McMillan", weight_oz: 52.0, msrp_cents: 79900, specs: { action_inlet: "Remington 700 SA", material: "Fiberglass", adjustable_cheek: true }, discontinued: false },
  { name: "McMillan A3-5 Adjustable Stock", type: "stock", manufacturer: "McMillan", weight_oz: 56.0, msrp_cents: 89900, specs: { action_inlet: "Remington 700", material: "Fiberglass", adjustable_cheek: true, adjustable_lop: true }, discontinued: false },
  { name: "McMillan Game Scout Stock", type: "stock", manufacturer: "McMillan", weight_oz: 28.0, msrp_cents: 54900, specs: { action_inlet: "Remington 700 SA", material: "Fiberglass", hunting: true }, discontinued: false },

  # =====================
  # ACCURACY INTERNATIONAL
  # =====================
  { name: "Accuracy International AXSR Chassis", type: "chassis", manufacturer: "Accuracy International", weight_oz: 192.0, msrp_cents: 699900, specs: { caliber: "Multi-Caliber", folding_stock: true, made_in: "UK" }, discontinued: false },
  { name: "Accuracy International AT-X Chassis", type: "chassis", manufacturer: "Accuracy International", weight_oz: 128.0, msrp_cents: 399900, specs: { action_compatibility: [ "Remington 700" ], made_in: "UK", folding_stock: true }, discontinued: false },

  # =====================
  # ATHLON OPTICS
  # =====================
  { name: "Athlon Cronus BTR 4.5-29x56 APLR3 FFP", type: "scope", manufacturer: "Athlon Optics", weight_oz: 37.0, msrp_cents: 179999, specs: { magnification: "4.5-29x", objective: "56mm", reticle: "APLR3 FFP MIL", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Athlon Ares ETR 4.5-30x56 APLR2 FFP", type: "scope", manufacturer: "Athlon Optics", weight_oz: 34.0, msrp_cents: 139999, specs: { magnification: "4.5-30x", objective: "56mm", reticle: "APLR2 FFP MIL", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Athlon Midas TAC 6-24x50 APRS6 FFP", type: "scope", manufacturer: "Athlon Optics", weight_oz: 28.0, msrp_cents: 59999, specs: { magnification: "6-24x", objective: "50mm", reticle: "APRS6 FFP MIL", tube_diameter: "30mm", first_focal_plane: true }, discontinued: false },
  { name: "Athlon Argos BTR Gen 2 6-24x50 APMR FFP", type: "scope", manufacturer: "Athlon Optics", weight_oz: 26.0, msrp_cents: 39999, specs: { magnification: "6-24x", objective: "50mm", reticle: "APMR FFP MIL", tube_diameter: "30mm", first_focal_plane: true }, discontinued: false },

  # =====================
  # PRIMARY ARMS
  # =====================
  { name: "Primary Arms GLx 6-24x50 FFP ATHENA BPR MIL", type: "scope", manufacturer: "Primary Arms", weight_oz: 27.0, msrp_cents: 79999, specs: { magnification: "6-24x", objective: "50mm", reticle: "ATHENA BPR MIL", tube_diameter: "30mm", first_focal_plane: true }, discontinued: false },
  { name: "Primary Arms SLx 4-14x44 FFP ACSS HUD DMR", type: "scope", manufacturer: "Primary Arms", weight_oz: 21.0, msrp_cents: 34999, specs: { magnification: "4-14x", objective: "44mm", reticle: "ACSS HUD DMR 308", tube_diameter: "30mm", first_focal_plane: true }, discontinued: false },

  # =====================
  # GARMIN / MAGNETOSPEED / LABRADAR
  # =====================
  { name: "Garmin Xero C1 Pro Chronograph", type: "other", manufacturer: "Garmin", weight_oz: 6.0, msrp_cents: 69900, specs: { type: "Chronograph", wireless: true, app_compatible: true }, discontinued: false },
  { name: "Garmin Xero C2 Chronograph", type: "other", manufacturer: "Garmin", weight_oz: 5.0, msrp_cents: 97999, specs: { type: "Chronograph", wireless: true, app_compatible: true, gen2: true }, discontinued: false },
  { name: "MagnetoSpeed V3 Chronograph", type: "other", manufacturer: "MagnetoSpeed", weight_oz: 8.0, msrp_cents: 37900, specs: { type: "Chronograph", barrel_mounted: true }, discontinued: false },
  { name: "MagnetoSpeed Sporter Chronograph", type: "other", manufacturer: "MagnetoSpeed", weight_oz: 6.0, msrp_cents: 17900, specs: { type: "Chronograph", barrel_mounted: true, entry_level: true }, discontinued: false },
  { name: "LabRadar Chronograph", type: "other", manufacturer: "LabRadar", weight_oz: 32.0, msrp_cents: 55000, specs: { type: "Chronograph", doppler_radar: true, downrange_velocity: true }, discontinued: false },

  # =====================
  # SUPPRESSORS / MUZZLE DEVICES
  # =====================
  { name: "Thunderbeast Ultra 9 Suppressor", type: "muzzle_device", manufacturer: "Thunderbeast Arms", weight_oz: 11.0, msrp_cents: 109500, specs: { caliber: ".30", length: "9 inches", material: "Titanium", suppressor: true }, discontinued: false },
  { name: "Thunderbeast Ultra 7 Suppressor", type: "muzzle_device", manufacturer: "Thunderbeast Arms", weight_oz: 8.5, msrp_cents: 99500, specs: { caliber: ".30", length: "7 inches", material: "Titanium", suppressor: true }, discontinued: false },
  { name: "Dead Air Nomad 30 Suppressor", type: "muzzle_device", manufacturer: "Dead Air Armament", weight_oz: 14.0, msrp_cents: 89900, specs: { caliber: ".30", material: "Stellite/Titanium", suppressor: true }, discontinued: false },
  { name: "SilencerCo Omega 300 Suppressor", type: "muzzle_device", manufacturer: "SilencerCo", weight_oz: 14.0, msrp_cents: 107900, specs: { caliber: ".300 WM", material: "Titanium", suppressor: true }, discontinued: false },
  { name: "Without Warning CHAD Self-Timing Brake 6.5mm", type: "muzzle_device", manufacturer: "Without Warning", weight_oz: 4.5, msrp_cents: 19500, specs: { caliber: "6.5mm", thread: "5/8x24", self_timing: true }, discontinued: false },
  { name: "Without Warning CHAD Self-Timing Brake .30 Cal", type: "muzzle_device", manufacturer: "Without Warning", weight_oz: 5.0, msrp_cents: 19500, specs: { caliber: ".30", thread: "5/8x24", self_timing: true }, discontinued: false },
  { name: "Salmon River Solutions SRS SS Pro 5 Brake 6mm", type: "muzzle_device", manufacturer: "Salmon River Solutions", weight_oz: 5.5, msrp_cents: 32899, specs: { caliber: "6mm", thread: "5/8x24", self_timing: true, ports: 5 }, discontinued: false },
  { name: "Salmon River Solutions SRS Hunters Rail Long 11.5\"", type: "mount", manufacturer: "Salmon River Solutions", weight_oz: 4.0, msrp_cents: 13799, specs: { length: "11.5 inches", pattern: "ARCA" }, discontinued: false },
  { name: "Salmon River Solutions SRS ARCA & Pic Rail 4.7\"", type: "mount", manufacturer: "Salmon River Solutions", weight_oz: 2.5, msrp_cents: 9900, specs: { length: "4.7 inches", pattern: "ARCA/Picatinny" }, discontinued: false },

  # =====================
  # WARNE
  # =====================
  { name: "Warne HyperLite Scope Rings 30mm Medium", type: "rings", manufacturer: "Warne", weight_oz: 3.0, msrp_cents: 14999, specs: { diameter: "30mm", height: "Medium", material: "Aluminum" }, discontinued: false },
  { name: "Warne HyperLite Scope Rings 30mm Low", type: "rings", manufacturer: "Warne", weight_oz: 2.8, msrp_cents: 14999, specs: { diameter: "30mm", height: "Low", material: "Aluminum" }, discontinued: false },
  { name: "Warne Vapor Horizontal Rings 1\" Medium", type: "rings", manufacturer: "Warne", weight_oz: 2.5, msrp_cents: 4999, specs: { diameter: "1 inch", height: "Medium", material: "Aluminum" }, discontinued: false },
  { name: "Warne M902/876M Remington 700 2PC Base Set", type: "mount", manufacturer: "Warne", weight_oz: 2.0, msrp_cents: 4999, specs: { action: "Remington 700", type: "2-Piece Base" }, discontinued: false },
  { name: "Warne Vapor V490-15MOA Ruger 10/22 Picatinny Rail", type: "mount", manufacturer: "Warne", weight_oz: 1.5, msrp_cents: 5994, specs: { action: "Ruger 10/22", cant: "15 MOA" }, discontinued: false },
  { name: "Warne Vapor Bipod - Pic Rail Interface", type: "bipod", manufacturer: "Warne", weight_oz: 8.0, msrp_cents: 13499, specs: { height: "6-9 inches", mount: "Picatinny", material: "Aluminum" }, discontinued: false },

  # =====================
  # SHOOTING BAGS & GEAR
  # =====================
  { name: "Wiebad Mini Fortune Cookie", type: "other", manufacturer: "Wiebad", weight_oz: 8.0, msrp_cents: 4500, specs: { type: "Shooting Bag", fill: "Waxed Canvas", size: "Small" }, discontinued: false },
  { name: "Wiebad Fortune Cookie", type: "other", manufacturer: "Wiebad", weight_oz: 12.0, msrp_cents: 5500, specs: { type: "Shooting Bag", fill: "Waxed Canvas", size: "Standard" }, discontinued: false },
  { name: "Wiebad Tac Pad", type: "other", manufacturer: "Wiebad", weight_oz: 10.0, msrp_cents: 6500, specs: { type: "Shooting Pad", material: "Waxed Canvas" }, discontinued: false },
  { name: "Tab Gear Rear Squeeze Bag", type: "other", manufacturer: "Tab Gear", weight_oz: 6.0, msrp_cents: 3500, specs: { type: "Shooting Bag", position: "Rear" }, discontinued: false },
  { name: "Armageddon Gear Precision Rifle Sling", type: "other", manufacturer: "Armageddon Gear", weight_oz: 4.0, msrp_cents: 6900, specs: { type: "Sling", material: "Nylon", quick_adjust: true }, discontinued: false },
  { name: "Armageddon Gear Game Changer Bag", type: "other", manufacturer: "Armageddon Gear", weight_oz: 14.0, msrp_cents: 8900, specs: { type: "Shooting Bag", fill: "Synthetic", versatile: true }, discontinued: false },
  { name: "Cole-TAC HTP Suppressor Cover", type: "other", manufacturer: "Cole-TAC", weight_oz: 3.0, msrp_cents: 8900, specs: { type: "Suppressor Cover", material: "Fabric/Silicone", heat_resistant: true }, discontinued: false },
  { name: "Cole-TAC Corset Suppressor Cover", type: "other", manufacturer: "Cole-TAC", weight_oz: 4.0, msrp_cents: 11900, specs: { type: "Suppressor Cover", material: "Fabric", lace_up: true }, discontinued: false },

  # =====================
  # XLR INDUSTRIES
  # =====================
  { name: "XLR Element 3.0 Chassis - Remington 700 SA", type: "chassis", manufacturer: "XLR Industries", weight_oz: 72.0, msrp_cents: 62500, specs: { action_compatibility: [ "Remington 700 SA" ], material: "Aluminum", arca_rail: true }, discontinued: false },
  { name: "XLR Element 3.0 Chassis - Tikka T3x", type: "chassis", manufacturer: "XLR Industries", weight_oz: 72.0, msrp_cents: 62500, specs: { action_compatibility: [ "Tikka T3x" ], material: "Aluminum", arca_rail: true }, discontinued: false },
  { name: "XLR Envy Pro Chassis", type: "chassis", manufacturer: "XLR Industries", weight_oz: 80.0, msrp_cents: 99500, specs: { action_compatibility: [ "Remington 700" ], material: "Aluminum", folding_stock: true }, discontinued: false },
  { name: "XLR Tactical Buttstock", type: "stock", manufacturer: "XLR Industries", weight_oz: 20.0, msrp_cents: 29900, specs: { material: "Aluminum", adjustable_lop: true, adjustable_cheek: true }, discontinued: false },

  # =====================
  # FOUNDATION STOCKS
  # =====================
  { name: "Foundation Exodus Stock - Remington 700 SA", type: "stock", manufacturer: "Foundation Stocks", weight_oz: 44.0, msrp_cents: 89900, specs: { action_inlet: "Remington 700 SA", material: "Carbon Fiber Composite", made_in: "USA" }, discontinued: false },
  { name: "Foundation Genesis II Stock - Remington 700 SA", type: "stock", manufacturer: "Foundation Stocks", weight_oz: 48.0, msrp_cents: 99900, specs: { action_inlet: "Remington 700 SA", material: "Carbon Fiber Composite", adjustable_cheek: true }, discontinued: false },

  # =====================
  # GRAYBOE STOCKS
  # =====================
  { name: "Grayboe Renegade Stock - Remington 700 SA", type: "stock", manufacturer: "Grayboe", weight_oz: 40.0, msrp_cents: 42900, specs: { action_inlet: "Remington 700 SA", material: "Fiberglass", mini_chassis: true }, discontinued: false },
  { name: "Grayboe Ridgeback Stock - Remington 700 SA", type: "stock", manufacturer: "Grayboe", weight_oz: 48.0, msrp_cents: 47900, specs: { action_inlet: "Remington 700 SA", material: "Fiberglass", adjustable_cheek: true }, discontinued: false },
  { name: "Grayboe Phoenix Stock - Tikka T3x", type: "stock", manufacturer: "Grayboe", weight_oz: 36.0, msrp_cents: 39900, specs: { action_inlet: "Tikka T3x", material: "Fiberglass", hunting: true }, discontinued: false },

  # =====================
  # SCHMIDT & BENDER
  # =====================
  { name: "Schmidt & Bender PM II 5-25x56 P4FL", type: "scope", manufacturer: "Schmidt & Bender", weight_oz: 34.0, msrp_cents: 449900, specs: { magnification: "5-25x", objective: "56mm", reticle: "P4FL", tube_diameter: "34mm", first_focal_plane: true, made_in: "Germany" }, discontinued: false },
  { name: "Schmidt & Bender PM II 5-25x56 MSR2", type: "scope", manufacturer: "Schmidt & Bender", weight_oz: 34.0, msrp_cents: 469900, specs: { magnification: "5-25x", objective: "56mm", reticle: "MSR2", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Schmidt & Bender PM II 3-27x56 High Power", type: "scope", manufacturer: "Schmidt & Bender", weight_oz: 36.0, msrp_cents: 489900, specs: { magnification: "3-27x", objective: "56mm", reticle: "P4FL2", tube_diameter: "34mm" }, discontinued: false },
  { name: "Schmidt & Bender PM II 12-50x56 P4F2", type: "scope", manufacturer: "Schmidt & Bender", weight_oz: 38.0, msrp_cents: 399900, specs: { magnification: "12-50x", objective: "56mm", reticle: "P4F2", tube_diameter: "34mm", benchrest: true }, discontinued: false },

  # =====================
  # ZEISS
  # =====================
  { name: "Zeiss LRP S5 5-25x56 ZF-MRi", type: "scope", manufacturer: "Zeiss", weight_oz: 33.0, msrp_cents: 329900, specs: { magnification: "5-25x", objective: "56mm", reticle: "ZF-MRi", tube_diameter: "34mm", first_focal_plane: true, made_in: "Germany" }, discontinued: false },
  { name: "Zeiss LRP S3 6-36x56 ZF-MRi", type: "scope", manufacturer: "Zeiss", weight_oz: 35.0, msrp_cents: 349900, specs: { magnification: "6-36x", objective: "56mm", reticle: "ZF-MRi", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Zeiss Conquest V4 6-24x50 ZMOAi-1", type: "scope", manufacturer: "Zeiss", weight_oz: 23.0, msrp_cents: 179900, specs: { magnification: "6-24x", objective: "50mm", reticle: "ZMOAi-1", tube_diameter: "30mm" }, discontinued: false },
  { name: "Zeiss V8 4.8-35x60 ASV+ Mil-Dot", type: "scope", manufacturer: "Zeiss", weight_oz: 34.0, msrp_cents: 499900, specs: { magnification: "4.8-35x", objective: "60mm", reticle: "Mil-Dot", tube_diameter: "36mm" }, discontinued: false },

  # =====================
  # MORE ACTIONS
  # =====================
  { name: "Kelbly Atlas Tactical Short Action", type: "action", manufacturer: "Kelbly's", weight_oz: 40.0, msrp_cents: 109900, specs: { action_length: "Short", bolt_face: ".473", material: "Stainless Steel" }, discontinued: false },
  { name: "Kelbly Panda Benchrest Action", type: "action", manufacturer: "Kelbly's", weight_oz: 36.0, msrp_cents: 139900, specs: { action_length: "Short", benchrest: true, port: "Right" }, discontinued: false },
  { name: "Stiller TAC 300 Short Action", type: "action", manufacturer: "Stiller Actions", weight_oz: 44.0, msrp_cents: 129900, specs: { action_length: "Short", bolt_face: ".473", tactical: true }, discontinued: false },
  { name: "Stiller Predator Short Action", type: "action", manufacturer: "Stiller Actions", weight_oz: 38.0, msrp_cents: 99900, specs: { action_length: "Short", bolt_face: ".473", hunting: true }, discontinued: false },

  # =====================
  # MORE BARRELS
  # =====================
  { name: "Hawk Hill Custom 6.5mm 1:8 MTU 26\"", type: "barrel", manufacturer: "Hawk Hill Custom", weight_oz: 68.0, msrp_cents: 49500, specs: { caliber: "6.5mm", twist: "1:8", length: "26 inches", contour: "MTU", cut_rifled: true }, discontinued: false },
  { name: "Hawk Hill Custom 6mm 1:7.5 Heavy Palma 28\"", type: "barrel", manufacturer: "Hawk Hill Custom", weight_oz: 76.0, msrp_cents: 52500, specs: { caliber: "6mm", twist: "1:7.5", length: "28 inches", contour: "Heavy Palma" }, discontinued: false },
  { name: "Preferred Barrel Blanks 6.5mm 1:8 M24 28\"", type: "barrel", manufacturer: "Preferred Barrel Blanks", weight_oz: 72.0, msrp_cents: 37500, specs: { caliber: "6.5mm", twist: "1:8", length: "28 inches", contour: "M24" }, discontinued: false },
  { name: "Benchmark Barrels .308 1:10 Heavy Varmint 24\"", type: "barrel", manufacturer: "Benchmark Barrels", weight_oz: 58.0, msrp_cents: 32500, specs: { caliber: ".308", twist: "1:10", length: "24 inches", contour: "Heavy Varmint" }, discontinued: false },
  { name: "Benchmark Barrels 6mm 1:8 Light Palma 27\"", type: "barrel", manufacturer: "Benchmark Barrels", weight_oz: 52.0, msrp_cents: 34500, specs: { caliber: "6mm", twist: "1:8", length: "27 inches", contour: "Light Palma" }, discontinued: false },
  { name: "X-Caliber .308 Win 1:10 Sporter 22\"", type: "barrel", manufacturer: "X-Caliber", weight_oz: 42.0, msrp_cents: 24900, specs: { caliber: ".308", twist: "1:10", length: "22 inches", contour: "Sporter" }, discontinued: false },
  { name: "Lilja 6.5mm 1:8 3-Groove 26\"", type: "barrel", manufacturer: "Lilja Barrels", weight_oz: 64.0, msrp_cents: 42500, specs: { caliber: "6.5mm", twist: "1:8", length: "26 inches", grooves: 3 }, discontinued: false },
  { name: "Lilja .224 1:7 4-Groove 24\"", type: "barrel", manufacturer: "Lilja Barrels", weight_oz: 48.0, msrp_cents: 38500, specs: { caliber: ".224", twist: "1:7", length: "24 inches", grooves: 4 }, discontinued: false },

  # =====================
  # ERA-TAC MOUNTS
  # =====================
  { name: "ERA-TAC Gen 2 One-Piece Mount 34mm 20 MOA", type: "mount", manufacturer: "ERA-TAC", weight_oz: 10.0, msrp_cents: 44900, specs: { diameter: "34mm", cant: "20 MOA", material: "Aluminum", made_in: "Germany" }, discontinued: false },
  { name: "ERA-TAC Gen 2 One-Piece Mount 34mm 0 MOA", type: "mount", manufacturer: "ERA-TAC", weight_oz: 10.0, msrp_cents: 44900, specs: { diameter: "34mm", cant: "0 MOA", material: "Aluminum" }, discontinued: false },
  { name: "ERA-TAC Adjustable Inclination Mount 34mm", type: "mount", manufacturer: "ERA-TAC", weight_oz: 14.0, msrp_cents: 69900, specs: { diameter: "34mm", adjustable_cant: true, range: "0-50 MOA" }, discontinued: false },
  { name: "ERA-TAC Ultralight Mount 30mm 20 MOA", type: "mount", manufacturer: "ERA-TAC", weight_oz: 7.0, msrp_cents: 39900, specs: { diameter: "30mm", cant: "20 MOA", material: "Aluminum" }, discontinued: false },

  # =====================
  # SEEKINS PRECISION
  # =====================
  { name: "Seekins Precision MXM Mount 34mm 20 MOA", type: "mount", manufacturer: "Seekins Precision", weight_oz: 9.0, msrp_cents: 32500, specs: { diameter: "34mm", cant: "20 MOA", material: "Aluminum" }, discontinued: false },
  { name: "Seekins Precision Scope Rings 34mm High", type: "rings", manufacturer: "Seekins Precision", weight_oz: 5.0, msrp_cents: 16900, specs: { diameter: "34mm", height: "High", material: "Aluminum" }, discontinued: false },
  { name: "Seekins Precision Scope Rings 30mm Medium", type: "rings", manufacturer: "Seekins Precision", weight_oz: 4.5, msrp_cents: 14900, specs: { diameter: "30mm", height: "Medium", material: "Aluminum" }, discontinued: false },
  { name: "Seekins Precision ATC Muzzle Brake .308", type: "muzzle_device", manufacturer: "Seekins Precision", weight_oz: 4.0, msrp_cents: 8900, specs: { caliber: ".308", thread: "5/8x24", material: "Steel" }, discontinued: false },

  # =====================
  # AMERICAN RIFLE COMPANY (ARC)
  # =====================
  { name: "ARC M10 Mount 34mm 0 MOA", type: "mount", manufacturer: "American Rifle Company (ARC)", weight_oz: 9.5, msrp_cents: 32900, specs: { diameter: "34mm", cant: "0 MOA", material: "Aluminum" }, discontinued: false },
  { name: "ARC M10 Mount 34mm 20 MOA", type: "mount", manufacturer: "American Rifle Company (ARC)", weight_oz: 9.5, msrp_cents: 32900, specs: { diameter: "34mm", cant: "20 MOA", material: "Aluminum" }, discontinued: false },
  { name: "ARC Rings 34mm Medium", type: "rings", manufacturer: "American Rifle Company (ARC)", weight_oz: 4.5, msrp_cents: 18500, specs: { diameter: "34mm", height: "Medium", matched: true }, discontinued: false },
  { name: "ARC Rings 30mm High", type: "rings", manufacturer: "American Rifle Company (ARC)", weight_oz: 4.0, msrp_cents: 16500, specs: { diameter: "30mm", height: "High", matched: true }, discontinued: false },

  # =====================
  # MORE TRIGGERS
  # =====================
  { name: "Jewel Trigger HVR - Remington 700", type: "trigger", manufacturer: "Jewel Trigger", weight_oz: 3.0, msrp_cents: 27900, specs: { action_compatibility: "Remington 700", pull_weight: "1.5oz-3lbs", safety: true }, discontinued: false },
  { name: "Jewel Trigger BR - Benchrest", type: "trigger", manufacturer: "Jewel Trigger", weight_oz: 2.8, msrp_cents: 29900, specs: { benchrest: true, pull_weight: "1.5oz-8oz" }, discontinued: false },
  { name: "Huber Concepts Single Stage - Rem 700", type: "trigger", manufacturer: "Huber Concepts", weight_oz: 3.2, msrp_cents: 34900, specs: { action_compatibility: "Remington 700", pull_weight: "8oz-2.5lbs", single_stage: true }, discontinued: false },
  { name: "Huber Concepts Two Stage - Rem 700", type: "trigger", manufacturer: "Huber Concepts", weight_oz: 3.4, msrp_cents: 37900, specs: { action_compatibility: "Remington 700", pull_weight: "12oz-3lbs", two_stage: true }, discontinued: false },

  # =====================
  # CKYE-POD BIPODS
  # =====================
  { name: "Ckye-Pod Integrated Bipod Short Legs ARCA", type: "bipod", manufacturer: "Ckye-Pod", weight_oz: 14.0, msrp_cents: 44900, specs: { height: "6-10 inches", material: "Aluminum", mount: "ARCA" }, discontinued: false },
  { name: "Ckye-Pod Integrated Bipod Medium Legs ARCA", type: "bipod", manufacturer: "Ckye-Pod", weight_oz: 16.0, msrp_cents: 46900, specs: { height: "8-13 inches", material: "Aluminum", mount: "ARCA" }, discontinued: false },
  { name: "Ckye-Pod Double Pull Leg Extension Kit", type: "other", manufacturer: "Ckye-Pod", weight_oz: 4.0, msrp_cents: 8900, specs: { type: "Bipod Accessory", extends_height: "4 inches" }, discontinued: false },

  # =====================
  # MORE VORTEX
  # =====================
  { name: "Vortex Razor HD LHT 4.5-22x50 XLR-2 MRAD", type: "scope", manufacturer: "Vortex Optics", weight_oz: 24.0, msrp_cents: 199900, specs: { magnification: "4.5-22x", objective: "50mm", reticle: "XLR-2 MRAD", tube_diameter: "30mm", first_focal_plane: true, hunting: true }, discontinued: false },
  { name: "Vortex Venom 5-25x56 EBR-7C MOA", type: "scope", manufacturer: "Vortex Optics", weight_oz: 32.0, msrp_cents: 59900, specs: { magnification: "5-25x", objective: "56mm", reticle: "EBR-7C MOA", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Vortex Kaibab HD 18x56 Binoculars", type: "other", manufacturer: "Vortex Optics", weight_oz: 52.0, msrp_cents: 149900, specs: { magnification: "18x", objective: "56mm", type: "Binoculars" }, discontinued: false },
  { name: "Vortex Fury HD 5000 AB Rangefinding Binoculars", type: "other", manufacturer: "Vortex Optics", weight_oz: 34.0, msrp_cents: 159900, specs: { magnification: "10x", objective: "42mm", type: "Rangefinding Binoculars", max_range: "5000 yards" }, discontinued: false },
  { name: "Vortex Defender-CCW Red Dot", type: "other", manufacturer: "Vortex Optics", weight_oz: 1.0, msrp_cents: 29900, specs: { type: "Red Dot", moa_dot: 6, battery_life: "14 months" }, discontinued: false },
  { name: "Vortex Cantilever Mount 30mm 2\" Offset", type: "mount", manufacturer: "Vortex Optics", weight_oz: 7.0, msrp_cents: 14900, specs: { diameter: "30mm", offset: "2 inches", material: "Aluminum" }, discontinued: false },
  { name: "Vortex Sport Cantilever Mount 30mm", type: "mount", manufacturer: "Vortex Optics", weight_oz: 6.5, msrp_cents: 8900, specs: { diameter: "30mm", material: "Aluminum" }, discontinued: false },

  # =====================
  # MORE NIGHTFORCE
  # =====================
  { name: "Nightforce NX8 2.5-20x50 F1 Mil-C", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 28.0, msrp_cents: 219500, specs: { magnification: "2.5-20x", objective: "50mm", reticle: "Mil-C", tube_diameter: "30mm", first_focal_plane: true, compact: true }, discontinued: false },
  { name: "Nightforce BEAST 5-25x56 MOAR", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 39.0, msrp_cents: 479500, specs: { magnification: "5-25x", objective: "56mm", reticle: "MOAR", tube_diameter: "34mm", first_focal_plane: true, high_end: true }, discontinued: false },
  { name: "Nightforce BR 12-42x56 NP-R2", type: "scope", manufacturer: "Nightforce Optics", weight_oz: 30.0, msrp_cents: 199500, specs: { magnification: "12-42x", objective: "56mm", reticle: "NP-R2", tube_diameter: "30mm", benchrest: true }, discontinued: false },
  { name: "Nightforce Xtremeduty 30mm Ultralite Rings", type: "rings", manufacturer: "Nightforce Optics", weight_oz: 3.5, msrp_cents: 17500, specs: { diameter: "30mm", material: "Titanium/Aluminum" }, discontinued: false },
  { name: "Nightforce Direct Mount 34mm 20 MOA Rem 700 SA", type: "mount", manufacturer: "Nightforce Optics", weight_oz: 7.0, msrp_cents: 29500, specs: { diameter: "34mm", cant: "20 MOA", action: "Remington 700 SA" }, discontinued: false },

  # =====================
  # MORE LEUPOLD
  # =====================
  { name: "Leupold Mark 5HD 3.6-18x44 FFP Tremor 3", type: "scope", manufacturer: "Leupold", weight_oz: 26.0, msrp_cents: 249999, specs: { magnification: "3.6-18x", objective: "44mm", reticle: "Tremor 3", tube_diameter: "35mm", first_focal_plane: true, compact: true }, discontinued: false },
  { name: "Leupold VX-3HD 4.5-14x50 CDS-ZL Duplex", type: "scope", manufacturer: "Leupold", weight_oz: 16.0, msrp_cents: 99999, specs: { magnification: "4.5-14x", objective: "50mm", reticle: "Duplex", tube_diameter: "30mm" }, discontinued: false },
  { name: "Leupold VX-5HD 3-15x56 CDS-ZL2 FireDot Duplex", type: "scope", manufacturer: "Leupold", weight_oz: 20.0, msrp_cents: 179999, specs: { magnification: "3-15x", objective: "56mm", reticle: "FireDot Duplex", tube_diameter: "30mm", illuminated: true }, discontinued: false },
  { name: "Leupold RX-2800 TBR/W Rangefinder", type: "other", manufacturer: "Leupold", weight_oz: 8.0, msrp_cents: 49999, specs: { type: "Rangefinder", max_range: "2800 yards", ballistic: true }, discontinued: false },
  { name: "Leupold Mark IMS 34mm Mount", type: "mount", manufacturer: "Leupold", weight_oz: 8.5, msrp_cents: 24999, specs: { diameter: "34mm", integral: true, material: "Aluminum" }, discontinued: false },
  { name: "Leupold Mark 4 Rings 34mm High", type: "rings", manufacturer: "Leupold", weight_oz: 5.5, msrp_cents: 17999, specs: { diameter: "34mm", height: "High", material: "Steel" }, discontinued: false },

  # =====================
  # RITON OPTICS
  # =====================
  { name: "Riton X7 Conquer 4-32x56 MRAD", type: "scope", manufacturer: "Riton Optics", weight_oz: 34.0, msrp_cents: 199999, specs: { magnification: "4-32x", objective: "56mm", reticle: "MRAD", tube_diameter: "34mm", first_focal_plane: true }, discontinued: false },
  { name: "Riton X5 Tactix 5-25x50 MRAD", type: "scope", manufacturer: "Riton Optics", weight_oz: 28.0, msrp_cents: 79999, specs: { magnification: "5-25x", objective: "50mm", reticle: "MRAD", tube_diameter: "30mm", first_focal_plane: true }, discontinued: false },
  { name: "Riton X3 Primal 4-16x44 MRAD", type: "scope", manufacturer: "Riton Optics", weight_oz: 20.0, msrp_cents: 39999, specs: { magnification: "4-16x", objective: "44mm", reticle: "MRAD", tube_diameter: "30mm" }, discontinued: false },

  # =====================
  # MORE MDT PRODUCTS
  # =====================
  { name: "MDT ACC Chassis System - Tikka T3x SA", type: "chassis", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 92.0, msrp_cents: 189900, specs: { action_compatibility: [ "Tikka T3x SA" ], material: "Aluminum", arca_rail: true, adjustable_lop: true }, discontinued: false },
  { name: "MDT Field Stock", type: "stock", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 24.0, msrp_cents: 29900, specs: { material: "Polymer", color: "Black", hunting: true }, discontinued: false },
  { name: "MDT Adjustable Buttplate", type: "buttpad", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 6.0, msrp_cents: 9900, specs: { adjustable: true, material: "Aluminum" }, discontinued: false },
  { name: "MDT Adjustable Cheek Riser", type: "cheek_riser", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 7900, specs: { adjustable: true, height: "1.5 inches" }, discontinued: false },
  { name: "MDT Folding Stock Adapter", type: "stock", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 8.0, msrp_cents: 14900, specs: { type: "Adapter", folding: true }, discontinued: false },
  { name: "MDT One-Piece Scope Mount 34mm 20 MOA", type: "mount", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 9.0, msrp_cents: 29900, specs: { diameter: "34mm", cant: "20 MOA" }, discontinued: false },
  { name: "MDT Pistol Grip - AR Style", type: "grip", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 3.5, msrp_cents: 4900, specs: { style: "AR", material: "Polymer" }, discontinued: false },
  { name: "MDT Pistol Grip - Vertical", type: "grip", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 5900, specs: { style: "Vertical", material: "Polymer" }, discontinued: false },
  { name: "MDT LSS Barricade Stop", type: "other", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 2.0, msrp_cents: 3900, specs: { type: "Accessory", arca_compatible: true }, discontinued: false },
  { name: "MDT Night Vision Bridge", type: "mount", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 3.0, msrp_cents: 12900, specs: { type: "NV Mount", compatible: "MDT Chassis" }, discontinued: false },
  { name: "MDT AICS Pattern Magazine 5rd .308", type: "magazine", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 3.0, msrp_cents: 4900, specs: { capacity: 5, caliber: ".308", pattern: "AICS" }, discontinued: false },
  { name: "MDT AICS Pattern Magazine 12rd .223", type: "magazine", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 3.5, msrp_cents: 5900, specs: { capacity: 12, caliber: ".223", pattern: "AICS" }, discontinued: false },
  { name: "MDT AICS Pattern Magazine 10rd .300 WM", type: "magazine", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 5.0, msrp_cents: 6900, specs: { capacity: 10, caliber: ".300 Win Mag", pattern: "AICS" }, discontinued: false },
  { name: "MDT ARCA Swiss Rail 16\"", type: "mount", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 5.0, msrp_cents: 7900, specs: { length: "16 inches", pattern: "ARCA" }, discontinued: false },
  { name: "MDT ARCA Swiss Rail 12\"", type: "mount", manufacturer: "MDT (Modular Driven Technologies)", weight_oz: 4.0, msrp_cents: 6900, specs: { length: "12 inches", pattern: "ARCA" }, discontinued: false },

  # =====================
  # MORE CADEX
  # =====================
  { name: "Cadex CDX-MC Kraken Multi-Caliber Rifle", type: "other", manufacturer: "Cadex Defence", weight_oz: 384.0, msrp_cents: 799900, specs: { type: "Complete Rifle", multi_caliber: true, made_in: "Canada" }, discontinued: false },
  { name: "Cadex Field Competition Rifle 6.5 Creedmoor", type: "other", manufacturer: "Cadex Defence", weight_oz: 192.0, msrp_cents: 549900, specs: { type: "Complete Rifle", caliber: "6.5 Creedmoor", competition: true }, discontinued: false },
  { name: "Cadex Strike Nuke Evo Rifle .308", type: "other", manufacturer: "Cadex Defence", weight_oz: 176.0, msrp_cents: 499900, specs: { type: "Complete Rifle", caliber: ".308", tactical: true }, discontinued: false },
  { name: "Cadex Lite Competition Trigger", type: "trigger", manufacturer: "Cadex Defence", weight_oz: 3.0, msrp_cents: 39900, specs: { pull_weight: "1lb-3lbs", adjustable: true, made_in: "Canada" }, discontinued: false },
  { name: "Cadex Skeleton Stock", type: "stock", manufacturer: "Cadex Defence", weight_oz: 18.0, msrp_cents: 34900, specs: { material: "Aluminum", adjustable_lop: true, adjustable_cheek: true }, discontinued: false },
  { name: "Cadex Dual Strike Chassis - Tikka T3x", type: "chassis", manufacturer: "Cadex Defence", weight_oz: 78.0, msrp_cents: 249900, specs: { action_compatibility: [ "Tikka T3x" ], material: "Aluminum", dual_caliber: true }, discontinued: false },
  { name: "Cadex MX1 Mini Brake 6.5mm", type: "muzzle_device", manufacturer: "Cadex Defence", weight_oz: 3.5, msrp_cents: 12900, specs: { caliber: "6.5mm", thread: "5/8x24", compact: true }, discontinued: false },

  # =====================
  # MORE TRIGGERTECH
  # =====================
  { name: "TriggerTech Diamond - Savage 110", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Savage 110", pull_weight: "4oz-32oz", style: "Flat" }, discontinued: false },
  { name: "TriggerTech Primary - Savage 110", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 17900, specs: { action_compatibility: "Savage 110", pull_weight: "1.5lbs-4lbs" }, discontinued: false },
  { name: "TriggerTech Diamond - Howa 1500", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Howa 1500", pull_weight: "4oz-32oz" }, discontinued: false },
  { name: "TriggerTech Special - Weatherby Vanguard", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 22900, specs: { action_compatibility: "Weatherby Vanguard", pull_weight: "1lb-3.5lbs" }, discontinued: false },
  { name: "TriggerTech Diamond - Ruger American", type: "trigger", manufacturer: "TriggerTech", weight_oz: 3.0, msrp_cents: 29900, specs: { action_compatibility: "Ruger American", pull_weight: "4oz-32oz" }, discontinued: false },
  { name: "TriggerTech Field - Remington 700", type: "trigger", manufacturer: "TriggerTech", weight_oz: 2.8, msrp_cents: 14900, specs: { action_compatibility: "Remington 700", pull_weight: "2.5lbs-5lbs", hunting: true }, discontinued: false },
  { name: "TriggerTech Frictionless Release Technology Kit", type: "other", manufacturer: "TriggerTech", weight_oz: 0.5, msrp_cents: 2900, specs: { type: "Maintenance Kit" }, discontinued: false },

  # =====================
  # MORE AREA 419
  # =====================
  { name: "Area 419 Sidewinder Side-Baffle Brake .30 Cal", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 5.0, msrp_cents: 14500, specs: { caliber: ".30", thread: "5/8x24", side_ports: true }, discontinued: false },
  { name: "Area 419 Sidewinder Side-Baffle Brake 6.5mm", type: "muzzle_device", manufacturer: "Area 419", weight_oz: 4.5, msrp_cents: 14500, specs: { caliber: "6.5mm", thread: "5/8x24", side_ports: true }, discontinued: false },
  { name: "Area 419 ARCALOCK Adapter for Harris Bipod", type: "mount", manufacturer: "Area 419", weight_oz: 2.5, msrp_cents: 5500, specs: { pattern: "ARCA", compatible: "Harris Bipods" }, discontinued: false },
  { name: "Area 419 Scope Level 34mm", type: "other", manufacturer: "Area 419", weight_oz: 0.5, msrp_cents: 4500, specs: { diameter: "34mm", type: "Anti-Cant Level" }, discontinued: false },
  { name: "Area 419 Scope Level 30mm", type: "other", manufacturer: "Area 419", weight_oz: 0.4, msrp_cents: 4500, specs: { diameter: "30mm", type: "Anti-Cant Level" }, discontinued: false },
  { name: "Area 419 Match Seating Stem 6.5mm", type: "other", manufacturer: "Area 419", weight_oz: 1.0, msrp_cents: 3500, specs: { caliber: "6.5mm", type: "Reloading Accessory" }, discontinued: false },
  { name: "Area 419 Match Seating Stem 6mm", type: "other", manufacturer: "Area 419", weight_oz: 1.0, msrp_cents: 3500, specs: { caliber: "6mm", type: "Reloading Accessory" }, discontinued: false },
  { name: "Area 419 Cleaning Rod Guide Remington 700", type: "other", manufacturer: "Area 419", weight_oz: 2.0, msrp_cents: 4900, specs: { action: "Remington 700", type: "Cleaning Accessory" }, discontinued: false },

  # =====================
  # REALLY RIGHT STUFF
  # =====================
  { name: "Really Right Stuff SOAR Bipod", type: "bipod", manufacturer: "Really Right Stuff", weight_oz: 14.0, msrp_cents: 69500, specs: { height: "6-11 inches", material: "Aluminum/Carbon Fiber", mount: "ARCA", high_end: true }, discontinued: false },
  { name: "Really Right Stuff Anvil-30 Ballhead", type: "other", manufacturer: "Really Right Stuff", weight_oz: 32.0, msrp_cents: 59500, specs: { type: "Tripod Head", load_capacity: "50 lbs" }, discontinued: false },
  { name: "Really Right Stuff TVC-34L Tripod", type: "other", manufacturer: "Really Right Stuff", weight_oz: 80.0, msrp_cents: 159500, specs: { type: "Tripod", material: "Carbon Fiber", sections: 4 }, discontinued: false },

  # =====================
  # ADDITIONAL CANADIAN RETAILER PRODUCTS
  # =====================
  # Based on Go Big Tactical, Dominion Outdoors, Wolverine Supplies
  { name: "Bell & Carlson Medalist M40 Stock - Rem 700 SA", type: "stock", manufacturer: "Grayboe", weight_oz: 42.0, msrp_cents: 34900, specs: { action_inlet: "Remington 700 SA", material: "Fiberglass/Kevlar", style: "M40" }, discontinued: false },
  { name: "Bell & Carlson Tactical Medalist - Rem 700 BDL", type: "stock", manufacturer: "Grayboe", weight_oz: 40.0, msrp_cents: 32900, specs: { action_inlet: "Remington 700 BDL", material: "Fiberglass" }, discontinued: false },

  # =====================
  # KRG ACCESSORIES
  # =====================
  { name: "KRG Tool-Less Cheek Riser Bravo/X-Ray", type: "cheek_riser", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 3.0, msrp_cents: 4900, specs: { compatible: [ "Bravo", "X-Ray" ], tool_less: true }, discontinued: false },
  { name: "KRG Bolt Lift", type: "other", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 1.0, msrp_cents: 4900, specs: { type: "Accessory" }, discontinued: false },
  { name: "KRG Spigot Bag Rider", type: "other", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 2.0, msrp_cents: 3900, specs: { type: "Accessory", arca_compatible: true }, discontinued: false },
  { name: "KRG ARCA Adapter Rail", type: "mount", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 3.0, msrp_cents: 6900, specs: { pattern: "ARCA" }, discontinued: false },
  { name: "KRG Whiskey-3 Folding Hinge", type: "other", manufacturer: "KRG (Kinetic Research Group)", weight_oz: 4.0, msrp_cents: 12900, specs: { type: "Stock Accessory", folding: true }, discontinued: false },

  # =====================
  # MPA ACCESSORIES
  # =====================
  { name: "MPA EVG Grip - Enhanced Vertical Grip", type: "grip", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 5.0, msrp_cents: 11900, specs: { material: "Aluminum", enhanced: true }, discontinued: false },
  { name: "MPA Barricade Block", type: "other", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 3.0, msrp_cents: 5900, specs: { type: "Accessory", barricade: true }, discontinued: false },
  { name: "MPA Ambidextrous Magazine Release", type: "other", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 1.0, msrp_cents: 3900, specs: { type: "Accessory", ambidextrous: true }, discontinued: false },
  { name: "MPA RAT (Rapid Adjustment Tool)", type: "cheek_riser", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 4.0, msrp_cents: 9900, specs: { type: "Cheek Piece", tool_less: true }, discontinued: false },
  { name: "MPA Universal ARCA Rail 14\"", type: "mount", manufacturer: "MPA (Masterpiece Arms)", weight_oz: 5.0, msrp_cents: 8900, specs: { length: "14 inches", pattern: "ARCA" }, discontinued: false },

  # =====================
  # MORE SHOOTING ACCESSORIES
  # =====================
  { name: "Wiebad Pump Pillow", type: "other", manufacturer: "Wiebad", weight_oz: 10.0, msrp_cents: 4900, specs: { type: "Shooting Bag", inflatable: true }, discontinued: false },
  { name: "Wiebad Berry Bag", type: "other", manufacturer: "Wiebad", weight_oz: 6.0, msrp_cents: 3900, specs: { type: "Shooting Bag", size: "Small" }, discontinued: false },
  { name: "Wiebad Loop Bag", type: "other", manufacturer: "Wiebad", weight_oz: 8.0, msrp_cents: 4500, specs: { type: "Shooting Bag", loop: true }, discontinued: false },
  { name: "Tab Gear Shooting Mat with Bipod Bungee", type: "other", manufacturer: "Tab Gear", weight_oz: 32.0, msrp_cents: 14900, specs: { type: "Shooting Mat", size: "Large" }, discontinued: false },
  { name: "Tab Gear QUAD Rear Bag", type: "other", manufacturer: "Tab Gear", weight_oz: 8.0, msrp_cents: 5900, specs: { type: "Shooting Bag", position: "Rear" }, discontinued: false },
  { name: "Armageddon Gear Rear Support Bag", type: "other", manufacturer: "Armageddon Gear", weight_oz: 8.0, msrp_cents: 5900, specs: { type: "Shooting Bag", position: "Rear" }, discontinued: false },
  { name: "Armageddon Gear Fat Bag", type: "other", manufacturer: "Armageddon Gear", weight_oz: 12.0, msrp_cents: 7900, specs: { type: "Shooting Bag", size: "Large" }, discontinued: false },
  { name: "Armageddon Gear Waxed Canvas Rifle Cover", type: "other", manufacturer: "Armageddon Gear", weight_oz: 24.0, msrp_cents: 12900, specs: { type: "Rifle Cover", material: "Waxed Canvas" }, discontinued: false },
  { name: "Cole-TAC Suppressor Cover 7.5\"", type: "other", manufacturer: "Cole-TAC", weight_oz: 3.5, msrp_cents: 9900, specs: { type: "Suppressor Cover", length: "7.5 inches" }, discontinued: false },
  { name: "Cole-TAC Python 2 Suppressor Cover", type: "other", manufacturer: "Cole-TAC", weight_oz: 5.0, msrp_cents: 14900, specs: { type: "Suppressor Cover", modular: true }, discontinued: false },
  { name: "Cole-TAC Rifle Sling", type: "other", manufacturer: "Cole-TAC", weight_oz: 3.0, msrp_cents: 4900, specs: { type: "Sling", quick_adjust: true }, discontinued: false },

  # =====================
  # COMPLETE RIFLES - VARIOUS MANUFACTURERS
  # =====================
  { name: "Accuracy International AXSR Complete Rifle .338 Lapua", type: "other", manufacturer: "Accuracy International", weight_oz: 272.0, msrp_cents: 999900, specs: { type: "Complete Rifle", caliber: ".338 Lapua", made_in: "UK" }, discontinued: false },
  { name: "Accuracy International AX Multi-Caliber Rifle", type: "other", manufacturer: "Accuracy International", weight_oz: 224.0, msrp_cents: 699900, specs: { type: "Complete Rifle", multi_caliber: true }, discontinued: false }
]

components_data.each do |data|
  manufacturer = manufacturers[data[:manufacturer]]
  next unless manufacturer

  Component.find_or_create_by!(name: data[:name]) do |c|
    c.type = data[:type]
    c.manufacturer = manufacturer
    c.weight_oz = data[:weight_oz]
    c.msrp_cents = data[:msrp_cents]
    c.specs = data[:specs] || {}
    c.discontinued = data[:discontinued] || false
  end
end

puts "✅ Created #{Component.count} components"

# =============================================================================
# ADMIN USER
# =============================================================================
puts "Creating admin user..."

admin_user = User.find_or_create_by!(email: "admin@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.username = "admin"
  u.full_name = "Admin User"
  u.phone_number = "555-000-0000"
  u.role = :admin
end

# Ensure admin role is set even if user already existed
admin_user.update!(role: :admin) unless admin_user.admin?

puts "✅ Created admin user: #{admin_user.email} (password: password123)"

# =============================================================================
# DEMO USER
# =============================================================================
puts "Creating demo user..."

demo_user = User.find_or_create_by!(email: "demo@prsbuilder.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.username = "demo_shooter"
  u.full_name = "Demo User"
  u.phone_number = "555-123-4567"
  u.role = :user
end

puts "✅ Created demo user: #{demo_user.email} (password: password123)"

# =============================================================================
# DEMO BUILDS
# =============================================================================
puts "Creating demo builds..."

# Competition PRS Build
prs_build = Build.find_or_create_by!(name: "Competition PRS 6.5 Creedmoor", user: demo_user) do |b|
  b.discipline = "prs"
end

# Add components to PRS build
prs_components = [
  { name: "MDT ACC Elite Chassis System", position: "chassis" },
  { name: "TriggerTech Diamond Pro Curved - Remington 700", position: "trigger" },
  { name: "Vortex Razor HD Gen III 6-36x56 EBR-7D MRAD", position: "scope" },
  { name: "Spuhr ISMS SP-4603 34mm 6 MIL", position: "mount" },
  { name: "Area 419 Hellfire Match Self-Timing Brake .30 Cal", position: "muzzle_device" },
  { name: "Atlas BT46-LW17 PSR Bipod", position: "bipod" },
  { name: "MDT AICS Pattern Magazine 10rd 6.5CM", position: "magazine" }
]

prs_components.each do |comp_data|
  component = Component.find_by(name: comp_data[:name])
  next unless component

  BuildComponent.find_or_create_by!(build: prs_build, component: component) do |bc|
    bc.position = comp_data[:position]
  end
end

# Hunting Build
hunting_build = Build.find_or_create_by!(name: "Backcountry Hunter 6.5 PRC", user: demo_user) do |b|
  b.discipline = "hunting"
end

hunting_components = [
  { name: "MDT HNT26 Chassis System", position: "chassis" },
  { name: "TriggerTech Primary Flat - Remington 700", position: "trigger" },
  { name: "Leupold VX-Freedom 4-12x40 CDS Tri-MOA", position: "scope" },
  { name: "Harris S-BRM Bipod 6-9\"", position: "bipod" }
]

hunting_components.each do |comp_data|
  component = Component.find_by(name: comp_data[:name])
  next unless component

  BuildComponent.find_or_create_by!(build: hunting_build, component: component) do |bc|
    bc.position = comp_data[:position]
  end
end

# Budget PRS Build
budget_build = Build.find_or_create_by!(name: "Budget PRS .308", user: demo_user) do |b|
  b.discipline = "prs"
end

budget_components = [
  { name: "MDT Oryx Chassis - Remington 700 SA", position: "chassis" },
  { name: "TriggerTech Primary Curved - Remington 700", position: "trigger" },
  { name: "Vortex Diamondback Tactical 6-24x50 EBR-2C MRAD", position: "scope" },
  { name: "Vortex Pro Scope Ring 30mm Medium", position: "rings" },
  { name: "Harris 1A2-BRM Bipod 6-9\" Picatinny", position: "bipod" },
  { name: "MDT AICS Pattern Magazine 10rd .308", position: "magazine" }
]

budget_components.each do |comp_data|
  component = Component.find_by(name: comp_data[:name])
  next unless component

  BuildComponent.find_or_create_by!(build: budget_build, component: component) do |bc|
    bc.position = comp_data[:position]
  end
end

# Recalculate all build totals
Build.find_each do |build|
  build.calculate_totals! if build.build_components.any?
end

puts "✅ Created #{Build.count} demo builds with components"

puts ""
puts "🎉 Seeding complete!"
puts "=================================="
puts "Manufacturers: #{Manufacturer.count}"
puts "Components: #{Component.count}"
puts "Users: #{User.count}"
# =============================================================================
# PROJECTILES (Bullet Catalog)
# =============================================================================
require_relative "seeds/projectiles"
Seeds::Projectiles.seed!

puts "  - Admins: #{User.admin.count}"
puts "  - Regular Users: #{User.user.count}"
puts "Builds: #{Build.count}"
puts "Build Components: #{BuildComponent.count}"
puts "Projectiles: #{Projectile.count}"
puts "=================================="
puts ""
puts "Admin login credentials:"
puts "  Email: admin@example.com"
puts "  Password: password123"
puts ""
puts "Demo login credentials:"
puts "  Email: demo@prsbuilder.com"
puts "  Password: password123"
