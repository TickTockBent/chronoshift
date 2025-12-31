import type { TimeSystemDefinition, SplitDisplay } from '../types';

const holocene: TimeSystemDefinition = {
  id: 'holocene',
  name: 'Holocene Era',
  description: 'Adds 10,000 years to represent the Human Era (HE)',
  category: 'calendar',
  tickInterval: 1000,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/Holocene_calendar',

  format(date: Date): SplitDisplay {
    const holoceneYear = date.getFullYear() + 10000;

    return {
      type: 'split',
      date: {
        formatted:
          date.toLocaleDateString('en-US', {
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
