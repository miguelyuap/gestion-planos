import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  DimensionLine3D,
  DoorParams,
  GeneratedBlueprint,
  Part3D,
} from '../types';

export function generateDoorBlueprint(params: DoorParams): GeneratedBlueprint {
  const {
    openingWidthCm,
    openingHeightCm,
    frameDepthCm,
    jambThicknessMm,
    leafThicknessMm,
    doorStyle,
    casingWidthCm,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = openingWidthCm / 100;
  const hM = openingHeightCm / 100;
  const depthM = frameDepthCm / 100;
  const jambM = jambThicknessMm / 1000;
  const leafThickM = leafThicknessMm / 1000;
  const casingW = casingWidthCm / 100;
  const casingThickM = 0.012;

  const clearLeafWidthM = wM - jambM * 2 - 0.006; // 3mm clearance each side
  const clearLeafHeightM = hM - jambM - 0.008; // 8mm bottom/top clearance

  // 1. Left & Right Door Frame Jambs (Jambas Laterales del Marco)
  for (const [suffix, x] of [
    ['left', -wM / 2 + jambM / 2],
    ['right', wM / 2 - jambM / 2],
  ] as const) {
    parts.push({
      id: `door-jamb-${suffix}`,
      name: 'Jamba Lateral del Marco',
      partCode: 'MAR-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [jambM, hM, depthM],
      positionM: [x, hM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${openingHeightCm.toFixed(1)} × ${frameDepthCm.toFixed(1)} cm (Esp. ${jambThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 2. Top Header Jamb (Cabezal Superior del Marco)
  parts.push({
    id: 'door-header',
    name: 'Cabezal Superior del Marco',
    partCode: 'MAR-02',
    layer: 'structure',
    shape: 'box',
    sizeM: [wM - jambM * 2, jambM, depthM],
    positionM: [0, hM - jambM / 2, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${((wM - jambM * 2) * 100).toFixed(1)} × ${frameDepthCm.toFixed(1)} cm (Esp. ${jambThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // 3. Front Perimeter Casing / Architrave (Tapajuntas / Chambranas)
  for (const [suffix, x] of [
    ['left', -wM / 2 - casingW / 2 + jambM * 0.5],
    ['right', wM / 2 + casingW / 2 - jambM * 0.5],
  ] as const) {
    parts.push({
      id: `casing-side-${suffix}`,
      name: 'Tapajuntas / Chambrana Vertical',
      partCode: 'CHA-01',
      layer: 'secondary',
      shape: 'box',
      sizeM: [casingW, hM + casingW, casingThickM],
      positionM: [x, (hM + casingW) / 2, depthM / 2 + casingThickM / 2],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${((hM + casingW) * 100).toFixed(1)} × ${casingWidthCm.toFixed(1)} cm (Esp. 12 mm)`,
      materialLabel: mat.label,
    });
  }

  parts.push({
    id: 'casing-top',
    name: 'Tapajuntas / Chambrana Cabezal',
    partCode: 'CHA-02',
    layer: 'secondary',
    shape: 'box',
    sizeM: [wM + casingW * 2 - jambM, casingW, casingThickM],
    positionM: [0, hM + casingW / 2 - jambM * 0.5, depthM / 2 + casingThickM / 2],
    rotationRad: [0, 0, 0],
    colorHex: mat.secondaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${((wM + casingW * 2 - jambM) * 100).toFixed(1)} × ${casingWidthCm.toFixed(1)} cm (Esp. 12 mm)`,
    materialLabel: mat.label,
  });

  // 4. Door Leaf (Hoja de Puerta Principal)
  const leafOpenTransform = {
    translateM: [-clearLeafWidthM * 0.35, 0, clearLeafWidthM * 0.65] as [
      number,
      number,
      number,
    ],
    rotateYRad: -1.1,
  };

  parts.push({
    id: 'door-leaf',
    name: 'Hoja Principal de Puerta',
    partCode: 'HOJ-01',
    layer: 'front',
    shape: 'box',
    sizeM: [clearLeafWidthM, clearLeafHeightM, leafThickM],
    positionM: [0, clearLeafHeightM / 2 + 0.005, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.primaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(clearLeafHeightM * 100).toFixed(1)} × ${(clearLeafWidthM * 100).toFixed(1)} cm (Esp. ${leafThicknessMm} mm)`,
    materialLabel: mat.label,
    openTransform: leafOpenTransform,
  });

  // Style details (Decorative panels or Vision glass)
  if (doorStyle === 'paneled') {
    const panelW = clearLeafWidthM * 0.72;
    const panelH = clearLeafHeightM * 0.36;
    for (const [idx, yCenter] of [
      [1, clearLeafHeightM * 0.28],
      [2, clearLeafHeightM * 0.72],
    ] as const) {
      parts.push({
        id: `door-panel-${idx}`,
        name: 'Tablero / Relieve Decorativo',
        partCode: 'TAB-01',
        layer: 'front',
        shape: 'box',
        sizeM: [panelW, panelH, leafThickM + 0.012],
        positionM: [0, yCenter, 0],
        rotationRad: [0, 0, 0],
        colorHex: mat.accentHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${(panelH * 100).toFixed(1)} × ${(panelW * 100).toFixed(1)} cm`,
        materialLabel: mat.label,
        openTransform: leafOpenTransform,
      });
    }
  } else if (doorStyle === 'glass_vision') {
    const glassW = clearLeafWidthM * 0.55;
    const glassH = clearLeafHeightM * 0.55;
    parts.push({
      id: 'door-vision-glass',
      name: 'Visor de Vidrio Templado',
      partCode: 'VID-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [glassW, glassH, leafThickM + 0.008],
      positionM: [0, clearLeafHeightM * 0.58, 0],
      rotationRad: [0, 0, 0],
      colorHex: '#7dd3fc',
      opacity: 0.55,
      metalness: 0.2,
      roughness: 0.1,
      cutDimensionsLabel: `${(glassH * 100).toFixed(1)} × ${(glassW * 100).toFixed(1)} cm (Vidrio 6 mm)`,
      materialLabel: 'Vidrio Templado 6mm',
      openTransform: leafOpenTransform,
    });
  }

  // 5. Door Handle / Lockset (Manija y Cerradura a 95cm del piso)
  parts.push({
    id: 'door-handle',
    name: 'Cerradura y Manija Acero Inox',
    partCode: 'HER-01',
    layer: 'hardware',
    shape: 'box',
    sizeM: [0.12, 0.04, leafThickM + 0.06],
    positionM: [clearLeafWidthM / 2 - 0.09, Math.min(0.95, clearLeafHeightM * 0.48), 0],
    rotationRad: [0, 0, 0],
    colorHex: '#e2e8f0',
    opacity: 1,
    metalness: 0.85,
    roughness: 0.2,
    cutDimensionsLabel: 'Juego Manija + Cilindro (Altura 95 cm)',
    materialLabel: 'Herraje Acero Inoxidable',
    openTransform: leafOpenTransform,
  });

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Total Vano',
      valueFormatted: `${openingWidthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.01, depthM / 2 + 0.15],
      endM: [wM / 2, 0.01, depthM / 2 + 0.15],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-leaf-width',
      label: 'Ancho Hoja',
      valueFormatted: `${(clearLeafWidthM * 100).toFixed(1)} cm`,
      startM: [-clearLeafWidthM / 2, hM + 0.14, 0],
      endM: [clearLeafWidthM / 2, hM + 0.14, 0],
      colorHex: '#f472b6',
      axis: 'x',
    },
    {
      id: 'dim-height',
      label: 'Alto Vano',
      valueFormatted: `${openingHeightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.18, 0, 0],
      endM: [-wM / 2 - 0.18, hM, 0],
      colorHex: '#fbbf24',
      axis: 'y',
    },
    {
      id: 'dim-depth',
      label: 'Prof. Marco',
      valueFormatted: `${frameDepthCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.15, 0.01, -depthM / 2],
      endM: [wM / 2 + 0.15, 0.01, depthM / 2],
      colorHex: '#34d399',
      axis: 'z',
    },
  ];

  return {
    title: 'Plano Técnico: Puerta con Marco y Chambranas',
    subtitle: `Vano ${openingWidthCm} × ${openingHeightCm} cm | Hoja ${(clearLeafWidthM * 100).toFixed(1)} × ${(clearLeafHeightM * 100).toFixed(1)} cm | Marco ${frameDepthCm} cm`,
    category: 'door',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: wM + casingW * 2,
      heightY: hM + casingW,
      depthZ: depthM + 0.1,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Medida exacta de fabricación de la hoja: ${(clearLeafWidthM * 100).toFixed(1)} cm (ancho) × ${(clearLeafHeightM * 100).toFixed(1)} cm (alto) × ${leafThicknessMm} mm (espesor)`,
      `Luz libre de paso con marco instalado: ${((wM - jambM * 2) * 100).toFixed(1)} cm`,
      `Holgura perimetral descontada: 3 mm por costado y 8 mm entre cabezal e inferior`,
    ],
  };
}
