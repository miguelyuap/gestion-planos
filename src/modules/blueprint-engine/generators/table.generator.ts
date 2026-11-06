import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type { DimensionLine3D, GeneratedBlueprint, Part3D, TableParams } from '../types';

export function generateTableBlueprint(params: TableParams): GeneratedBlueprint {
  const {
    widthCm,
    depthCm,
    heightCm,
    topThicknessMm,
    legThicknessCm,
    apronHeightCm,
    includeLowerShelf,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const dM = depthCm / 100;
  const hM = heightCm / 100;
  const topThickM = topThicknessMm / 1000;
  const legThickM = legThicknessCm / 100;
  const apronHeightM = apronHeightCm / 100;
  const apronThickM = 0.022; // 22 mm apron board

  const legHeightM = Math.max(0.1, hM - topThickM);
  const legHeightCm = legHeightM * 100;

  // Overhang of tabletop over legs (3 cm per side)
  const insetM = 0.03;
  const legOffsetX = Math.max(legThickM, wM / 2 - insetM - legThickM / 2);
  const legOffsetZ = Math.max(legThickM, dM / 2 - insetM - legThickM / 2);

  // 1. Tabletop (Tablero Superior)
  parts.push({
    id: 'table-top',
    name: 'Tablero Principal Superior',
    partCode: 'TAB-01',
    layer: 'cover',
    shape: 'box',
    sizeM: [wM, topThickM, dM],
    positionM: [0, hM - topThickM / 2, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.primaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${widthCm.toFixed(1)} × ${depthCm.toFixed(1)} cm (Esp. ${topThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // 2. Four Legs (4 Patas)
  const legCoords: Array<[string, number, number]> = [
    ['leg-fl', -legOffsetX, legOffsetZ],
    ['leg-fr', legOffsetX, legOffsetZ],
    ['leg-bl', -legOffsetX, -legOffsetZ],
    ['leg-br', legOffsetX, -legOffsetZ],
  ];

  for (const [id, x, z] of legCoords) {
    parts.push({
      id,
      name: 'Pata Estructural',
      partCode: 'PAT-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [legThickM, legHeightM, legThickM],
      positionM: [x, legHeightM / 2, z],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: materialFinish === 'industrial_steel' ? 0.65 : mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${legHeightCm.toFixed(1)} × ${legThicknessCm.toFixed(1)} × ${legThicknessCm.toFixed(1)} cm`,
      materialLabel:
        materialFinish === 'industrial_steel' ? 'Perfil Tubular Acero' : mat.label,
    });
  }

  // 3. Perimeter Aprons (Faldones / Chambranas de refuerzo)
  const spanBetweenLegsX = Math.max(0.1, legOffsetX * 2 - legThickM);
  const spanBetweenLegsZ = Math.max(0.1, legOffsetZ * 2 - legThickM);
  const apronY = legHeightM - apronHeightM / 2;

  // Front & Back Aprons
  for (const [suffix, z] of [
    ['front', legOffsetZ],
    ['back', -legOffsetZ],
  ] as const) {
    parts.push({
      id: `apron-${suffix}`,
      name: 'Faldón Longitudinal (Largo)',
      partCode: 'FAL-01',
      layer: 'secondary',
      shape: 'box',
      sizeM: [spanBetweenLegsX, apronHeightM, apronThickM],
      positionM: [0, apronY, z],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(spanBetweenLegsX * 100).toFixed(1)} × ${apronHeightCm.toFixed(1)} × 2.2 cm`,
      materialLabel: mat.label,
    });
  }

  // Left & Right Aprons
  for (const [suffix, x] of [
    ['left', -legOffsetX],
    ['right', legOffsetX],
  ] as const) {
    parts.push({
      id: `apron-${suffix}`,
      name: 'Faldón Transversal (Fondo)',
      partCode: 'FAL-02',
      layer: 'secondary',
      shape: 'box',
      sizeM: [apronThickM, apronHeightM, spanBetweenLegsZ],
      positionM: [x, apronY, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(spanBetweenLegsZ * 100).toFixed(1)} × ${apronHeightCm.toFixed(1)} × 2.2 cm`,
      materialLabel: mat.label,
    });
  }

  // 4. Optional Lower Shelf (Repisa Inferior)
  if (includeLowerShelf) {
    const shelfY = Math.min(0.22, legHeightM * 0.3);
    const shelfThicknessM = 0.018;
    parts.push({
      id: 'lower-shelf',
      name: 'Repisa Inferior de Refuerzo',
      partCode: 'REP-01',
      layer: 'interior',
      shape: 'box',
      sizeM: [spanBetweenLegsX, shelfThicknessM, spanBetweenLegsZ],
      positionM: [0, shelfY, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.primaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(spanBetweenLegsX * 100).toFixed(1)} × ${(spanBetweenLegsZ * 100).toFixed(1)} × 1.8 cm`,
      materialLabel: mat.label,
    });
  }

  // Technical 3D Dimensions
  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Largo / Frente',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.01, dM / 2 + 0.18],
      endM: [wM / 2, 0.01, dM / 2 + 0.18],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-depth',
      label: 'Ancho / Fondo',
      valueFormatted: `${depthCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.18, 0.01, -dM / 2],
      endM: [wM / 2 + 0.18, 0.01, dM / 2],
      colorHex: '#34d399',
      axis: 'z',
    },
    {
      id: 'dim-height',
      label: 'Altura Total',
      valueFormatted: `${heightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.18, 0, dM / 2],
      endM: [-wM / 2 - 0.18, hM, dM / 2],
      colorHex: '#fbbf24',
      axis: 'y',
    },
  ];

  const freeLegroomCm = heightCm - topThicknessMm / 10 - apronHeightCm;

  return {
    title: 'Plano de Carpintería / Mobiliario: Mesa Estructural',
    subtitle: `${widthCm} cm × ${depthCm} cm × ${heightCm} cm | Tablero ${topThicknessMm} mm | Patas ${legThicknessCm}×${legThicknessCm} cm`,
    category: 'table',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: wM,
      heightY: hM,
      depthZ: dM,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Altura libre inferior (bajo faldón): ${freeLegroomCm.toFixed(1)} cm`,
      `Longitud de corte de cada pata: ${legHeightCm.toFixed(1)} cm`,
      `Luz libre entre patas frontales: ${(spanBetweenLegsX * 100).toFixed(1)} cm`,
      `Luz libre entre patas laterales: ${(spanBetweenLegsZ * 100).toFixed(1)} cm`,
    ],
  };
}
