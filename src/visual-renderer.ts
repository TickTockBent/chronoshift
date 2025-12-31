import type {
  VisualDefinition,
  ProgressBarVisual,
  ProgressRingVisual,
  ClockVisual,
} from './types';

const VISUAL_SIZE = 120;
const STROKE_WIDTH = 4;

export function renderVisual(
  visual: VisualDefinition,
  date: Date,
  container: HTMLElement
): void {
  switch (visual.type) {
    case 'progress-bar':
      renderProgressBar(visual, date, container);
      break;
    case 'progress-ring':
      renderProgressRing(visual, date, container);
      break;
    case 'clock':
      renderClock(visual, date, container);
      break;
  }
}

function renderProgressBar(
  visual: ProgressBarVisual,
  date: Date,
  container: HTMLElement
): void {
  const value = visual.getValue(date);
  const progress = Math.min(value / visual.max, 1);

  let svg = container.querySelector('.visual__svg') as SVGSVGElement | null;
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'visual__svg visual__svg--bar');
    svg.setAttribute('viewBox', `0 0 ${VISUAL_SIZE} 12`);
    svg.setAttribute('aria-hidden', 'true');

    // Background track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    track.setAttribute('class', 'visual__track');
    track.setAttribute('x', '0');
    track.setAttribute('y', '4');
    track.setAttribute('width', String(VISUAL_SIZE));
    track.setAttribute('height', '4');
    track.setAttribute('rx', '2');
    svg.appendChild(track);

    // Progress fill
    const fill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fill.setAttribute('class', 'visual__fill');
    fill.setAttribute('x', '0');
    fill.setAttribute('y', '4');
    fill.setAttribute('height', '4');
    fill.setAttribute('rx', '2');
    svg.appendChild(fill);

    container.appendChild(svg);
  }

  const fill = svg.querySelector('.visual__fill') as SVGRectElement;
  fill.setAttribute('width', String(progress * VISUAL_SIZE));
}

function renderProgressRing(
  visual: ProgressRingVisual,
  date: Date,
  container: HTMLElement
): void {
  const value = visual.getValue(date);
  const progress = Math.min(value / visual.max, 1);

  const radius = (VISUAL_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  let svg = container.querySelector('.visual__svg') as SVGSVGElement | null;
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'visual__svg visual__svg--ring');
    svg.setAttribute('viewBox', `0 0 ${VISUAL_SIZE} ${VISUAL_SIZE}`);
    svg.setAttribute('aria-hidden', 'true');

    const center = VISUAL_SIZE / 2;

    // Background track
    const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    track.setAttribute('class', 'visual__track');
    track.setAttribute('cx', String(center));
    track.setAttribute('cy', String(center));
    track.setAttribute('r', String(radius));
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke-width', String(STROKE_WIDTH));
    svg.appendChild(track);

    // Progress arc
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    arc.setAttribute('class', 'visual__fill');
    arc.setAttribute('cx', String(center));
    arc.setAttribute('cy', String(center));
    arc.setAttribute('r', String(radius));
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke-width', String(STROKE_WIDTH));
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('stroke-dasharray', String(circumference));
    arc.setAttribute('transform', `rotate(-90 ${center} ${center})`);
    svg.appendChild(arc);

    container.appendChild(svg);
  }

  const arc = svg.querySelector('.visual__fill') as SVGCircleElement;
  const offset = circumference * (1 - progress);
  arc.setAttribute('stroke-dashoffset', String(offset));
}

