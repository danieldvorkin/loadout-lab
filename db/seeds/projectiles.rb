# frozen_string_literal: true

# Seed data for the projectile catalog
# BC values sourced from manufacturer-published specifications
# G7 BCs are preferred for modern boat-tail match bullets

module Seeds
  class Projectiles
    def self.seed!
      puts "Seeding projectile catalog..."

      projectiles = [
        # ============================================================
        # HORNADY
        # ============================================================

        # 6mm (.243)
        { manufacturer: "Hornady", name: "108gr ELD-M", caliber_inches: 0.243,
          weight_grains: 108, bc_g1: 0.536, bc_g7: 0.275, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Hornady", name: "105gr BTHP", caliber_inches: 0.243,
          weight_grains: 105, bc_g1: 0.500, bc_g7: 0.255, bullet_type: "BTHP",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Hornady", name: "110gr A-Tip Match", caliber_inches: 0.243,
          weight_grains: 110, bc_g1: 0.560, bc_g7: 0.290, bullet_type: "A-Tip",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # 6.5mm (.264)
        { manufacturer: "Hornady", name: "140gr ELD-M", caliber_inches: 0.264,
          weight_grains: 140, bc_g1: 0.646, bc_g7: 0.326, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Hornady", name: "147gr ELD-M", caliber_inches: 0.264,
          weight_grains: 147, bc_g1: 0.697, bc_g7: 0.351, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Hornady", name: "153gr A-Tip Match", caliber_inches: 0.264,
          weight_grains: 153, bc_g1: 0.704, bc_g7: 0.388, bullet_type: "A-Tip",
          base_type: "boat_tail", recommended_twist: "1:7.5" },
        { manufacturer: "Hornady", name: "130gr ELD-M", caliber_inches: 0.264,
          weight_grains: 130, bc_g1: 0.562, bc_g7: 0.287, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # .308 (.308)
        { manufacturer: "Hornady", name: "168gr ELD-M", caliber_inches: 0.308,
          weight_grains: 168, bc_g1: 0.523, bc_g7: 0.274, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Hornady", name: "178gr ELD-M", caliber_inches: 0.308,
          weight_grains: 178, bc_g1: 0.547, bc_g7: 0.283, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Hornady", name: "208gr ELD-M", caliber_inches: 0.308,
          weight_grains: 208, bc_g1: 0.690, bc_g7: 0.359, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Hornady", name: "200gr ELD-X", caliber_inches: 0.308,
          weight_grains: 200, bc_g1: 0.626, bc_g7: 0.321, bullet_type: "ELD-X",
          base_type: "boat_tail", recommended_twist: "1:10" },

        # .224
        { manufacturer: "Hornady", name: "73gr ELD-M", caliber_inches: 0.224,
          weight_grains: 73, bc_g1: 0.390, bc_g7: 0.200, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Hornady", name: "75gr BTHP", caliber_inches: 0.224,
          weight_grains: 75, bc_g1: 0.395, bc_g7: 0.202, bullet_type: "BTHP",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # 7mm (.284)
        { manufacturer: "Hornady", name: "180gr ELD-M", caliber_inches: 0.284,
          weight_grains: 180, bc_g1: 0.796, bc_g7: 0.391, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:8.5" },
        { manufacturer: "Hornady", name: "175gr ELD-X", caliber_inches: 0.284,
          weight_grains: 175, bc_g1: 0.689, bc_g7: 0.348, bullet_type: "ELD-X",
          base_type: "boat_tail", recommended_twist: "1:9" },

        # .338
        { manufacturer: "Hornady", name: "285gr ELD-M", caliber_inches: 0.338,
          weight_grains: 285, bc_g1: 0.810, bc_g7: 0.417, bullet_type: "ELD-M",
          base_type: "boat_tail", recommended_twist: "1:9.4" },

        # ============================================================
        # SIERRA
        # ============================================================

        # 6mm (.243)
        { manufacturer: "Sierra", name: "107gr MatchKing HPBT", caliber_inches: 0.243,
          weight_grains: 107, bc_g1: 0.527, bc_g7: 0.268, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Sierra", name: "95gr TMK", caliber_inches: 0.243,
          weight_grains: 95, bc_g1: 0.440, bc_g7: 0.224, bullet_type: "Tipped MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # 6.5mm (.264)
        { manufacturer: "Sierra", name: "140gr MatchKing HPBT", caliber_inches: 0.264,
          weight_grains: 140, bc_g1: 0.535, bc_g7: 0.264, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Sierra", name: "142gr MatchKing HPBT", caliber_inches: 0.264,
          weight_grains: 142, bc_g1: 0.626, bc_g7: 0.311, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Sierra", name: "130gr TMK", caliber_inches: 0.264,
          weight_grains: 130, bc_g1: 0.535, bc_g7: 0.274, bullet_type: "Tipped MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # .308 (.308)
        { manufacturer: "Sierra", name: "168gr MatchKing HPBT", caliber_inches: 0.308,
          weight_grains: 168, bc_g1: 0.462, bc_g7: 0.230, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Sierra", name: "175gr MatchKing HPBT", caliber_inches: 0.308,
          weight_grains: 175, bc_g1: 0.505, bc_g7: 0.253, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Sierra", name: "155gr Palma MatchKing", caliber_inches: 0.308,
          weight_grains: 155, bc_g1: 0.450, bc_g7: 0.236, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:12" },
        { manufacturer: "Sierra", name: "190gr MatchKing HPBT", caliber_inches: 0.308,
          weight_grains: 190, bc_g1: 0.533, bc_g7: 0.275, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:10" },

        # .224
        { manufacturer: "Sierra", name: "77gr MatchKing HPBT", caliber_inches: 0.224,
          weight_grains: 77, bc_g1: 0.372, bc_g7: 0.190, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Sierra", name: "69gr MatchKing HPBT", caliber_inches: 0.224,
          weight_grains: 69, bc_g1: 0.301, bc_g7: 0.154, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # 7mm (.284)
        { manufacturer: "Sierra", name: "183gr MatchKing HPBT", caliber_inches: 0.284,
          weight_grains: 183, bc_g1: 0.748, bc_g7: 0.384, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:9" },

        # .338
        { manufacturer: "Sierra", name: "300gr MatchKing HPBT", caliber_inches: 0.338,
          weight_grains: 300, bc_g1: 0.768, bc_g7: 0.395, bullet_type: "MatchKing",
          base_type: "boat_tail", recommended_twist: "1:10" },

        # ============================================================
        # BERGER
        # ============================================================

        # 6mm (.243)
        { manufacturer: "Berger", name: "105gr Hybrid Target", caliber_inches: 0.243,
          weight_grains: 105, bc_g1: 0.536, bc_g7: 0.275, bullet_type: "Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:8" },
        { manufacturer: "Berger", name: "109gr LRHT", caliber_inches: 0.243,
          weight_grains: 109, bc_g1: 0.552, bc_g7: 0.283, bullet_type: "Long Range Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:7.5" },

        # 6.5mm (.264)
        { manufacturer: "Berger", name: "130gr AR Hybrid OTM", caliber_inches: 0.264,
          weight_grains: 130, bc_g1: 0.562, bc_g7: 0.287, bullet_type: "Hybrid OTM",
          base_type: "hybrid", recommended_twist: "1:8" },
        { manufacturer: "Berger", name: "140gr Hybrid Target", caliber_inches: 0.264,
          weight_grains: 140, bc_g1: 0.607, bc_g7: 0.311, bullet_type: "Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:8" },
        { manufacturer: "Berger", name: "144gr LRHT", caliber_inches: 0.264,
          weight_grains: 144, bc_g1: 0.659, bc_g7: 0.337, bullet_type: "Long Range Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:8" },
        { manufacturer: "Berger", name: "156gr EOL Elite Hunter", caliber_inches: 0.264,
          weight_grains: 156, bc_g1: 0.679, bc_g7: 0.350, bullet_type: "EOL Elite Hunter",
          base_type: "hybrid", recommended_twist: "1:7" },

        # .308 (.308)
        { manufacturer: "Berger", name: "175gr OTM Tactical", caliber_inches: 0.308,
          weight_grains: 175, bc_g1: 0.513, bc_g7: 0.264, bullet_type: "OTM Tactical",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Berger", name: "185gr Hybrid Target", caliber_inches: 0.308,
          weight_grains: 185, bc_g1: 0.569, bc_g7: 0.292, bullet_type: "Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:10" },
        { manufacturer: "Berger", name: "200.20gr Hybrid Target", caliber_inches: 0.308,
          weight_grains: 200.2, bc_g1: 0.622, bc_g7: 0.318, bullet_type: "Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:10" },
        { manufacturer: "Berger", name: "155.5gr Fullbore Target", caliber_inches: 0.308,
          weight_grains: 155.5, bc_g1: 0.464, bc_g7: 0.243, bullet_type: "Fullbore Target",
          base_type: "boat_tail", recommended_twist: "1:12" },

        # .224
        { manufacturer: "Berger", name: "73gr BT Target", caliber_inches: 0.224,
          weight_grains: 73, bc_g1: 0.370, bc_g7: 0.190, bullet_type: "BT Target",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Berger", name: "77gr OTM Tactical", caliber_inches: 0.224,
          weight_grains: 77, bc_g1: 0.378, bc_g7: 0.194, bullet_type: "OTM Tactical",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # 7mm (.284)
        { manufacturer: "Berger", name: "180gr Hybrid Target", caliber_inches: 0.284,
          weight_grains: 180, bc_g1: 0.781, bc_g7: 0.391, bullet_type: "Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:8.5" },
        { manufacturer: "Berger", name: "184gr F-Open Hybrid Target", caliber_inches: 0.284,
          weight_grains: 184, bc_g1: 0.795, bc_g7: 0.399, bullet_type: "F-Open Hybrid Target",
          base_type: "hybrid", recommended_twist: "1:8.5" },

        # .338
        { manufacturer: "Berger", name: "300gr Hybrid OTM Tactical", caliber_inches: 0.338,
          weight_grains: 300, bc_g1: 0.818, bc_g7: 0.419, bullet_type: "Hybrid OTM Tactical",
          base_type: "hybrid", recommended_twist: "1:10" },

        # ============================================================
        # NOSLER
        # ============================================================

        # 6.5mm (.264)
        { manufacturer: "Nosler", name: "140gr RDF", caliber_inches: 0.264,
          weight_grains: 140, bc_g1: 0.637, bc_g7: 0.327, bullet_type: "RDF",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # .308 (.308)
        { manufacturer: "Nosler", name: "175gr RDF", caliber_inches: 0.308,
          weight_grains: 175, bc_g1: 0.565, bc_g7: 0.290, bullet_type: "RDF",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Nosler", name: "168gr HPBT Custom Competition", caliber_inches: 0.308,
          weight_grains: 168, bc_g1: 0.462, bc_g7: 0.232, bullet_type: "Custom Competition",
          base_type: "boat_tail", recommended_twist: "1:10" },

        # .224
        { manufacturer: "Nosler", name: "77gr Custom Competition", caliber_inches: 0.224,
          weight_grains: 77, bc_g1: 0.340, bc_g7: 0.174, bullet_type: "Custom Competition",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # ============================================================
        # LAPUA
        # ============================================================

        # 6mm (.243)
        { manufacturer: "Lapua", name: "105gr Scenar-L", caliber_inches: 0.243,
          weight_grains: 105, bc_g1: 0.530, bc_g7: 0.270, bullet_type: "Scenar-L",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # 6.5mm (.264)
        { manufacturer: "Lapua", name: "136gr Scenar-L", caliber_inches: 0.264,
          weight_grains: 136, bc_g1: 0.577, bc_g7: 0.295, bullet_type: "Scenar-L",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Lapua", name: "139gr Scenar-L", caliber_inches: 0.264,
          weight_grains: 139, bc_g1: 0.596, bc_g7: 0.304, bullet_type: "Scenar-L",
          base_type: "boat_tail", recommended_twist: "1:8" },
        { manufacturer: "Lapua", name: "144gr FMJBT", caliber_inches: 0.264,
          weight_grains: 144, bc_g1: 0.606, bc_g7: 0.310, bullet_type: "FMJBT",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # .308 (.308)
        { manufacturer: "Lapua", name: "155gr Scenar", caliber_inches: 0.308,
          weight_grains: 155, bc_g1: 0.455, bc_g7: 0.237, bullet_type: "Scenar",
          base_type: "boat_tail", recommended_twist: "1:12" },
        { manufacturer: "Lapua", name: "167gr Scenar", caliber_inches: 0.308,
          weight_grains: 167, bc_g1: 0.535, bc_g7: 0.278, bullet_type: "Scenar",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Lapua", name: "185gr Scenar-L", caliber_inches: 0.308,
          weight_grains: 185, bc_g1: 0.560, bc_g7: 0.290, bullet_type: "Scenar-L",
          base_type: "boat_tail", recommended_twist: "1:10" },

        # .338
        { manufacturer: "Lapua", name: "250gr Scenar-L", caliber_inches: 0.338,
          weight_grains: 250, bc_g1: 0.675, bc_g7: 0.356, bullet_type: "Scenar-L",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Lapua", name: "300gr Scenar", caliber_inches: 0.338,
          weight_grains: 300, bc_g1: 0.736, bc_g7: 0.381, bullet_type: "Scenar",
          base_type: "boat_tail", recommended_twist: "1:10" },

        # ============================================================
        # BARNES
        # ============================================================

        # 6.5mm (.264)
        { manufacturer: "Barnes", name: "140gr Match Burner OTM", caliber_inches: 0.264,
          weight_grains: 140, bc_g1: 0.540, bc_g7: 0.277, bullet_type: "Match Burner OTM",
          base_type: "boat_tail", recommended_twist: "1:8" },

        # .308 (.308)
        { manufacturer: "Barnes", name: "175gr Match Burner OTM", caliber_inches: 0.308,
          weight_grains: 175, bc_g1: 0.505, bc_g7: 0.260, bullet_type: "Match Burner OTM",
          base_type: "boat_tail", recommended_twist: "1:10" },
        { manufacturer: "Barnes", name: "155gr Match Burner OTM", caliber_inches: 0.308,
          weight_grains: 155, bc_g1: 0.431, bc_g7: 0.223, bullet_type: "Match Burner OTM",
          base_type: "boat_tail", recommended_twist: "1:12" },
      ]

      created = 0
      skipped = 0

      projectiles.each do |attrs|
        proj = Projectile.find_or_initialize_by(
          manufacturer: attrs[:manufacturer],
          name: attrs[:name]
        )
        if proj.new_record?
          proj.assign_attributes(attrs)
          proj.save!
          created += 1
        else
          skipped += 1
        end
      end

      puts "  Created #{created} projectiles, skipped #{skipped} existing"
      puts "  Total projectiles: #{Projectile.count}"
    end
  end
end
