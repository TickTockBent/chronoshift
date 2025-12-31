import type { TimeSystemDefinition, SplitDisplay } from '../types';

const standard: TimeSystemDefinition = {
  id: 'standard',
  name: 'Standard Time',
  description: 'Gregorian calendar with 24-hour time',
  category: 'standard',
  tickInterval: 1000,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/Gregorian_calendar',

  visual: {
    type: 'clock',
    divisions: 12,
    getHands(date: Date) {
      const hours = date.getHours() % 12;
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      return {
        hour: hours + minutes / 60,
        minute: (minutes + seconds / 60) * (100 / 60), // Convert to 100-based for renderer
        second: seconds * (100 / 60), // Convert to 100-based for renderer
      };
    },
  },

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
