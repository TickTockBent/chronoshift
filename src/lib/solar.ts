/**
 * Dependency-free solar position and rise/set calculations.
 *
 * Based on the NOAA solar calculator equations (a simplification of Jean
 * Meeus, "Astronomical Algorithms"). Accuracy is about a minute for
 * mid-latitudes over the years 1800-2100, which is far finer than any
 * historical timekeeping system built on top of it needs.
 *
 * Everything here works in absolute UTC instants (epoch milliseconds); the
 * browser's local timezone is never consulted.
 */

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;
const JULIAN_DAY_OF_UNIX_EPOCH = 2440587.5;
const JULIAN_DAY_OF_J2000 = 2451545;
const DAYS_PER_JULIAN_CENTURY = 36525;

/** Standard altitude for sunrise/sunset: refraction plus the sun's radius. */
export const SUNRISE_ALTITUDE_DEGREES = -0.833;

/** Number of refinement passes when solving for a crossing instant. */
const CROSSING_REFINEMENT_PASSES = 4;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export interface SolarCoordinates {
  /** Solar declination in degrees */
  declinationDegrees: number;
  /** Equation of time in minutes (apparent solar time minus mean solar time) */
  equationOfTimeMinutes: number;
}

/** Sun declination and equation of time at an instant (NOAA formulation). */
export function getSolarCoordinates(instantMs: number): SolarCoordinates {
  const julianDay = instantMs / MS_PER_DAY + JULIAN_DAY_OF_UNIX_EPOCH;
  const julianCentury = (julianDay - JULIAN_DAY_OF_J2000) / DAYS_PER_JULIAN_CENTURY;

  const meanLongitudeDegrees =
    (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
  const meanAnomalyDegrees =
    357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
  const orbitEccentricity =
    0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);

  const meanAnomalyRadians = toRadians(meanAnomalyDegrees);
  const equationOfCenterDegrees =
    Math.sin(meanAnomalyRadians) *
      (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) +
    Math.sin(2 * meanAnomalyRadians) * (0.019993 - 0.000101 * julianCentury) +
    Math.sin(3 * meanAnomalyRadians) * 0.000289;

  const trueLongitudeDegrees = meanLongitudeDegrees + equationOfCenterDegrees;
  const ascendingNodeDegrees = 125.04 - 1934.136 * julianCentury;
  const apparentLongitudeDegrees =
    trueLongitudeDegrees - 0.00569 - 0.00478 * Math.sin(toRadians(ascendingNodeDegrees));

  const meanObliquityDegrees =
    23 +
    (26 +
      (21.448 -
        julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813))) /
        60) /
      60;
  const correctedObliquityDegrees =
    meanObliquityDegrees + 0.00256 * Math.cos(toRadians(ascendingNodeDegrees));

  const declinationDegrees = toDegrees(
    Math.asin(
      Math.sin(toRadians(correctedObliquityDegrees)) *
        Math.sin(toRadians(apparentLongitudeDegrees))
    )
  );

  const obliquityTerm = Math.tan(toRadians(correctedObliquityDegrees) / 2) ** 2;
  const meanLongitudeRadians = toRadians(meanLongitudeDegrees);
  const equationOfTimeRadians =
    obliquityTerm * Math.sin(2 * meanLongitudeRadians) -
    2 * orbitEccentricity * Math.sin(meanAnomalyRadians) +
    4 *
      orbitEccentricity *
      obliquityTerm *
      Math.sin(meanAnomalyRadians) *
      Math.cos(2 * meanLongitudeRadians) -
    0.5 * obliquityTerm ** 2 * Math.sin(4 * meanLongitudeRadians) -
    1.25 * orbitEccentricity ** 2 * Math.sin(2 * meanAnomalyRadians);

  return {
    declinationDegrees,
    equationOfTimeMinutes: 4 * toDegrees(equationOfTimeRadians),
  };
}

/**
 * Sun altitude in degrees (geometric, no refraction) at an instant and place.
 * Longitude is positive east.
 */
