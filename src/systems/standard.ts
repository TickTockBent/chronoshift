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
