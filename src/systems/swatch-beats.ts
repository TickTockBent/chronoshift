import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const swatchBeats: TimeSystemDefinition = {
  id: 'swatch-beats',
  name: 'Swatch Internet Time',
  description: 'Day divided into 1000 .beats, referenced to Biel, Switzerland',
  category: 'metric',
  tickInterval: 86.4,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/Swatch_Internet_Time',

  format(date: Date): UnifiedDisplay {
    // Convert to Biel Mean Time (UTC+1)
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
    const bielMs = utcMs + 3600000;

    // Calculate milliseconds since midnight in Biel
    const bielDate = new Date(bielMs);
    const midnight = new Date(bielDate);
    midnight.setUTCHours(0, 0, 0, 0);

    const msIntoDay = bielMs - midnight.getTime();
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