export function getSunAltitude(
  instantMs: number,
  latitudeDegrees: number,
  longitudeDegrees: number
): number {
  const { declinationDegrees, equationOfTimeMinutes } = getSolarCoordinates(instantMs);
  const minutesIntoUtcDay = (((instantMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY) / MS_PER_MINUTE;
  const trueSolarTimeMinutes =
    minutesIntoUtcDay + equationOfTimeMinutes + 4 * longitudeDegrees;
  const hourAngleRadians = toRadians(trueSolarTimeMinutes / 4 - 180);
  const latitudeRadians = toRadians(latitudeDegrees);
  const declinationRadians = toRadians(declinationDegrees);
  return toDegrees(
    Math.asin(
      Math.sin(latitudeRadians) * Math.sin(declinationRadians) +
        Math.cos(latitudeRadians) * Math.cos(declinationRadians) * Math.cos(hourAngleRadians)
    )
  );
}

/**
 * Hour angle (degrees from the meridian) at which the sun stands at the given
 * altitude, or null if it never reaches that altitude (polar day/night).
 */
function getHourAngleForAltitude(
  latitudeDegrees: number,
  declinationDegrees: number,
  altitudeDegrees: number
): number | null {
  const latitudeRadians = toRadians(latitudeDegrees);
  const declinationRadians = toRadians(declinationDegrees);
  const cosineOfHourAngle =
    (Math.sin(toRadians(altitudeDegrees)) -
      Math.sin(latitudeRadians) * Math.sin(declinationRadians)) /
    (Math.cos(latitudeRadians) * Math.cos(declinationRadians));
  if (cosineOfHourAngle < -1 || cosineOfHourAngle > 1) return null;
  return toDegrees(Math.acos(cosineOfHourAngle));
}

/**
 * Instant (UTC ms) at which local *mean* solar time is noon, for the solar day
 * nearest to `instantMs`, shifted by `dayOffset` whole days.
 */
function getMeanSolarNoonMs(instantMs: number, longitudeDegrees: number, dayOffset: number): number {
  // Mean noon falls (720 - 4 * longitude) minutes after 00:00 UTC.
  const meanNoonOffsetMs = (720 - 4 * longitudeDegrees) * MS_PER_MINUTE;
  const nearestDayIndex = Math.round((instantMs - meanNoonOffsetMs) / MS_PER_DAY);
  return (nearestDayIndex + dayOffset) * MS_PER_DAY + meanNoonOffsetMs;
}

/**
 * Solve for the instant the sun crosses `altitudeDegrees` on the solar day
 * whose mean noon is `meanNoonMs`. `side` is -1 for the morning (rising)
 * crossing and +1 for the evening (setting) one. Declination and equation of
 * time are re-evaluated at each estimate, so the answer converges on the
 * actual crossing rather than one computed from noon's sun.
 */
function solveCrossing(
  meanNoonMs: number,
  latitudeDegrees: number,
  altitudeDegrees: number,
  side: -1 | 1
): number | null {
  let crossingEstimateMs = meanNoonMs;
  for (let pass = 0; pass < CROSSING_REFINEMENT_PASSES; pass++) {
    const { declinationDegrees, equationOfTimeMinutes } =
      getSolarCoordinates(crossingEstimateMs);
    const hourAngleDegrees = getHourAngleForAltitude(
      latitudeDegrees,
      declinationDegrees,
      altitudeDegrees
    );
    if (hourAngleDegrees === null) return null;
    crossingEstimateMs =
      meanNoonMs +
      (-equationOfTimeMinutes + side * 4 * hourAngleDegrees) * MS_PER_MINUTE;
  }
  return crossingEstimateMs;
}

export interface SolarDayCrossings {
  /** Apparent (true) solar noon */
  solarNoon: Date;
  /** When the sun climbs through the altitude, or null if it never does */
  rising: Date | null;
  /** When the sun sinks through the altitude, or null if it never does */
  setting: Date | null;
}

/**
 * Morning and evening instants at which the sun's centre crosses
 * `altitudeDegrees` (negative = below the horizon) at a location, for the
 * solar day whose noon is nearest to `instant`. Use `dayOffset` to step to
 * neighbouring solar days (-1 = the day before, +1 = the day after).
 * Latitude is positive north, longitude positive east.
 */
export function getAltitudeCrossings(
  instant: Date,
  latitudeDegrees: number,
  longitudeDegrees: number,
  altitudeDegrees: number,
  dayOffset = 0
): SolarDayCrossings {
  const meanNoonMs = getMeanSolarNoonMs(instant.getTime(), longitudeDegrees, dayOffset);
  const noonEquationOfTimeMinutes = getSolarCoordinates(meanNoonMs).equationOfTimeMinutes;
  const risingMs = solveCrossing(meanNoonMs, latitudeDegrees, altitudeDegrees, -1);
  const settingMs = solveCrossing(meanNoonMs, latitudeDegrees, altitudeDegrees, 1);
  return {
    solarNoon: new Date(meanNoonMs - noonEquationOfTimeMinutes * MS_PER_MINUTE),
    rising: risingMs === null ? null : new Date(risingMs),
    setting: settingMs === null ? null : new Date(settingMs),
  };
}
