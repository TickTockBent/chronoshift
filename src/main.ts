import { getAllSystems, getSystem, getDefaultSystem } from './registry';
import { render } from './renderer';
import { renderVisual, clearVisual } from './visual-renderer';
import './styles/main.css';

const selector = document.getElementById('system-selector') as HTMLSelectElement;
const visualContainer = document.getElementById('time-visual') as HTMLElement;
const display = document.getElementById('time-display') as HTMLElement;
const learnMoreLink = document.getElementById('learn-more') as HTMLAnchorElement;

let currentSystem = getDefaultSystem();
let tickHandle: number;

function populateSelector(): void {
  const systems = getAllSystems();

  for (const sys of systems) {
    const option = document.createElement('option');
    option.value = sys.id;
    option.textContent = sys.name;
    option.title = sys.description;
    selector.appendChild(option);
  }
}

function tick(): void {
  const now = new Date();
  const output = currentSystem.format(now);
  render(output, display);

  if (currentSystem.visual) {
    renderVisual(currentSystem.visual, now, visualContainer);
  }
}

function updateLearnMoreLink(): void {
  if (currentSystem.learnMoreUrl) {
    learnMoreLink.href = currentSystem.learnMoreUrl;
    learnMoreLink.style.display = '';
  } else {
    learnMoreLink.style.display = 'none';
  }
}

function switchSystem(id: string): void {
  const sys = getSystem(id);
  if (!sys) return;

  // Clear previous visual when switching systems
  clearVisual(visualContainer);

  currentSystem = sys;
  clearInterval(tickHandle);
  tick();
  tickHandle = window.setInterval(tick, sys.tickInterval ?? 1000);
  updateLearnMoreLink();

  localStorage.setItem('chronoshift-system', id);
}

function init(): void {
  populateSelector();

  const saved = localStorage.getItem('chronoshift-system');
  if (saved && getSystem(saved)) {
    selector.value = saved;
    switchSystem(saved);
  } else {
    tick();
    tickHandle = window.setInterval(tick, currentSystem.tickInterval ?? 1000);
    updateLearnMoreLink();
  }

  selector.addEventListener('change', (e) => {
    switchSystem((e.target as HTMLSelectElement).value);
  });
}

init();
