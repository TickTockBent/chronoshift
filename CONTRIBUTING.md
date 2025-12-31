# Contributing to Chronoshift

Thanks for your interest in contributing! The easiest way to contribute is by adding a new time system.

## Adding a New Time System

Adding a time system requires only two steps:

### 1. Create the System Module

Create a new file in `src/systems/` (e.g., `src/systems/my-system.ts`):

```typescript
import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const mySystem: TimeSystemDefinition = {
  id: 'my-system',           // Unique identifier (used in URL/storage)
  name: 'My Time System',    // Display name in dropdown
  description: 'Brief description of this time system',
  category: 'metric',        // One of: 'standard' | 'metric' | 'epoch' | 'calendar' | 'cultural'
  tickInterval: 1000,        // Update interval in ms (default: 1000)
  learnMoreUrl: 'https://en.wikipedia.org/wiki/...', // Optional Wikipedia/reference link

  format(date: Date): UnifiedDisplay {
    // Transform the Date into your time system's representation
    return {
      type: 'unified',
      value: '42',
      label: 'some unit',
    };
  },
};

export default mySystem;
```

### 2. Register the System

Add your import and register it in `src/registry.ts`:

```typescript
import mySystem from './systems/my-system';

const systems: TimeSystemDefinition[] = [
  standard,
  epochSeconds,
  // ... existing systems
  mySystem,  // Add yours here
];
```

That's it! The app will automatically pick up your new system.

## Display Types

Your `format()` function can return one of three display types:

### UnifiedDisplay

For single-value displays (epoch timestamps, beats, etc.):

```typescript
{
  type: 'unified',
  value: '1735689600',
  prefix: '@',           // Optional: shown before value
  suffix: ' ks',         // Optional: shown after value
  label: 'description',  // Optional: shown below
  sublabel: 'extra info' // Optional: secondary text
}
```

### SplitDisplay

For date + time displays (calendars):

```typescript
{
  type: 'split',
  date: {
    formatted: 'December 31, 2025',
    era: 'CE'  // Optional
  },
  time: {
    formatted: '23:59:59',
    period: 'PM',              // Optional: for 12-hour time
    unitLabels: ['h', 'm', 's'] // Optional: for tooltips
  },
  separator: ' • '  // Optional: between date and time
}
```

### SegmentedDisplay

For educational breakdowns:

```typescript
{
  type: 'segmented',
  segments: [
    { value: '10', label: 'hours' },
    { value: '45', label: 'minutes' },
  ],
  separator: ':'  // Optional
}
```

## Visual Elements (Optional)

Time systems can include an optional visual representation displayed below the text. Three visual types are available:

### ProgressBarVisual

A horizontal bar showing progress through a cycle (good for metric systems):

```typescript
visual: {
  type: 'progress-bar',
  max: 86.4,  // Maximum value (e.g., kiloseconds in a day)
  getValue(date: Date) {
    const midnight = new Date(date);
    midnight.setHours(0, 0, 0, 0);
    return (date.getTime() - midnight.getTime()) / 1000000;
  },
},
```

### ProgressRingVisual

A circular ring showing progress (good for cyclical systems like Swatch beats):

```typescript
visual: {
  type: 'progress-ring',
  max: 1000,  // Maximum value (e.g., 1000 beats)
  getValue(date: Date) {
    // Return current value (0 to max)
    return calculateBeats(date);
  },
},
```

### ClockVisual

An analog clock face with configurable divisions:

```typescript
visual: {
  type: 'clock',
  divisions: 12,  // 12 for standard, 10 for decimal
  getHands(date: Date) {
    return {
      hour: hours,      // Position in terms of divisions (0-12 or 0-10)
      minute: minutes,  // Position as 0-100
      second: seconds,  // Position as 0-100 (optional)
    };
  },
},
```

**Note:** For clocks, `minute` and `second` values should be normalized to 0-100 range regardless of the actual time system. The renderer uses this to calculate hand positions.

## Guidelines

- **Accuracy**: Document any simplifications in your description or code comments
- **References**: Include a `learnMoreUrl` pointing to a reputable source
- **Tick interval**: Set `tickInterval` appropriately for your system's precision
  - 1000ms for second-precision
  - 86.4ms for Swatch beats (1 beat = 86.4 seconds)
  - 864ms for French decimal seconds
- **Category**: Choose the most appropriate category:
  - `standard`: Conventional timekeeping (Gregorian, ISO 8601)
  - `metric`: Decimal/SI-based systems (kiloseconds, beats)
  - `epoch`: Time-since-reference (Unix, Julian Day)
  - `calendar`: Date/era modifications (Holocene, lunar calendars)
  - `cultural`: Historical or regional systems (French Republican, Maya)

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

## Submitting a PR

1. Fork the repository
2. Create a branch: `git checkout -b add-my-time-system`
3. Add your system following the steps above
4. Ensure `npm run build` passes
5. Submit a pull request with:
   - Brief description of the time system
   - Link to reference material
   - Any accuracy notes or simplifications

## Ideas for New Systems

Some systems that would be great additions:

- Julian Day Number
- Mars Sol Date
- Stardate (various Trek interpretations)
- Hebrew Calendar
- Islamic Calendar
- Chinese Calendar
- Maya Long Count
- TAI (International Atomic Time)
- .NET Ticks
