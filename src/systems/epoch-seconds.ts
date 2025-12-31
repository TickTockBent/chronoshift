import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const epochSeconds: TimeSystemDefinition = {
  id: 'epoch-seconds',
  name: 'Unix Epoch',
  description: 'Seconds elapsed since January 1, 1970 00:00:00 UTC',
  category: 'epoch',
  tickInterval: 1000,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/Unix_time',

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
