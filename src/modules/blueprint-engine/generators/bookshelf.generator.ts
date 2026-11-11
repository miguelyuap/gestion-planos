import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  BookshelfParams,
  DimensionLine3D,
  GeneratedBlueprint,
  Part3D,
} from '../types';

export function generateBookshelfBlueprint(
  params: BookshelfParams
): GeneratedBlueprint {
  const {
    widthCm,
    heightCm,
    depthCm,
    shelvesCount,
    verticalColumns,
    boardThicknessMm,
    includeBackPanel,
    includeBottomDoors,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const hM = heightCm / 100;
  const dM = depthCm / 100;
  const tM = boardThicknessMm / 1000;
  const toeKickM = 0.07; // 7 cm bottom plinth

  const innerWidthM = wM - tM * 2;
  const innerHeightM = hM - toeKickM - tM * 2;

  // 1. Left & Right Outer Vertical Side Panels (Costados Laterales)
  for (const [suffix, x] of [
    ['left', -wM / 2 + tM / 2],
    ['right', wM / 2 - tM / 2],
  ] as const) {
    parts.push({
      id: `bookshelf-side-${suffix}`,
      name: 'Costado Lateral Vertical',
      partCode: 'COS-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [tM, hM, dM],
      positionM: [x, hM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${heightCm.toFixed(1)} × ${depthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 2. Top Roof Board & Bottom Base Board (Tapa Superior y Piso Inferior)
  for (const [id, name, code, yPos] of [
    ['bookshelf-top', 'Tapa Superior Horizontal', 'TAP-01', hM - tM / 2],
    ['bookshelf-bottom', 'Base Inferior Horizontal', 'BAS-01', toeKickM + tM / 2],
  ] as const) {
    parts.push({
      id,
      name,
      partCode: code,
      layer: 'structure',
      shape: 'box',
      sizeM: [innerWidthM, tM, dM],
      positionM: [0, yPos, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.primaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(innerWidthM * 100).toFixed(1)} × ${depthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // Front Plinth / Toe-Kick (Zócalo Frontal de Apoyo)
  parts.push({
    id: 'bookshelf-plinth',
    name: 'Zócalo Frontal Inferior',
    partCode: 'ZOC-01',
    layer: 'secondary',
    shape: 'box',
    sizeM: [innerWidthM, toeKickM, tM],
    positionM: [0, toeKickM / 2, dM / 2 - 0.025],
    rotationRad: [0, 0, 0],
    colorHex: mat.secondaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(innerWidthM * 100).toFixed(1)} × ${(toeKickM * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // 3. Internal Vertical Dividers (Divisiones Verticales Internas)
  const dividersCount = Math.max(0, verticalColumns - 1);
  const bayWidthM = (innerWidthM - dividersCount * tM) / verticalColumns;

  for (let c = 1; c < verticalColumns; c++) {
    const xDiv = -innerWidthM / 2 + c * bayWidthM + (c - 0.5) * tM;
    parts.push({
      id: `bookshelf-divider-${c}`,
      name: 'División Vertical Interna',
      partCode: 'DIV-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [tM, innerHeightM, dM - 0.008],
      positionM: [xDiv, toeKickM + tM + innerHeightM / 2, -0.004],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(innerHeightM * 100).toFixed(1)} × ${((dM - 0.008) * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 4. Horizontal Shelves across each Column (Entrepaños / Repisas)
  const verticalCompartments = shelvesCount + 1;
  const compartmentHeightM =
    (innerHeightM - shelvesCount * tM) / verticalCompartments;
  const shelfDepthM = dM - 0.015;

  for (let col = 0; col < verticalColumns; col++) {
    const colCenterX =
      -innerWidthM / 2 + bayWidthM / 2 + col * (bayWidthM + tM);

    for (let s = 1; s <= shelvesCount; s++) {
      const shelfY =
        toeKickM + tM + s * compartmentHeightM + (s - 0.5) * tM;

      parts.push({
        id: `shelf-col${col + 1}-row${s}`,
        name: 'Entrepaño / Repisa Horizontal',
        partCode: 'REP-01',
        layer: 'interior',
        shape: 'box',
        sizeM: [bayWidthM - 0.002, tM, shelfDepthM],
        positionM: [colCenterX, shelfY, -0.004],
        rotationRad: [0, 0, 0],
        colorHex: mat.primaryHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${((bayWidthM - 0.002) * 100).toFixed(1)} × ${(shelfDepthM * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
        materialLabel: mat.label,
      });
    }
  }

  // 5. Optional Back Panel (Fondo Trasero MDF 5.5 mm)
  if (includeBackPanel) {
    const backThickM = 0.006;
    parts.push({
      id: 'bookshelf-back',
      name: 'Fondo / Respaldo Trasero MDF',
      partCode: 'FON-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [wM - 0.01, hM - toeKickM - 0.01, backThickM],
      positionM: [
        0,
        toeKickM + (hM - toeKickM) / 2,
        -dM / 2 + backThickM / 2,
      ],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${((wM - 0.01) * 100).toFixed(1)} × ${((hM - toeKickM - 0.01) * 100).toFixed(1)} cm (MDF 5.5 mm)`,
      materialLabel: 'Lámina Fondo MDF 5.5mm',
    });
  }

  // 6. Optional Bottom Compartment Doors (Puertas Inferiores)
  if (includeBottomDoors) {
    const doorHeightM = compartmentHeightM + tM;
    const doorY = toeKickM + tM + doorHeightM / 2;

    for (let col = 0; col < verticalColumns; col++) {
      const colCenterX =
        -innerWidthM / 2 + bayWidthM / 2 + col * (bayWidthM + tM);
      const isLeftHinge = col % 2 === 0;
      const hingeSign = isLeftHinge ? -1 : 1;

      parts.push({
        id: `bottom-door-${col + 1}`,
        name: 'Puerta Inferior de Nicho',
        partCode: 'PUE-01',
        layer: 'front',
        shape: 'box',
        sizeM: [bayWidthM - 0.004, doorHeightM - 0.004, tM],
        positionM: [colCenterX, doorY, dM / 2 + tM / 2],
        rotationRad: [0, 0, 0],
        colorHex: mat.accentHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${((doorHeightM - 0.004) * 100).toFixed(1)} × ${((bayWidthM - 0.004) * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
        materialLabel: mat.label,
        openTransform: {
          translateM: [hingeSign * bayWidthM * 0.32, 0, bayWidthM * 0.55],
          rotateYRad: hingeSign * 1.05,
        },
      });
    }
  }

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Total',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.02, dM / 2 + 0.16],
      endM: [wM / 2, 0.02, dM / 2 + 0.16],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-height',
      label: 'Altura Total',
      valueFormatted: `${heightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.16, 0, dM / 2],
      endM: [-wM / 2 - 0.16, hM, dM / 2],
      colorHex: '#fbbf24',
      axis: 'y',
    },
    {
      id: 'dim-depth',
      label: 'Profundidad',
      valueFormatted: `${depthCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.16, 0.02, -dM / 2],
      endM: [wM / 2 + 0.16, 0.02, dM / 2],
      colorHex: '#34d399',
      axis: 'z',
    },
    {
      id: 'dim-niche-height',
      label: 'Luz por Nivel',
      valueFormatted: `${(compartmentHeightM * 100).toFixed(1)} cm`,
      startM: [wM / 2 + 0.16, toeKickM + tM, dM / 2],
      endM: [wM / 2 + 0.16, toeKickM + tM + compartmentHeightM, dM / 2],
      colorHex: '#f472b6',
      axis: 'y',
    },
  ];

  return {
    title: 'Plano de Carpintería: Estantería / Librero Modular',
    subtitle: `${widthCm} × ${heightCm} × ${depthCm} cm | ${verticalColumns} Columna(s) × ${shelvesCount} Niveles de Repisa`,
    category: 'bookshelf',
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
      `Ancho libre interno de cada columna: ${(bayWidthM * 100).toFixed(1)} cm`,
      `Altura libre útil entre entrepaños: ${(compartmentHeightM * 100).toFixed(1)} cm (${verticalCompartments} nichos por columna)`,
      `Total de entrepaños horizontales a cortar: ${verticalColumns * shelvesCount} unidades`,
    ],
  };
}
