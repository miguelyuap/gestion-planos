import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  DimensionLine3D,
  FrameParams,
  GeneratedBlueprint,
  Part3D,
} from '../types';

export function generateFrameBlueprint(params: FrameParams): GeneratedBlueprint {
  const {
    widthCm,
    heightCm,
    profileWidthMm,
    profileDepthMm,
    verticalDivisions,
    horizontalDivisions,
    includeGlassOrPanel,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const hM = heightCm / 100;
  const pWM = profileWidthMm / 1000;
  const pDM = profileDepthMm / 1000;

  const innerSpanX = Math.max(0.05, wM - pWM * 2);
  const innerSpanY = Math.max(0.05, hM - pWM * 2);

  // 1. Left & Right Vertical Perimeter Profiles (Parales Exteriores)
  for (const [suffix, x] of [
    ['left', -wM / 2 + pWM / 2],
    ['right', wM / 2 - pWM / 2],
  ] as const) {
    parts.push({
      id: `frame-vert-${suffix}`,
      name: 'Perfil Paral Vertical Exterior',
      partCode: 'PER-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [pWM, hM, pDM],
      positionM: [x, hM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${heightCm.toFixed(1)} cm (Perfil ${profileWidthMm}×${profileDepthMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 2. Bottom & Top Horizontal Perimeter Profiles (Cabezal y Base)
  for (const [suffix, y] of [
    ['bottom', pWM / 2],
    ['top', hM - pWM / 2],
  ] as const) {
    parts.push({
      id: `frame-horiz-${suffix}`,
      name: 'Perfil Travesaño Horizontal Exterior',
      partCode: 'PER-02',
      layer: 'structure',
      shape: 'box',
      sizeM: [innerSpanX, pWM, pDM],
      positionM: [0, y, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(innerSpanX * 100).toFixed(1)} cm (Perfil ${profileWidthMm}×${profileDepthMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 3. Internal Vertical Mullions (Parales Internos)
  for (let v = 1; v <= verticalDivisions; v++) {
    const x = -innerSpanX / 2 + (innerSpanX / (verticalDivisions + 1)) * v;
    parts.push({
      id: `mullion-vert-${v}`,
      name: 'Paral Divisorio Vertical Interno',
      partCode: 'DIV-V1',
      layer: 'secondary',
      shape: 'box',
      sizeM: [pWM * 0.85, innerSpanY, pDM * 0.9],
      positionM: [x, hM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(innerSpanY * 100).toFixed(1)} cm`,
      materialLabel: mat.label,
    });
  }

  // 4. Internal Horizontal Transoms (Travesaños Internos)
  for (let h = 1; h <= horizontalDivisions; h++) {
    const y = pWM + (innerSpanY / (horizontalDivisions + 1)) * h;
    parts.push({
      id: `transom-horiz-${h}`,
      name: 'Travesaño Divisorio Horizontal Interno',
      partCode: 'DIV-H1',
      layer: 'secondary',
      shape: 'box',
      sizeM: [innerSpanX, pWM * 0.85, pDM * 0.85],
      positionM: [0, y, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(innerSpanX * 100).toFixed(1)} cm`,
      materialLabel: mat.label,
    });
  }

  // 5. Optional Glass / Inner Panel
  if (includeGlassOrPanel) {
    parts.push({
      id: 'frame-inner-glass',
      name: 'Panel / Vidrio Interior',
      partCode: 'PAN-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [innerSpanX, innerSpanY, 0.008],
      positionM: [0, hM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: '#38bdf8',
      opacity: 0.4,
      metalness: 0.15,
      roughness: 0.1,
      cutDimensionsLabel: `${(innerSpanX * 100).toFixed(1)} × ${(innerSpanY * 100).toFixed(1)} cm`,
      materialLabel: 'Vidrio Templado / Panel Acrílico',
    });
  }

  const cellWidthCm = (innerSpanX * 100) / (verticalDivisions + 1);
  const cellHeightCm = (innerSpanY * 100) / (horizontalDivisions + 1);

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Exterior Marco',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.01, pDM / 2 + 0.15],
      endM: [wM / 2, 0.01, pDM / 2 + 0.15],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-height',
      label: 'Alto Exterior Marco',
      valueFormatted: `${heightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.16, 0, 0],
      endM: [-wM / 2 - 0.16, hM, 0],
      colorHex: '#fbbf24',
      axis: 'y',
    },
    {
      id: 'dim-cell-w',
      label: 'Luz Cuadrícula',
      valueFormatted: `${cellWidthCm.toFixed(1)}×${cellHeightCm.toFixed(1)} cm`,
      startM: [-innerSpanX / 2, hM + 0.12, 0],
      endM: [
        -innerSpanX / 2 + innerSpanX / (verticalDivisions + 1),
        hM + 0.12,
        0,
      ],
      colorHex: '#34d399',
      axis: 'x',
    },
  ];

  return {
    title: 'Plano Estructural: Marco / Bastidor Modulado',
    subtitle: `${widthCm} × ${heightCm} cm | Perfil ${profileWidthMm}×${profileDepthMm} mm | Retícula ${verticalDivisions + 1}×${horizontalDivisions + 1}`,
    category: 'frame',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: wM,
      heightY: hM,
      depthZ: pDM + 0.1,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Vano libre interior total: ${(innerSpanX * 100).toFixed(1)} × ${(innerSpanY * 100).toFixed(1)} cm`,
      `Medida aproximada de cada módulo/cuadrícula (${(verticalDivisions + 1) * (horizontalDivisions + 1)} módulos): ${cellWidthCm.toFixed(1)} × ${cellHeightCm.toFixed(1)} cm`,
      `Sección de perfil seleccionada: ${profileWidthMm} mm (frente) × ${profileDepthMm} mm (profundidad)`,
    ],
  };
}
