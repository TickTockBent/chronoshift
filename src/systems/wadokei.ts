import type { TimeSystemDefinition, UnifiedDisplay, TemporalDialState } from '../types';
import { getAltitudeCrossings } from '../lib/solar';

/**
 * Wadokei: Japanese temporal hours of the Edo period (不定時法, futeiji-hō).
 *
 * Daylight and night are each divided into six equal toki, so a day toki and a
 * night toki have different lengths, and both change through the year.
 *
 * Choices made here:
 * - The system is defined by the sun over Edo (Tokyo), whatever the viewer's
 *   timezone, the same way Swatch time is defined by Biel. All arithmetic is
 *   on UTC instants; the browser's local timezone is never consulted.
 * - Each toki is split into two halves. The second half is named with "-han"
 *   (e.g. 八つ半, Yatsu-han), as Edo-period timekeeping did.
 */

/** Reference location: Edo (modern Tokyo). Latitude north, longitude east. */
const EDO_LATITUDE_DEGREES = 35.6895;
const EDO_LONGITUDE_DEGREES = 139.6917;

/**
 * The day ran from ake-mutsu (dawn) to kure-mutsu (dusk), which were twilight
 * moments, not sunrise and sunset: roughly when the lines on your palm became
 * visible, or stopped being visible. The Kansei calendar (1798) set this as
 * the sun standing 7°21′40″ below the horizon. At Edo's latitude that falls
 * about 36 minutes before sunrise and after sunset.
 */
const AKE_KURE_SUN_ALTITUDE_DEGREES = -(7 + 21 / 60 + 40 / 3600);

const TOKI_PER_HALF_DAY = 6;
const MS_PER_MINUTE = 60_000;

interface TokiInfo {
  kanji: string;
  romaji: string;
  animal: string;
  bells: number;
  /** Name of the bell count rung at the start of this toki */
  bellName: string;
  phase: 'day' | 'night';
}

const BELL_NAMES: Record<number, string> = {
  9: 'Kokonotsu',
  8: 'Yatsu',
  7: 'Nanatsu',
  6: 'Mutsu',
  5: 'Itsutsu',
  4: 'Yotsu',
};

function toki(
  kanji: string,
  romaji: string,
  animal: string,
  bells: number,
  phase: 'day' | 'night',
  bellName = BELL_NAMES[bells]
): TokiInfo {
  return { kanji, romaji, animal, bells, bellName, phase };
}

/**
 * The twelve toki in dial order: clockwise from the top, starting with Uma,
 * which begins at the midpoint of the day (the traditional wadokei layout puts
 * noon at the top). Ne likewise begins at the midpoint of the night.
 */
const TOKI_IN_DIAL_ORDER: TokiInfo[] = [
  toki('午', 'Uma', 'Horse', 9, 'day'),
  toki('未', 'Hitsuji', 'Sheep', 8, 'day'),
  toki('申', 'Saru', 'Monkey', 7, 'day'),
  toki('酉', 'Tori', 'Rooster', 6, 'night', 'Kure-mutsu'),
  toki('戌', 'Inu', 'Dog', 5, 'night'),
  toki('亥', 'I', 'Boar', 4, 'night'),
  toki('子', 'Ne', 'Rat', 9, 'night'),
  toki('丑', 'Ushi', 'Ox', 8, 'night'),
  toki('寅', 'Tora', 'Tiger', 7, 'night'),
  toki('卯', 'U', 'Rabbit', 6, 'day', 'Ake-mutsu'),
  toki('辰', 'Tatsu', 'Dragon', 5, 'day'),
  toki('巳', 'Mi', 'Snake', 4, 'day'),
];

/** Dial-order index of U, the first toki of the morning. */
const FIRST_MORNING_TOKI_INDEX = 9;

interface SolarDay {
  dawnMs: number;
  duskMs: number;
  midpointMs: number;
}

function getEdoSolarDay(instant: Date, dayOffset: number): SolarDay {
  const crossings = getAltitudeCrossings(
    instant,
    EDO_LATITUDE_DEGREES,
    EDO_LONGITUDE_DEGREES,
    AKE_KURE_SUN_ALTITUDE_DEGREES,
    dayOffset
  );
  // Edo never has polar day or night, so both crossings always exist.
  if (!crossings.rising || !crossings.setting) {
    throw new Error('Wadokei: sun did not cross the twilight altitude at Edo');
  }
  const dawnMs = crossings.rising.getTime();
  const duskMs = crossings.setting.getTime();
  return { dawnMs, duskMs, midpointMs: (dawnMs + duskMs) / 2 };
}

interface WadokeiCycle {
  /**
   * 13 instants: the start of each toki in dial order, then the start of the
   * next cycle's Uma. The cycle runs from one day's midpoint to the next, so
   * it covers the afternoon of one day, the night after it, and the morning
   * of the following day, each using that period's own toki length.
   */
  boundariesMs: number[];
  activeIndex: number;
  /** Day toki length of the afternoon / morning in this cycle */
  afternoonTokiMs: number;
  morningTokiMs: number;
  nightTokiMs: number;
}

