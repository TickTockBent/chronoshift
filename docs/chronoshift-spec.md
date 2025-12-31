# Chronoshift: Multi-System Time Display

## Overview

A minimalist web application displaying current time across various historical and alternative timekeeping systems. The UI consists of exactly two elements: a system selector dropdown and a time display. The architecture prioritizes data-driven extensibility—adding a new time system should require only creating a single module file and registering it.

---

## Architecture

### Core Principles

1. **Single Responsibility**: Each time system is fully self-contained
2. **Declarative Definition**: Systems declare their structure; the renderer interprets it
3. **No Core Changes**: Adding a system never modifies core application code
4. **Graceful Degradation**: Malformed systems fail silently with console warnings

### Directory Structure

```
src/
├── index.html
├── main.ts                    # Bootstrap, tick loop, UI binding
├── renderer.ts                # Interprets TimeDisplay → DOM
├── registry.ts                # Auto-discovers and validates systems
├── types.ts                   # Shared interfaces
│
├── systems/                   # Each file = one time system
│   ├── standard.ts
│   ├── epoch-seconds.ts
│   ├── kiloseconds.ts
│   ├── decimal-french.ts
│   ├── swatch-beats.ts
│   ├── holocene.ts
│   └── _template.ts           # Copy this to create new systems
│
└── styles/
    └── main.css
```

### Data Flow

```
[setInterval 100ms]
        │
        ▼
   Date.now()
        │
        ▼
┌───────────────────┐
│  Active System    │
│  .format(date)    │
└───────────────────┘
        │
        ▼
   TimeDisplay
        │
        ▼
┌───────────────────┐
│    Renderer       │
│  (interprets      │
│   display type)   │
└───────────────────┘
        │
        ▼
      DOM
```

---

## Time System Module Interface

Every time system exports a single object conforming to `TimeSystemDefinition`:

```typescript
// types.ts

export interface TimeSystemDefinition {
  /** Unique identifier, used as dropdown value */
  id: string;
  
  /** Human-readable name for dropdown */
  name: string;
  
  /** One-line description, shown as tooltip or subtitle */
  description: string;
  
  /** 
   * Category hint for potential future grouping in UI
   * - 'standard': Conventional timekeeping
   * - 'metric': Decimal/SI-based systems
   * - 'epoch': Time-since-reference systems  
   * - 'calendar': Primarily date/era modifications
   * - 'cultural': Historical or regional systems
   */
  category: 'standard' | 'metric' | 'epoch' | 'calendar' | 'cultural';
  
  /** Update interval in ms. Default 1000. Use 86.4 for Swatch, etc. */
  tickInterval?: number;
  
  /** The core transformation function */
  format(date: Date): TimeDisplay;
}
```

### TimeDisplay Union Type

The `format()` function returns one of several display shapes, allowing systems to express fundamentally different structures:

```typescript
export type TimeDisplay = 
  | UnifiedDisplay      // Single value (epoch, beats)
  | SplitDisplay        // Separate date and time
  | SegmentedDisplay;   // Labeled segments (for educational display)

/**
 * For systems that collapse to a single value
 * Examples: Unix epoch, Swatch beats, Julian day number
 */
export interface UnifiedDisplay {
  type: 'unified';
  value: string;           // The formatted value: "1735667122" or "@456"
  prefix?: string;         // Shown before value: "@" for Swatch
  suffix?: string;         // Shown after value: "ks" for kiloseconds
  label?: string;          // Explanatory label: "seconds since Jan 1, 1970"
  sublabel?: string;       // Secondary info: "Day 366 of 2025"
}

/**
 * For systems with distinct date and time components
 * Examples: Standard, Holocene, French Revolutionary
 */
export interface SplitDisplay {
  type: 'split';
  date: {
    formatted: string;     // "December 31, 2025" or "10 Nivôse CCXXXIV"
    era?: string;          // "CE", "HE", "Year of the Republic"
  };
  time: {
    formatted: string;     // "15:45:22" or "6:45:67"
    period?: string;       // "PM" if using 12-hour
    unitLabels?: string[]; // ["hours", "minutes", "seconds"] for tooltips
  };
  separator?: string;      // What goes between date and time. Default " • "
}

/**
 * For educational/exploratory displays showing labeled segments
 * Example: Breaking down exactly how decimal time maps
 */
export interface SegmentedDisplay {
  type: 'segmented';
  segments: Array<{
    value: string | number;
    label: string;
    sublabel?: string;     // e.g., "≈ 86.4 standard seconds"
  }>;
  separator?: string;      // Between segments. Default ":"
}
```

