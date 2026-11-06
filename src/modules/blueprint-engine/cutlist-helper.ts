import type { CutListItem, Part3D } from './types';

export function buildCutListFromParts(parts: Part3D[]): CutListItem[] {
  const map = new Map<string, CutListItem>();

  for (const part of parts) {
    const key = `${part.partCode}__${part.name}__${part.cutDimensionsLabel}__${part.materialLabel}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      map.set(key, {
        partCode: part.partCode,
        name: part.name,
        quantity: 1,
        dimensionsLabel: part.cutDimensionsLabel,
        materialLabel: part.materialLabel,
        layer: part.layer,
      });
    }
  }

  return Array.from(map.values());
}
