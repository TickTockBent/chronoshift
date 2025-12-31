import { getAllSystems, getSystem, getDefaultSystem } from './registry';
import { render } from './renderer';
import './styles/main.css';

const selector = document.getElementById('system-selector') as HTMLSelectElement;
const display = document.getElementById('time-display') as HTMLElement;

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
}

function switchSystem(id: string): void {
  const sys = getSystem(id);
  if (!sys) return;

  currentSystem = sys;
  clearInterval(tickHandle);
  tick();
  tickHandle = window.setInterval(tick, sys.tickInterval ?? 1000);

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
  }

  selector.addEventListener('change', (e) => {
    switchSystem((e.target as HTMLSelectElement).value);
  });
}

init();