function getWadokeiCycle(date: Date): WadokeiCycle {
  const instantMs = date.getTime();

  // Solar days around the instant. The cycle containing it starts at the
  // midpoint of day k and ends at the midpoint of day k + 1. Checking from the
  // previous day through the next one covers every case, including the hours
  // before dawn (which belong to the night that began at the *previous*
  // evening's dusk) and instants near a UTC date boundary.
  const solarDays = [-1, 0, 1, 2].map((dayOffset) => getEdoSolarDay(date, dayOffset));
  let cycleDayIndex = 0;
  for (let candidateIndex = 0; candidateIndex < solarDays.length - 1; candidateIndex++) {
    if (
      solarDays[candidateIndex].midpointMs <= instantMs &&
      instantMs < solarDays[candidateIndex + 1].midpointMs
    ) {
      cycleDayIndex = candidateIndex;
      break;
    }
  }

  const currentDay = solarDays[cycleDayIndex];
  const followingDay = solarDays[cycleDayIndex + 1];
  const afternoonTokiMs = (currentDay.duskMs - currentDay.dawnMs) / TOKI_PER_HALF_DAY;
  const nightTokiMs = (followingDay.dawnMs - currentDay.duskMs) / TOKI_PER_HALF_DAY;
  const morningTokiMs = (followingDay.duskMs - followingDay.dawnMs) / TOKI_PER_HALF_DAY;

  const boundariesMs: number[] = [];
  for (let step = 0; step < 3; step++) {
    boundariesMs.push(currentDay.midpointMs + step * afternoonTokiMs);
  }
  for (let step = 0; step < TOKI_PER_HALF_DAY; step++) {
    boundariesMs.push(currentDay.duskMs + step * nightTokiMs);
  }
  for (let step = 0; step < 3; step++) {
    boundariesMs.push(followingDay.dawnMs + step * morningTokiMs);
  }
  boundariesMs.push(followingDay.midpointMs);

  let activeIndex = 0;
  while (
    activeIndex < TOKI_IN_DIAL_ORDER.length - 1 &&
    instantMs >= boundariesMs[activeIndex + 1]
  ) {
    activeIndex++;
  }

  return { boundariesMs, activeIndex, afternoonTokiMs, morningTokiMs, nightTokiMs };
}

function formatDuration(durationMs: number): string {
  const totalMinutes = Math.round(durationMs / MS_PER_MINUTE);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

const wadokei: TimeSystemDefinition = {
  id: 'wadokei',
  name: 'Wadokei (Edo Temporal Hours)',
  description:
    'Edo-period Japanese hours: daylight and night each split into six toki that stretch and shrink with the seasons',
  category: 'cultural',
  tickInterval: 1000,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/Japanese_clock',

  visual: {
    type: 'temporal-dial',
    getDial(date: Date): TemporalDialState {
      const { boundariesMs, activeIndex } = getWadokeiCycle(date);
      const cycleStartMs = boundariesMs[0];
      const cycleLengthMs = boundariesMs[boundariesMs.length - 1] - cycleStartMs;
      return {
        segments: TOKI_IN_DIAL_ORDER.map((tokiInfo, segmentIndex) => ({
          label: tokiInfo.kanji,
          phase: tokiInfo.phase,
          fraction: (boundariesMs[segmentIndex + 1] - boundariesMs[segmentIndex]) / cycleLengthMs,
        })),
        position: (date.getTime() - cycleStartMs) / cycleLengthMs,
        activeIndex,
      };
    },
  },

  format(date: Date): UnifiedDisplay {
    const { boundariesMs, activeIndex, afternoonTokiMs, morningTokiMs, nightTokiMs } =
      getWadokeiCycle(date);
    const activeToki = TOKI_IN_DIAL_ORDER[activeIndex];

    const tokiStartMs = boundariesMs[activeIndex];
    const tokiLengthMs = boundariesMs[activeIndex + 1] - tokiStartMs;
    const isSecondHalf = date.getTime() - tokiStartMs >= tokiLengthMs / 2;
    const bellLabel = isSecondHalf
      ? `${BELL_NAMES[activeToki.bells]}-han (past ${activeToki.bells} bells)`
      : `${activeToki.bellName} (${activeToki.bells} bells)`;

    // Compare the current night with whichever daylight is nearest: the
    // morning's toki once past dawn, otherwise the afternoon's.
    const dayTokiMs = activeIndex >= FIRST_MORNING_TOKI_INDEX ? morningTokiMs : afternoonTokiMs;

    return {
      type: 'unified',
      value: `${activeToki.kanji}の刻`,
      label: `${activeToki.romaji} no koku · Hour of the ${activeToki.animal} · ${bellLabel}`,
      sublabel: `Day toki ≈ ${formatDuration(dayTokiMs)} · Night toki ≈ ${formatDuration(nightTokiMs)} (Edo)`,
    };
  },
};

export default wadokei;
