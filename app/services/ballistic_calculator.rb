# frozen_string_literal: true

# BallisticCalculator - Point-mass trajectory model for rifle ballistics
#
# Implements numerical integration of projectile equations of motion using
# standard G1 and G7 drag models. Based on the Siacci/Mayevski method with
# modern drag coefficient tables.
#
# References:
# - Bryan Litz, "Applied Ballistics for Long-Range Shooting"
# - Robert L. McCoy, "Modern Exterior Ballistics"
# - JBM Ballistics (jbmballistics.com)
#
# All internal calculations use fps/feet/seconds, converted to user-friendly
# units (yards, inches, MOA, Mils) for output.
class BallisticCalculator
  # Physical constants
  GRAVITY = 32.174          # ft/s² (acceleration due to gravity)
  SPEED_OF_SOUND_STD = 1116.45 # fps at standard conditions (59°F)
  STD_TEMP_F = 59.0         # Standard temperature (°F)
  STD_PRESSURE_INHG = 29.92 # Standard barometric pressure (inHg)
  STD_AIR_DENSITY = 0.076474 # lb/ft³ at standard conditions

  # Drag constant: π / (8 * 144) - derived from drag equation with BC in lb/in²
  DRAG_CONSTANT = Math::PI / (8.0 * 144.0)

  # Conversion factors
  MOA_PER_INCH_AT_100YD = 1.0 / 1.04720 # 1 MOA = 1.04720" at 100 yds
  MIL_PER_INCH_AT_100YD = 1.0 / 3.6     # 1 Mil = 3.6" at 100 yds

  Result = Struct.new(
    :distance_yards, :drop_inches, :drop_moa, :drop_mils,
    :windage_inches, :windage_moa, :windage_mils,
    :velocity_fps, :energy_ft_lbs, :time_of_flight_sec,
    keyword_init: true
  )

  # @param profile [BallisticProfile] the ballistic profile with all parameters
  # @param max_distance [Integer] maximum distance in yards (default 1500)
  # @param step [Integer] output interval in yards (default 25)
  # @return [Array<Result>] calculated trajectory data at each step
  def self.calculate(profile, max_distance: 1500, step: 25)
    new(profile).compute_trajectory(max_distance: max_distance, step: step)
  end

  def initialize(profile)
    @profile = profile
    validate_inputs!

    @muzzle_velocity = profile.muzzle_velocity_fps.to_f
    @bc = profile.bullet_bc.to_f
    @bc_type = (profile.bc_type || "G7").upcase
    @zero_distance = (profile.zero_distance_yards || 100).to_f
    @sight_height = (profile.sight_height_inches || 1.5).to_f / 12.0 # convert to feet
    @bullet_weight = profile.bullet_weight_grains.to_f
    @wind_speed = (profile.wind_speed_mph || 0).to_f * 5280.0 / 3600.0 # convert to fps
    @wind_angle = (profile.wind_angle_degrees || 90).to_f * Math::PI / 180.0

    # Atmospheric conditions
    @temp_f = (profile.temperature_f || STD_TEMP_F).to_f
    @pressure_inhg = (profile.pressure_inhg || STD_PRESSURE_INHG).to_f
    @humidity_pct = (profile.humidity_percent || 0).to_f
    @altitude_ft = (profile.altitude_feet || 0).to_f

    # If pressure not explicitly set but altitude is provided, calculate from altitude
    if profile.pressure_inhg.nil? && profile.altitude_feet.present? && profile.altitude_feet > 0
      @pressure_inhg = pressure_at_altitude(@altitude_ft)
    end

    # Pre-compute atmospheric correction
    @rho_ratio = air_density_ratio
    @speed_of_sound = calculate_speed_of_sound
    @crosswind = @wind_speed * Math.sin(@wind_angle) # fps crosswind component
  end

  def compute_trajectory(max_distance: 1500, step: 25)
    # Step 1: Find the bore angle that zeros at the specified distance
    bore_angle = find_zero_angle

    # Step 2: Integrate trajectory with the zero angle
    results = integrate_trajectory(bore_angle, max_distance, step)

    results
  end

  private

  def validate_inputs!
    raise ArgumentError, "Muzzle velocity is required" unless @profile.muzzle_velocity_fps&.positive?
    raise ArgumentError, "Ballistic coefficient is required" unless @profile.bullet_bc&.positive?
    raise ArgumentError, "Bullet weight is required" unless @profile.bullet_weight_grains&.positive?
  end

  # ============================================================
  # Atmospheric Model
  # ============================================================

  # Calculate barometric pressure at altitude using the barometric formula
  # Standard atmosphere lapse rate model (troposphere)
  def pressure_at_altitude(altitude_ft)
    STD_PRESSURE_INHG * (1.0 - 6.8755856e-6 * altitude_ft)**5.2558797
  end

  # Calculate speed of sound at current temperature
  def calculate_speed_of_sound
    # Speed of sound: a = 49.0223 * sqrt(T_Rankine)
    49.0223 * Math.sqrt(@temp_f + 459.67)
  end

  # Calculate air density ratio relative to ICAO standard atmosphere
  # Accounts for temperature, pressure, and humidity
  def air_density_ratio
    # Temperature correction (density inversely proportional to absolute temp)
    t_rankine_std = STD_TEMP_F + 459.67
    t_rankine = @temp_f + 459.67
    temp_factor = t_rankine_std / t_rankine

    # Pressure correction (density proportional to pressure)
    pressure_factor = @pressure_inhg / STD_PRESSURE_INHG

    # Humidity correction (humid air is less dense than dry air)
    # Using Antoine equation approximation for saturation vapor pressure
    t_celsius = (@temp_f - 32.0) * 5.0 / 9.0
    svp_inhg = 0.02953 * Math.exp(17.502 * t_celsius / (240.97 + t_celsius))
    vapor_pressure = svp_inhg * (@humidity_pct / 100.0)
    humidity_factor = 1.0 - 0.3783 * vapor_pressure / @pressure_inhg

    temp_factor * pressure_factor * humidity_factor
  end

  # ============================================================
  # Drag Model
  # ============================================================

  # Calculate deceleration due to drag at given velocity
  # a (ft/s²) = (π / (8 * 144)) * ρ * V² * Cd(M) / BC
  # Simplified: a = DRAG_CONSTANT * ρ_std * ρ_ratio * V² * Cd(M) / BC
  def drag_deceleration(velocity)
    mach = velocity / @speed_of_sound
    cd = drag_coefficient(mach)
    DRAG_CONSTANT * STD_AIR_DENSITY * @rho_ratio * velocity * velocity * cd / @bc
  end

  # Look up drag coefficient from standard table based on Mach number
  def drag_coefficient(mach)
    table = @bc_type == "G1" ? G1_DRAG_TABLE : G7_DRAG_TABLE
    interpolate_drag(table, mach)
  end

  # Linear interpolation on drag coefficient table
  def interpolate_drag(table, mach)
    return table.first[1] if mach <= table.first[0]
    return table.last[1] if mach >= table.last[0]

    # Binary search for the right interval
    low = 0
    high = table.length - 1

    while high - low > 1
      mid = (low + high) / 2
      if table[mid][0] <= mach
        low = mid
      else
        high = mid
      end
    end

    m0, cd0 = table[low]
    m1, cd1 = table[high]

    # Linear interpolation
    fraction = (mach - m0) / (m1 - m0)
    cd0 + fraction * (cd1 - cd0)
  end

  # ============================================================
  # Trajectory Integration
  # ============================================================

  # Find the bore angle that produces zero drop at the zero distance
  # Uses iterative method (bisection)
  def find_zero_angle
    zero_range_ft = @zero_distance * 3.0 # yards to feet

    # Initial guess: small angle approximation
    # Time to zero ≈ zero_range / MV
    t_approx = zero_range_ft / @muzzle_velocity
    # Need to rise sight_height in that time: angle ≈ (sight_height + 0.5*g*t²) / range
    angle_guess = (@sight_height + 0.5 * GRAVITY * t_approx * t_approx) / zero_range_ft

    # Bisection search for exact zero angle
    angle_low = 0.0
    angle_high = angle_guess * 3.0
    angle_high = [angle_high, 0.01].max # ensure reasonable range

    30.times do
      angle_mid = (angle_low + angle_high) / 2.0
      drop = calculate_drop_at_range(angle_mid, zero_range_ft)

      if drop > 0.0
        angle_high = angle_mid
      else
        angle_low = angle_mid
      end

      break if (angle_high - angle_low).abs < 1e-10
    end

    (angle_low + angle_high) / 2.0
  end

  # Calculate the vertical drop at a specific range for a given bore angle
  # Returns the height above the line of sight (positive = above)
  def calculate_drop_at_range(bore_angle, range_ft)
    dt = 0.0005 # time step in seconds (0.5ms)

    # Initial conditions
    vx = @muzzle_velocity * Math.cos(bore_angle)
    vy = @muzzle_velocity * Math.sin(bore_angle)
    x = 0.0
    y = -@sight_height # bore is below the sight line

    while x < range_ft
      v = Math.sqrt(vx * vx + vy * vy)
      retard = drag_deceleration(v)

      # Acceleration components
      ax = -retard * (vx / v)
      ay = -retard * (vy / v) - GRAVITY

      # Update velocity
      vx += ax * dt
      vy += ay * dt

      # Update position
      x += vx * dt
      y += vy * dt
    end

    y # height relative to sight line
  end

  # Full trajectory integration with output at specified intervals
  def integrate_trajectory(bore_angle, max_distance_yards, step_yards)
    dt = 0.0005 # time step (seconds)
    max_range_ft = max_distance_yards * 3.0

    # Initial conditions
    vx = @muzzle_velocity * Math.cos(bore_angle)
    vy = @muzzle_velocity * Math.sin(bore_angle)
    x = 0.0
    y = -@sight_height
    t = 0.0

    results = []
    next_output_ft = step_yards * 3.0 # first output distance in feet

    while x < max_range_ft && vx > 0
      v = Math.sqrt(vx * vx + vy * vy)

      # Stop if bullet goes subsonic and has very low velocity
      break if v < 100.0

      retard = drag_deceleration(v)

      # Acceleration components
      ax = -retard * (vx / v)
      ay = -retard * (vy / v) - GRAVITY

      # Update
      vx += ax * dt
      vy += ay * dt
      x += vx * dt
      y += vy * dt
      t += dt

      # Check if we've reached an output distance
      if x >= next_output_ft
        dist_yards = (next_output_ft / 3.0).round

        # Drop in inches (negative y means below line of sight)
        drop_in = y * 12.0

        # Velocity at this distance
        vel = Math.sqrt(vx * vx + vy * vy)

        # Windage using the lag time method (Bryan Litz method)
        # wind_drift = crosswind * (tof - distance / muzzle_velocity)
        vacuum_tof = (dist_yards * 3.0) / @muzzle_velocity
        wind_drift_ft = @crosswind * (t - vacuum_tof)
        wind_drift_in = wind_drift_ft * 12.0

        # Convert to angular units
        drop_moa = drop_to_moa(drop_in, dist_yards)
        drop_mils = drop_to_mils(drop_in, dist_yards)
        windage_moa = drop_to_moa(wind_drift_in, dist_yards)
        windage_mils = drop_to_mils(wind_drift_in, dist_yards)

        # Energy: KE = mv² / (2 * g * 7000) in ft·lbs
        energy = (@bullet_weight * vel * vel) / 450_437.0

        results << Result.new(
          distance_yards: dist_yards,
          drop_inches: drop_in.round(2),
          drop_moa: drop_moa.round(2),
          drop_mils: drop_mils.round(2),
          windage_inches: wind_drift_in.round(2),
          windage_moa: windage_moa.round(2),
          windage_mils: windage_mils.round(2),
          velocity_fps: vel.round(0).to_i,
          energy_ft_lbs: energy.round(0).to_i,
          time_of_flight_sec: t.round(4)
        )

        next_output_ft += step_yards * 3.0
      end
    end

    results
  end

  # Convert drop in inches to MOA at given distance
  # 1 MOA = 1.04720" at 100 yards
  def drop_to_moa(inches, distance_yards)
    return 0.0 if distance_yards == 0
    inches / (distance_yards * 1.04720 / 100.0)
  end

  # Convert drop in inches to Mils at given distance
  # 1 Mil = 3.6" at 100 yards (true milliradian)
  def drop_to_mils(inches, distance_yards)
    return 0.0 if distance_yards == 0
    inches / (distance_yards * 3.6 / 100.0)
  end

  # ============================================================
  # G1 Standard Drag Coefficient Table
  # [Mach number, Cd]
  # Based on the Ingalls/Mayevski G1 standard projectile
  # ============================================================
  G1_DRAG_TABLE = [
    [0.00, 0.2629], [0.05, 0.2558], [0.10, 0.2487], [0.15, 0.2413],
    [0.20, 0.2344], [0.25, 0.2278], [0.30, 0.2214], [0.35, 0.2155],
    [0.40, 0.2104], [0.45, 0.2061], [0.50, 0.2032], [0.55, 0.2020],
    [0.60, 0.2034], [0.65, 0.2165], [0.70, 0.2230], [0.75, 0.2313],
    [0.80, 0.2417], [0.825, 0.2487], [0.85, 0.2575], [0.875, 0.2691],
    [0.90, 0.2853], [0.925, 0.3136], [0.95, 0.3704], [0.975, 0.4561],
    [1.00, 0.5228], [1.025, 0.5568], [1.05, 0.5756], [1.075, 0.5847],
    [1.10, 0.5890], [1.125, 0.5898], [1.15, 0.5876], [1.20, 0.5769],
    [1.25, 0.5621], [1.30, 0.5466], [1.35, 0.5316], [1.40, 0.5168],
    [1.45, 0.5024], [1.50, 0.4894], [1.55, 0.4772], [1.60, 0.4656],
    [1.65, 0.4548], [1.70, 0.4450], [1.75, 0.4356], [1.80, 0.4268],
    [1.85, 0.4186], [1.90, 0.4112], [1.95, 0.4042], [2.00, 0.3978],
    [2.05, 0.3917], [2.10, 0.3860], [2.15, 0.3805], [2.20, 0.3755],
    [2.25, 0.3706], [2.30, 0.3660], [2.35, 0.3618], [2.40, 0.3577],
    [2.45, 0.3538], [2.50, 0.3502], [2.60, 0.3433], [2.70, 0.3370],
    [2.80, 0.3312], [2.90, 0.3258], [3.00, 0.3208], [3.10, 0.3163],
    [3.20, 0.3122], [3.30, 0.3083], [3.40, 0.3048], [3.50, 0.3016],
    [3.60, 0.2986], [3.70, 0.2959], [3.80, 0.2934], [3.90, 0.2912],
    [4.00, 0.2891], [4.20, 0.2854], [4.40, 0.2823], [4.60, 0.2798],
    [4.80, 0.2779], [5.00, 0.2764]
  ].freeze

  # ============================================================
  # G7 Standard Drag Coefficient Table
  # [Mach number, Cd]
  # Based on the G7 long boat-tail standard projectile
  # Preferred for modern match/VLD bullets
  # ============================================================
  G7_DRAG_TABLE = [
    [0.00, 0.1198], [0.05, 0.1197], [0.10, 0.1196], [0.15, 0.1194],
    [0.20, 0.1193], [0.25, 0.1194], [0.30, 0.1194], [0.35, 0.1194],
    [0.40, 0.1193], [0.45, 0.1193], [0.50, 0.1194], [0.55, 0.1193],
    [0.60, 0.1194], [0.65, 0.1197], [0.70, 0.1202], [0.725, 0.1207],
    [0.75, 0.1215], [0.775, 0.1226], [0.80, 0.1242], [0.825, 0.1266],
    [0.85, 0.1306], [0.875, 0.1368], [0.90, 0.1464], [0.925, 0.1660],
    [0.95, 0.2054], [0.975, 0.2993], [1.00, 0.3803], [1.025, 0.4015],
    [1.05, 0.4043], [1.075, 0.4034], [1.10, 0.4014], [1.125, 0.3987],
    [1.15, 0.3955], [1.20, 0.3884], [1.25, 0.3810], [1.30, 0.3732],
    [1.35, 0.3657], [1.40, 0.3580], [1.50, 0.3440], [1.55, 0.3376],
    [1.60, 0.3315], [1.65, 0.3260], [1.70, 0.3209], [1.75, 0.3160],
    [1.80, 0.3117], [1.85, 0.3078], [1.90, 0.3042], [1.95, 0.3010],
    [2.00, 0.2980], [2.05, 0.2951], [2.10, 0.2922], [2.15, 0.2892],
    [2.20, 0.2864], [2.25, 0.2835], [2.30, 0.2807], [2.35, 0.2779],
    [2.40, 0.2752], [2.45, 0.2725], [2.50, 0.2697], [2.55, 0.2670],
    [2.60, 0.2643], [2.65, 0.2615], [2.70, 0.2588], [2.75, 0.2561],
    [2.80, 0.2533], [2.85, 0.2506], [2.90, 0.2479], [2.95, 0.2451],
    [3.00, 0.2424], [3.50, 0.2141], [4.00, 0.1902], [4.50, 0.1700],
    [5.00, 0.1528]
  ].freeze
end
