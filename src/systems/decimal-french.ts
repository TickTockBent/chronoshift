import type { TimeSystemDefinition, SplitDisplay } from '../types';

const MONTHS = [
  'Vendémiaire',
  'Brumaire',
  'Frimaire',
  'Nivôse',
  'Pluviôse',
  'Ventôse',
  'Germinal',
  'Floréal',
  'Prairial',
  'Messidor',
  'Thermidor',
  'Fructidor',
];

const COMPLEMENTARY = [
  'La Fête de la Vertu',
  'La Fête du Génie',
  'La Fête du Travail',
  "La Fête de l'Opinion",
  'La Fête des Récompenses',
  'La Fête de la Révolution',
];

function toRomanNumeral(num: number): string {
  const lookup: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  for (const [value, numeral] of lookup) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

function isRepublicanLeapYear(year: number): boolean {
  // Republican leap years: III, VII, XI, XV... (every 4 years starting from III)
  // Also years divisible by 4 after year 20, excluding centuries not divisible by 400
  if (year < 3) return false;
  if (year <= 20) return (year - 3) % 4 === 0;
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function gregorianToRepublican(date: Date): {
  year: number;
  month: number;
  day: number;
  isComplementary: boolean;
} {
  // Republican epoch: September 22, 1792 (Gregorian)
  const epochYear = 1792;
  const epochMonth = 8; // September (0-indexed)
  const epochDay = 22;

  const epoch = new Date(epochYear, epochMonth, epochDay);
  const msPerDay = 86400000;

  const daysSinceEpoch = Math.floor(
    (date.getTime() - epoch.getTime()) / msPerDay
  );

  if (daysSinceEpoch < 0) {
    // Before the epoch - return year 0 placeholder
    return { year: 0, month: 0, day: 1, isComplementary: false };
  }

  // Count through years accounting for leap years
  let remainingDays = daysSinceEpoch;
  let year = 1;

  while (true) {
    const daysInYear = isRepublicanLeapYear(year) ? 366 : 365;
    if (remainingDays < daysInYear) break;
    remainingDays -= daysInYear;
    year++;
  }

  // Check if we're in the complementary days (days 360-364 or 360-365 for leap years)
  if (remainingDays >= 360) {
    return {
      year,
      month: -1,
      day: remainingDays - 360,
      isComplementary: true,
    };
  }

  return {
    year,
    month: Math.floor(remainingDays / 30),
    day: (remainingDays % 30) + 1,
    isComplementary: false,
  };
}

const decimalFrench: TimeSystemDefinition = {
  id: 'decimal-french',
  name: 'French Republican',
  description:
    'Revolutionary decimal time: 10 hours/day, 100 min/hour, 100 sec/min',
  category: 'cultural',
  tickInterval: 864,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/French_Republican_calendar',

  format(date: Date): SplitDisplay {
    const rep = gregorianToRepublican(date);

    // Decimal time conversion
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    const msIntoDay = date.getTime() - midnight.getTime();
    const fractionOfDay = msIntoDay / 86400000;

    const decimalSeconds = Math.floor(fractionOfDay * 100000);
    const hours = Math.floor(decimalSeconds / 10000);
    const minutes = Math.floor((decimalSeconds % 10000) / 100);
    const seconds = decimalSeconds % 100;

    const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    let dateStr: string;
    if (rep.isComplementary) {
      dateStr = COMPLEMENTARY[rep.day] ?? `Jour complémentaire ${rep.day + 1}`;
    } else {
      dateStr = `${rep.day} ${MONTHS[rep.month]}`;
    }

    return {
      type: 'split',
      date: {
        formatted: dateStr,
        era: `An ${toRomanNumeral(rep.year)}`,
      },
      time: {
        formatted: timeStr,
        unitLabels: ['heures', 'minutes décimales', 'secondes décimales'],
      },
      separator: ' — ',
    };
  },
};

export default decimalFrench;
