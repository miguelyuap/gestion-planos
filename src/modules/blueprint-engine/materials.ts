import type { MaterialFinish } from './types';

export interface MaterialVisual {
  label: string;
  primaryHex: string;
  secondaryHex: string;
  structureHex: string;
  accentHex: string;
  metalness: number;
  roughness: number;
  opacity?: number;
}

export const MATERIAL_PALETTE: Record<MaterialFinish, MaterialVisual> = {
  oak: {
    label: 'Madera Roble Natural',
    primaryHex: '#c89b6e',
    secondaryHex: '#b38355',
    structureHex: '#9c6d42',
    accentHex: '#e2bd96',
    metalness: 0.08,
    roughness: 0.65,
  },
  walnut: {
    label: 'Madera Nogal Oscuro',
    primaryHex: '#6f472c',
    secondaryHex: '#59361f',
    structureHex: '#472a17',
    accentHex: '#8d6040',
    metalness: 0.1,
    roughness: 0.58,
  },
  white_melamine: {
    label: 'Melamina Blanca RH 18mm',
    primaryHex: '#f1f5f9',
    secondaryHex: '#e2e8f0',
    structureHex: '#cbd5e1',
    accentHex: '#94a3b8',
    metalness: 0.05,
    roughness: 0.4,
  },
  graphite: {
    label: 'Melamina / Perfilería Grafito',
    primaryHex: '#334155',
    secondaryHex: '#475569',
    structureHex: '#1e293b',
    accentHex: '#64748b',
    metalness: 0.25,
    roughness: 0.45,
  },
  industrial_steel: {
    label: 'Acero Estructural + Madera',
    primaryHex: '#c89b6e',
    secondaryHex: '#334155',
    structureHex: '#1e293b',
    accentHex: '#94a3b8',
    metalness: 0.55,
    roughness: 0.38,
  },
  metal_red: {
    label: 'Cubierta Termoacústica Terracota + Acero',
    primaryHex: '#b45309',
    secondaryHex: '#475569',
    structureHex: '#334155',
    accentHex: '#d97706',
    metalness: 0.35,
    roughness: 0.5,
  },
  metal_zinc: {
    label: 'Lámina Arquitectónica Zinc / Aluzinc',
    primaryHex: '#94a3b8',
    secondaryHex: '#64748b',
    structureHex: '#334155',
    accentHex: '#cbd5e1',
    metalness: 0.65,
    roughness: 0.32,
  },
  polycarbonate: {
    label: 'Policarbonato Alveolar Traslúcido + Estructura',
    primaryHex: '#38bdf8',
    secondaryHex: '#64748b',
    structureHex: '#334155',
    accentHex: '#7dd3fc',
    metalness: 0.15,
    roughness: 0.2,
    opacity: 0.55,
  },
};

export function getMaterialVisual(finish: MaterialFinish): MaterialVisual {
  return MATERIAL_PALETTE[finish];
}
