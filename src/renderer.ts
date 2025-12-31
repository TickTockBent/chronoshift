import type {
  TimeDisplay,
  UnifiedDisplay,
  SplitDisplay,
  SegmentedDisplay,
} from './types';

export function render(display: TimeDisplay, container: HTMLElement): void {
  container.innerHTML = '';
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