---

## Registry System

### registry.ts

```typescript
import type { TimeSystemDefinition } from './types';

// Static imports for build-time inclusion
// Add new systems here
import standard from './systems/standard';
import epochSeconds from './systems/epoch-seconds';
import kiloseconds from './systems/kiloseconds';
import decimalFrench from './systems/decimal-french';
import swatchBeats from './systems/swatch-beats';
import holocene from './systems/holocene';

const systems: TimeSystemDefinition[] = [
  standard,
  epochSeconds,
  kiloseconds,
  decimalFrench,
  swatchBeats,
  holocene,
];

// Validation on load
const registry = new Map<string, TimeSystemDefinition>();

for (const system of systems) {
  if (!validateSystem(system)) {
    console.warn(`[Chronoshift] Invalid system definition: ${system.id ?? 'unknown'}`);
    continue;
  }
  if (registry.has(system.id)) {
    console.warn(`[Chronoshift] Duplicate system ID: ${system.id}`);
    continue;
  }
  registry.set(system.id, system);
}

function validateSystem(s: unknown): s is TimeSystemDefinition {
  if (!s || typeof s !== 'object') return false;
  const sys = s as Record<string, unknown>;
  return (
    typeof sys.id === 'string' &&
    typeof sys.name === 'string' &&
    typeof sys.description === 'string' &&
    typeof sys.format === 'function'
  );
}

export function getAllSystems(): TimeSystemDefinition[] {
  return Array.from(registry.values());
}

export function getSystem(id: string): TimeSystemDefinition | undefined {
  return registry.get(id);
}

export function getDefaultSystem(): TimeSystemDefinition {
  return registry.get('standard') ?? Array.from(registry.values())[0];
}
```

### Adding a New System

1. Create `src/systems/my-new-system.ts`
2. Import and add to the `systems` array in `registry.ts`
3. Done

Future enhancement: dynamic imports via `import.meta.glob` for zero-touch registration.

---

## Example System Implementations

### standard.ts

```typescript
import type { TimeSystemDefinition, SplitDisplay } from '../types';

const standard: TimeSystemDefinition = {
  id: 'standard',
  name: 'Standard Time',
  description: 'Gregorian calendar with 24-hour time',
  category: 'standard',
  tickInterval: 1000,
  
  format(date: Date): SplitDisplay {
    return {
      type: 'split',
      date: {
        formatted: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        era: 'CE',
      },
      time: {
        formatted: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        unitLabels: ['hours', 'minutes', 'seconds'],
      },
    };
  },
};

export default standard;
```

### epoch-seconds.ts

```typescript
import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const epochSeconds: TimeSystemDefinition = {
  id: 'epoch-seconds',
  name: 'Unix Epoch',
  description: 'Seconds elapsed since January 1, 1970 00:00:00 UTC',
  category: 'epoch',
  tickInterval: 1000,
  
  format(date: Date): UnifiedDisplay {
    const seconds = Math.floor(date.getTime() / 1000);
    return {
      type: 'unified',
      value: seconds.toLocaleString(),
      label: 'seconds since epoch',
      sublabel: 'January 1, 1970 00:00:00 UTC',
    };
  },
};

export default epochSeconds;
```

### swatch-beats.ts

