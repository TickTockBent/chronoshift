import type { TimeSystemDefinition } from './types';

import standard from './systems/standard';

const systems: TimeSystemDefinition[] = [standard];

const registry = new Map<string, TimeSystemDefinition>();

for (const system of systems) {
  if (!validateSystem(system)) {
    const id = (system as Record<string, unknown>).id ?? 'unknown';
    console.warn(`[Chronoshift] Invalid system definition: ${id}`);
    continue;
  }
  if (registry.has(system.id)) {
    console.warn(`[Chronoshift] Duplicate system ID: ${system.id}`);
    continue;
  }
  registry.set(system.id, system);
}

function validateSystem(s: unknown): s is TimeSystemDefinition {
  if (!s || typeof s !== 'object') return false;
  const sys = s as Record<string, unknown>;
  return (
    typeof sys.id === 'string' &&
    typeof sys.name === 'string' &&
    typeof sys.description === 'string' &&
    typeof sys.format === 'function'
  );
}

export function getAllSystems(): TimeSystemDefinition[] {
  return Array.from(registry.values());
}

export function getSystem(id: string): TimeSystemDefinition | undefined {
  return registry.get(id);
}

export function getDefaultSystem(): TimeSystemDefinition {
  return registry.get('standard') ?? Array.from(registry.values())[0];
}
