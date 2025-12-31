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

  /** URL to learn more about this time system */
  learnMoreUrl?: string;

  /** The core transformation function */
  format(date: Date): TimeDisplay;
}

export type TimeDisplay = UnifiedDisplay | SplitDisplay | SegmentedDisplay;

/**
 * For systems that collapse to a single value
 * Examples: Unix epoch, Swatch beats, Julian day number
 */
export interface UnifiedDisplay {
  type: 'unified';
  value: string;
  prefix?: string;
  suffix?: string;
  label?: string;
  sublabel?: string;
}

/**
 * For systems with distinct date and time components
 * Examples: Standard, Holocene, French Revolutionary
 */
export interface SplitDisplay {
  type: 'split';
  date: {
    formatted: string;
    era?: string;
  };
  time: {
    formatted: string;
    period?: string;
    unitLabels?: string[];
  };
  separator?: string;
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
    sublabel?: string;
  }>;
  separator?: string;
}