function renderClock(
  visual: ClockVisual,
  date: Date,
  container: HTMLElement
): void {
  const hands = visual.getHands(date);
  const center = VISUAL_SIZE / 2;
  const faceRadius = (VISUAL_SIZE - STROKE_WIDTH) / 2;

  let svg = container.querySelector('.visual__svg') as SVGSVGElement | null;
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'visual__svg visual__svg--clock');
    svg.setAttribute('viewBox', `0 0 ${VISUAL_SIZE} ${VISUAL_SIZE}`);
    svg.setAttribute('aria-hidden', 'true');

    // Clock face
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    face.setAttribute('class', 'visual__face');
    face.setAttribute('cx', String(center));
    face.setAttribute('cy', String(center));
    face.setAttribute('r', String(faceRadius));
    face.setAttribute('fill', 'none');
    face.setAttribute('stroke-width', String(STROKE_WIDTH));
    svg.appendChild(face);

    // Hour markers
    for (let i = 0; i < visual.divisions; i++) {
      const angle = (i / visual.divisions) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const innerRadius = faceRadius - 8;
      const outerRadius = faceRadius - 3;

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      marker.setAttribute('class', 'visual__marker');
      marker.setAttribute('x1', String(center + innerRadius * Math.cos(rad)));
      marker.setAttribute('y1', String(center + innerRadius * Math.sin(rad)));
      marker.setAttribute('x2', String(center + outerRadius * Math.cos(rad)));
      marker.setAttribute('y2', String(center + outerRadius * Math.sin(rad)));
      marker.setAttribute('stroke-width', '2');
      marker.setAttribute('stroke-linecap', 'round');
      svg.appendChild(marker);
    }

    // Hour hand
    const hourHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hourHand.setAttribute('class', 'visual__hand visual__hand--hour');
    hourHand.setAttribute('x1', String(center));
    hourHand.setAttribute('y1', String(center));
    hourHand.setAttribute('stroke-width', '3');
    hourHand.setAttribute('stroke-linecap', 'round');
    svg.appendChild(hourHand);

    // Minute hand
    const minuteHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    minuteHand.setAttribute('class', 'visual__hand visual__hand--minute');
    minuteHand.setAttribute('x1', String(center));
    minuteHand.setAttribute('y1', String(center));
    minuteHand.setAttribute('stroke-width', '2');
    minuteHand.setAttribute('stroke-linecap', 'round');
    svg.appendChild(minuteHand);

    // Second hand (optional)
    if (hands.second !== undefined) {
      const secondHand = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      secondHand.setAttribute('class', 'visual__hand visual__hand--second');
      secondHand.setAttribute('x1', String(center));
      secondHand.setAttribute('y1', String(center));
      secondHand.setAttribute('stroke-width', '1');
      secondHand.setAttribute('stroke-linecap', 'round');
      svg.appendChild(secondHand);
    }

    // Center dot
    const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerDot.setAttribute('class', 'visual__center');
    centerDot.setAttribute('cx', String(center));
    centerDot.setAttribute('cy', String(center));
    centerDot.setAttribute('r', '3');
    svg.appendChild(centerDot);

    container.appendChild(svg);
  }

  // Update hand positions
  const hourAngle = (hands.hour / visual.divisions) * 360 - 90;
  const minuteAngle = (hands.minute / 100) * 360 - 90; // Assuming 100 divisions for minutes
  const hourRad = (hourAngle * Math.PI) / 180;
  const minuteRad = (minuteAngle * Math.PI) / 180;

  const hourLength = faceRadius * 0.5;
  const minuteLength = faceRadius * 0.7;

  const hourHand = svg.querySelector('.visual__hand--hour') as SVGLineElement;
  hourHand.setAttribute('x2', String(center + hourLength * Math.cos(hourRad)));
  hourHand.setAttribute('y2', String(center + hourLength * Math.sin(hourRad)));

  const minuteHand = svg.querySelector('.visual__hand--minute') as SVGLineElement;
  minuteHand.setAttribute('x2', String(center + minuteLength * Math.cos(minuteRad)));
  minuteHand.setAttribute('y2', String(center + minuteLength * Math.sin(minuteRad)));

  if (hands.second !== undefined) {
    const secondAngle = (hands.second / 100) * 360 - 90; // Assuming 100 divisions for seconds
    const secondRad = (secondAngle * Math.PI) / 180;
    const secondLength = faceRadius * 0.8;

    const secondHand = svg.querySelector('.visual__hand--second') as SVGLineElement;
    if (secondHand) {
      secondHand.setAttribute('x2', String(center + secondLength * Math.cos(secondRad)));
      secondHand.setAttribute('y2', String(center + secondLength * Math.sin(secondRad)));
    }
  }
}

export function clearVisual(container: HTMLElement): void {
  const svg = container.querySelector('.visual__svg');
  if (svg) {
    svg.remove();
  }
}