```typescript
import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const swatchBeats: TimeSystemDefinition = {
  id: 'swatch-beats',
  name: 'Swatch Internet Time',
  description: 'Day divided into 1000 .beats, referenced to Biel, Switzerland',
  category: 'metric',
  tickInterval: 86.4, // One beat = 86.4 seconds
  
  format(date: Date): UnifiedDisplay {
    // Convert to Biel Mean Time (UTC+1)
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const biel = new Date(utc + 3600000);
    
    const midnight = new Date(biel);
    midnight.setHours(0, 0, 0, 0);
    
    const msIntoDay = biel.getTime() - midnight.getTime();
    const beats = Math.floor(msIntoDay / 86400); // 86400ms = 1 beat
    
    return {
      type: 'unified',
      prefix: '@',
      value: beats.toString().padStart(3, '0'),
      label: '.beats',
      sublabel: 'No time zones. @000 = midnight in Biel.',
    };
  },
};

export default swatchBeats;
```

### decimal-french.ts

```typescript
import type { TimeSystemDefinition, SplitDisplay } from '../types';

const MONTHS = [
  'Vendémiaire', 'Brumaire', 'Frimaire',  // Autumn
  'Nivôse', 'Pluviôse', 'Ventôse',        // Winter
  'Germinal', 'Floréal', 'Prairéal',      // Spring
  'Messidor', 'Thermidor', 'Fructidor',   // Summer
];

const COMPLEMENTARY = [
  'La Fête de la Vertu',
  'La Fête du Génie', 
  'La Fête du Travail',
  'La Fête de l\'Opinion',
  'La Fête des Récompenses',
  'La Fête de la Révolution', // Leap years only
];

function toRomanNumeral(num: number): string {
  const lookup: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
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

function gregorianToRepublican(date: Date): { year: number; month: number; day: number; isComplementary: boolean } {
  // Republican epoch: September 22, 1792
  const epoch = new Date(1792, 8, 22); // Month is 0-indexed
  const msPerDay = 86400000;
  
  // This is a simplified calculation - proper implementation needs
  // leap year handling for both calendars
  const daysSinceEpoch = Math.floor((date.getTime() - epoch.getTime()) / msPerDay);
  
  // Each year has 365 days (360 regular + 5-6 complementary)
  // Simplified: assuming 365-day years
  const year = Math.floor(daysSinceEpoch / 365) + 1;
  const dayOfYear = daysSinceEpoch % 365;
  
  if (dayOfYear >= 360) {
    return {
      year,
      month: -1,
      day: dayOfYear - 360,
      isComplementary: true,
    };
  }
  
  return {
    year,
    month: Math.floor(dayOfYear / 30),
    day: (dayOfYear % 30) + 1,
    isComplementary: false,
  };
}

const decimalFrench: TimeSystemDefinition = {
  id: 'decimal-french',
  name: 'French Republican',
  description: 'Revolutionary decimal time: 10 hours/day, 100 min/hour, 100 sec/min',
  category: 'cultural',
  tickInterval: 864, // Decimal second ≈ 864ms
  
  format(date: Date): SplitDisplay {
    // Calendar conversion
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
      dateStr = COMPLEMENTARY[rep.day] ?? `Complementary Day ${rep.day + 1}`;
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
        unitLabels: ['décades', 'minutes décimales', 'secondes décimales'],
      },
      separator: ' — ',
    };
  },
};

export default decimalFrench;
```

### holocene.ts

```typescript
import type { TimeSystemDefinition, SplitDisplay } from '../types';

const holocene: TimeSystemDefinition = {
  id: 'holocene',
  name: 'Holocene Era',
  description: 'Adds 10,000 years to represent the Human Era (HE)',
  category: 'calendar',
  tickInterval: 1000,
  
  format(date: Date): SplitDisplay {
    const holoceneYear = date.getFullYear() + 10000;
    
    return {
      type: 'split',
      date: {
        formatted: date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        }) + `, ${holoceneYear.toLocaleString()}`,
        era: 'HE',
      },
      time: {
        formatted: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      },
    };
  },
};

export default holocene;
```

