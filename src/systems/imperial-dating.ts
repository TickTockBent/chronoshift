import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

/**
 * Imperial Dating System (Warhammer 40,000).
 *
 * Dates are written as `C FFF YYY.Mmm`:
 * - C: check number, how reliably the date is known. 0 means the event was
 *   observed on Terra itself, which is true of anyone reading this screen.
 * - FFF: year fraction, the year split into 1000 equal parts of 8.766 hours,
 *   using the canonical constant 0.11407955 fractions per hour.
 * - YYY: year within the millennium (000-999).
 * - Mmm: millennium. 2026 CE is 026.M3, just as 40,999 CE is 999.M41.
 *
 * Choices made here:
 * - Terran standard time is taken to be UTC, so the date is the same for
 *   every viewer, like Swatch time.
 * - The Emperor's revelation, the end of the Age of Strife when he revealed
 *   himself and began the Unification Wars, is dated only "c. M30" in the
 *   lore. We use the start of that millennium, 000.M30 (1 January 29,000 CE).
 * - Eras are bounded at the start of the named millennium, so "M15" is the
 *   Gregorian year 14,000. The lore dates them only to the millennium.
 */

const FRACTIONS_PER_HOUR = 0.11407955;
const FRACTIONS_PER_YEAR = 1000;
const CHECK_NUMBER_TERRA = 0;

/** Gregorian year of the Emperor's revelation, 000.M30 */
const REVELATION_YEAR = 29000;
const REVELATION_LABEL = '000.M30';

/** First Gregorian year of an Imperial millennium: M1 is 0, M41 is 40,000 */
function millenniumStart(millennium: number): number {
  return (millennium - 1) * 1000;
}

/** The ages of Terra between M1 and the revelation, per Imperial history */
const ERAS = [
  { label: 'Age of Terra', from: 1, to: 15 },
  { label: 'Dark Age of Technology', from: 15, to: 25 },
  { label: 'Age of Strife', from: 25, to: 30 },
].map((era) => ({
  label: era.label,
  start: millenniumStart(era.from),
  end: millenniumStart(era.to),
}));

const ERA_TICKS = [1, 15, 25, 30].map((millennium) => ({
  at: millenniumStart(millennium),
  label: `M${millennium}`,
}));

function getFractionProgress(date: Date): number {
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const hoursIntoYear = (date.getTime() - yearStart) / 3600000;
  // A Gregorian year can run a little past 1000 fractions; hold at 999.
  return Math.min(hoursIntoYear * FRACTIONS_PER_HOUR, FRACTIONS_PER_YEAR - 1e-9);
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}

const imperialDating: TimeSystemDefinition = {
  id: 'imperial-dating',
  name: 'Imperial Dating',
  description:
    'Warhammer 40,000 Imperial date, counting up to the revelation of the Emperor in 000.M30',
  category: 'calendar',
  tickInterval: 1000,
  learnMoreUrl: 'https://wh40k.lexicanum.com/wiki/Imperial_Dating_System',

  visual: {
    type: 'timeline',
    getTimeline(date: Date) {
      const year = date.getUTCFullYear();
      return {
        start: millenniumStart(1),
        end: REVELATION_YEAR,
        eras: ERAS,
        ticks: ERA_TICKS,
        marker: {
          at: year + getFractionProgress(date) / FRACTIONS_PER_YEAR,
          label: `${pad3(year % 1000)}.M${Math.floor(year / 1000) + 1}`,
        },
      };
    },
  },

  format(date: Date): UnifiedDisplay {
    const year = date.getUTCFullYear();
    const fraction = Math.floor(getFractionProgress(date));
    const millennium = Math.floor(year / 1000) + 1;

    const remaining = Math.max(
      0,
      (REVELATION_YEAR - year) * FRACTIONS_PER_YEAR - fraction
    );
    const yearsLeft = Math.floor(remaining / FRACTIONS_PER_YEAR);
    const fractionsLeft = remaining % FRACTIONS_PER_YEAR;

    return {
      type: 'unified',
      value: `${CHECK_NUMBER_TERRA} ${pad3(fraction)} ${pad3(year % 1000)}.M${millennium}`,
      label: 'check · year fraction · year · millennium',
      sublabel:
        remaining > 0
          ? `${yearsLeft.toLocaleString()} years, ${fractionsLeft} fractions until the Emperor reveals Himself (${REVELATION_LABEL})`
          : `The Emperor has revealed Himself (${REVELATION_LABEL}). The Emperor protects.`,
    };
  },
};

export default imperialDating;
