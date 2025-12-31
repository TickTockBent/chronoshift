import type { TimeSystemDefinition, UnifiedDisplay } from '../types';

const kiloseconds: TimeSystemDefinition = {
  id: 'kiloseconds',
  name: 'Kiloseconds',
  description: 'SI-prefix time: today measured in kiloseconds',
  category: 'metric',
  tickInterval: 1000,
  learnMoreUrl: 'https://en.wikipedia.org/wiki/Metric_time',

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