### kiloseconds.ts

```typescript
import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const kiloseconds: TimeSystemDefinition = {
  id: 'kiloseconds',
  name: 'Kiloseconds',
  description: 'SI-prefix time: today measured in kiloseconds',
  category: 'metric',
  tickInterval: 1000,
  
  format(date: Date): UnifiedDisplay {
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    const secondsIntoDay = (date.getTime() - midnight.getTime()) / 1000;
    const ks = (secondsIntoDay / 1000).toFixed(3);
    
    const dayOfYear = Math.floor(
      (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
    );
    
    return {
      type: 'unified',
      value: ks,
      suffix: ' ks',
      label: 'kiloseconds today',
      sublabel: `Day ${dayOfYear} of ${date.getFullYear()}`,
    };
  },
};

export default kiloseconds;
```

---

## Renderer Specification

The renderer consumes `TimeDisplay` objects and produces DOM updates:

```typescript
// renderer.ts

import type { TimeDisplay, UnifiedDisplay, SplitDisplay, SegmentedDisplay } from './types';

export function render(display: TimeDisplay, container: HTMLElement): void {
  container.innerHTML = ''; // Clear previous
  container.className = `display display--${display.type}`;
  
  switch (display.type) {
    case 'unified':
      renderUnified(display, container);
      break;
    case 'split':
      renderSplit(display, container);
      break;
    case 'segmented':
      renderSegmented(display, container);
      break;
  }
}

function renderUnified(d: UnifiedDisplay, container: HTMLElement): void {
  const main = document.createElement('div');
  main.className = 'display__main';
  
  if (d.prefix) {
    const prefix = document.createElement('span');
    prefix.className = 'display__prefix';
    prefix.textContent = d.prefix;
    main.appendChild(prefix);
  }
  
  const value = document.createElement('span');
  value.className = 'display__value';
  value.textContent = d.value;
  main.appendChild(value);
  
  if (d.suffix) {
    const suffix = document.createElement('span');
    suffix.className = 'display__suffix';
    suffix.textContent = d.suffix;
    main.appendChild(suffix);
  }
  
  container.appendChild(main);
  
  if (d.label) {
    const label = document.createElement('div');
    label.className = 'display__label';
    label.textContent = d.label;
    container.appendChild(label);
  }
  
  if (d.sublabel) {
    const sublabel = document.createElement('div');
    sublabel.className = 'display__sublabel';
    sublabel.textContent = d.sublabel;
    container.appendChild(sublabel);
  }
}

function renderSplit(d: SplitDisplay, container: HTMLElement): void {
  const dateEl = document.createElement('div');
  dateEl.className = 'display__date';
  dateEl.textContent = d.date.formatted;
  if (d.date.era) {
    const era = document.createElement('span');
    era.className = 'display__era';
    era.textContent = ` ${d.date.era}`;
    dateEl.appendChild(era);
  }
  
  const timeEl = document.createElement('div');
  timeEl.className = 'display__time';
  timeEl.textContent = d.time.formatted;
  if (d.time.period) {
    const period = document.createElement('span');
    period.className = 'display__period';
    period.textContent = ` ${d.time.period}`;
    timeEl.appendChild(period);
  }
  
  container.appendChild(dateEl);
  
  const sep = document.createElement('span');
  sep.className = 'display__separator';
  sep.textContent = d.separator ?? ' • ';
  container.appendChild(sep);
  
  container.appendChild(timeEl);
}

function renderSegmented(d: SegmentedDisplay, container: HTMLElement): void {
  const segments = document.createElement('div');
  segments.className = 'display__segments';
  
  d.segments.forEach((seg, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'display__seg-separator';
      sep.textContent = d.separator ?? ':';
      segments.appendChild(sep);
    }
    
    const segEl = document.createElement('div');
    segEl.className = 'display__segment';
    
    const val = document.createElement('span');
    val.className = 'display__seg-value';
    val.textContent = String(seg.value);
    segEl.appendChild(val);
    
    const label = document.createElement('span');
    label.className = 'display__seg-label';
    label.textContent = seg.label;
    segEl.appendChild(label);
    
    segments.appendChild(segEl);
  });
  
  container.appendChild(segments);
}
```

---

## Main Application Bootstrap

```typescript
// main.ts

import { getAllSystems, getSystem, getDefaultSystem } from './registry';
import { render } from './renderer';

const selector = document.getElementById('system-selector') as HTMLSelectElement;
const display = document.getElementById('time-display') as HTMLElement;

let currentSystem = getDefaultSystem();
let tickHandle: number;

function populateSelector(): void {
  const systems = getAllSystems();
  
  // Optional: group by category
  const byCategory = new Map<string, typeof systems>();
  for (const sys of systems) {
    const cat = sys.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(sys);
  }
  
  // Simple flat list for now
  for (const sys of systems) {
    const option = document.createElement('option');
    option.value = sys.id;
    option.textContent = sys.name;
    option.title = sys.description;
    selector.appendChild(option);
  }
}

function tick(): void {
  const now = new Date();
  const output = currentSystem.format(now);
  render(output, display);
}

function switchSystem(id: string): void {
  const sys = getSystem(id);
  if (!sys) return;
  
  currentSystem = sys;
  clearInterval(tickHandle);
  tick(); // Immediate update
  tickHandle = setInterval(tick, sys.tickInterval ?? 1000);
  
  // Persist preference
  localStorage.setItem('chronoshift-system', id);
}

function init(): void {
  populateSelector();
  
  // Restore preference
  const saved = localStorage.getItem('chronoshift-system');
  if (saved && getSystem(saved)) {
    selector.value = saved;
    switchSystem(saved);
  } else {
    tick();
    tickHandle = setInterval(tick, currentSystem.tickInterval ?? 1000);
  }
  
  selector.addEventListener('change', (e) => {
    switchSystem((e.target as HTMLSelectElement).value);
  });
}

init();
```

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chronoshift</title>
  <link rel="stylesheet" href="styles/main.css">
</head>
<body>
  <main class="chronoshift">
    <select id="system-selector" aria-label="Select time system"></select>
    <div id="time-display" aria-live="polite" aria-atomic="true"></div>
  </main>
  <script type="module" src="main.ts"></script>
</body>
</html>
```

---

## Future Extensibility

### Planned Systems

| System | Category | Notes |
|--------|----------|-------|
| Julian Day Number | epoch | Days since 4713 BCE |
| Mars Sol Date | cultural | For space nerds |
| Stardate | cultural | Trek-style, multiple interpretations |
| Decimal Degrees | metric | 360° day like New Earth Time |
| TAI | standard | International Atomic Time (no leap seconds) |
| .NET Ticks | epoch | 100-nanosecond intervals since 0001-01-01 |

### Potential Enhancements

1. **Dynamic Registration**: Use `import.meta.glob('./systems/*.ts')` for zero-config addition
2. **Theme per System**: Systems can export optional CSS variables
3. **Conversion Mode**: Show equivalents across all systems simultaneously
4. **Historical Mode**: Enter any date to see it in all systems
5. **Timezone Override**: For systems that are timezone-dependent
6. **Sound**: Optional tick sounds, especially satisfying for decimal systems

---

## Notes on Accuracy

The French Republican calendar implementation is simplified. A production version should:

- Handle leap years properly (années sextiles)
- Account for the calendar's actual historical usage period (1793-1805)
- Consider that Year I started September 22, 1792 but the calendar wasn't adopted until October 1793

Similarly, the Holocene calendar is a simple +10000 offset, but serious proposals sometimes adjust the epoch to the vernal equinox.

For a "fun" project, these simplifications are fine. Document them in each system's `description` if desired.
