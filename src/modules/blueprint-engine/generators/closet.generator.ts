import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  ClosetParams,
  DimensionLine3D,
  GeneratedBlueprint,
  Part3D,
} from '../types';

export function generateClosetBlueprint(params: ClosetParams): GeneratedBlueprint {
  const {
    widthCm,
    heightCm,
    depthCm,
    boardThicknessMm,
    columnsCount,
    topLuggageHeightCm,
    drawersCount,
    shelvesCount,
    includeDoors,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const hM = heightCm / 100;
  const dM = depthCm / 100;
  const tM = boardThicknessMm / 1000;
  const toeM = 0.08; // 8 cm base plinth

  const bodyHeightM = hM - toeM;
  const bodyBaseY = toeM;
  const internalWidthM = wM - tM * 2;
  const luggageH = Math.min(topLuggageHeightCm / 100, bodyHeightM * 0.3);
  const mainColumnsHeightM = bodyHeightM - tM * 3 - luggageH;

  // 1. Base Plinth (Zócalo inferior)
  parts.push({
    id: 'closet-plinth',
    name: 'Zócalo Base de Closet',
    partCode: 'ZOC-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [internalWidthM, toeM, tM],
    positionM: [0, toeM / 2, dM / 2 - 0.04],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(internalWidthM * 100).toFixed(1)} × 8.0 cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // 2. Left & Right Outer Side Panels (Costados Laterales)
  for (const [suffix, x] of [
    ['left', -wM / 2 + tM / 2],
    ['right', wM / 2 - tM / 2],
  ] as const) {
    parts.push({
      id: `closet-side-${suffix}`,
      name: 'Costado Lateral Exterior de Closet',
      partCode: 'LAT-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [tM, bodyHeightM, dM],
      positionM: [x, bodyBaseY + bodyHeightM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.primaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(bodyHeightM * 100).toFixed(1)} × ${depthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 3. Floor, Top Roof & Luggage Shelf (Piso, Techo y Piso de Maletero)
  parts.push({
    id: 'closet-floor',
    name: 'Piso Inferior de Closet',
    partCode: 'HOR-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [internalWidthM, tM, dM],
    positionM: [0, bodyBaseY + tM / 2, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.secondaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(internalWidthM * 100).toFixed(1)} × ${depthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  parts.push({
    id: 'closet-top',
    name: 'Tapa Superior / Techo de Closet',
    partCode: 'HOR-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [internalWidthM, tM, dM],
    positionM: [0, hM - tM / 2, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.secondaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(internalWidthM * 100).toFixed(1)} × ${depthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  const luggageShelfY = hM - tM - luggageH - tM / 2;
  parts.push({
    id: 'closet-luggage-shelf',
    name: 'Bandeja Divisoria de Maletero Superior',
    partCode: 'MAL-01',
    layer: 'interior',
    shape: 'box',
    sizeM: [internalWidthM, tM, dM - 0.02],
    positionM: [0, luggageShelfY, -0.01],
    rotationRad: [0, 0, 0],
    colorHex: mat.secondaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(internalWidthM * 100).toFixed(1)} × ${(depthCm - 2).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // Back Panel (Fondo 6mm)
  parts.push({
    id: 'closet-back',
    name: 'Fondo Posterior MDF',
    partCode: 'FON-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [internalWidthM, bodyHeightM - tM * 2, 0.006],
    positionM: [0, bodyBaseY + bodyHeightM / 2, -dM / 2 + 0.003],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: 0.05,
    roughness: 0.7,
    cutDimensionsLabel: `${(internalWidthM * 100).toFixed(1)} × ${((bodyHeightM - tM * 2) * 100).toFixed(1)} cm (Esp. 6 mm)`,
    materialLabel: 'MDF / Triplay 6mm',
  });

  // 4. Vertical Columns & Internal Distribution
  const colClearWidthM =
    (internalWidthM - tM * (columnsCount - 1)) / columnsCount;
  const colStartY = bodyBaseY + tM;
  const colCenterY = colStartY + mainColumnsHeightM / 2;

  for (let c = 1; c < columnsCount; c++) {
    const divX =
      -internalWidthM / 2 + c * colClearWidthM + (c - 0.5) * tM;
    parts.push({
      id: `closet-div-${c}`,
      name: 'División Vertical Central (Parante)',
      partCode: 'DIV-01',
      layer: 'interior',
      shape: 'box',
      sizeM: [tM, mainColumnsHeightM, dM - 0.02],
      positionM: [divX, colCenterY, -0.01],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(mainColumnsHeightM * 100).toFixed(1)} × ${(depthCm - 2).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // Populate each column:
  // Column 0 (and Column 2 if 3+ columns): Hanging Rod(s)
  // Column 1: Shelving + Bottom Drawers
  for (let colIdx = 0; colIdx < columnsCount; colIdx++) {
    const colCenterX =
      -internalWidthM / 2 +
      colClearWidthM / 2 +
      colIdx * (colClearWidthM + tM);

    if (colIdx === 1) {
      // Organizer Tower: Bottom Drawers + Upper Shelves
      const drawerHeightTotalM =
        drawersCount > 0 ? Math.min(0.75, drawersCount * 0.17) : 0;

      if (drawersCount > 0) {
        const singleDrawerH = (drawerHeightTotalM - 0.004 * drawersCount) / drawersCount;
        for (let dr = 0; dr < drawersCount; dr++) {
          const drY =
            colStartY + singleDrawerH / 2 + dr * (singleDrawerH + 0.004);
          parts.push({
            id: `closet-drawer-${dr}`,
            name: 'Frente y Caja de Cajón Interno',
            partCode: 'CAJ-01',
            layer: 'interior',
            shape: 'box',
            sizeM: [colClearWidthM - 0.006, singleDrawerH, dM - 0.06],
            positionM: [colCenterX, drY, -0.01],
            rotationRad: [0, 0, 0],
            colorHex: mat.accentHex,
            opacity: 1,
            metalness: mat.metalness,
            roughness: mat.roughness,
            cutDimensionsLabel: `${((colClearWidthM - 0.006) * 100).toFixed(1)} × ${(singleDrawerH * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
            materialLabel: mat.label,
            openTransform: {
              translateM: [0, 0, dM * 0.38],
            },
          });
        }
      }

      // Upper shelves above drawers
      const remainingH = mainColumnsHeightM - drawerHeightTotalM;
      for (let s = 0; s < shelvesCount; s++) {
        const shelfY =
          colStartY +
          drawerHeightTotalM +
          (remainingH / (shelvesCount + 1)) * (s + 1);
        parts.push({
          id: `closet-shelf-${colIdx}-${s}`,
          name: 'Entrepaño Organizador de Closet',
          partCode: 'ENT-01',
          layer: 'interior',
          shape: 'box',
          sizeM: [colClearWidthM, tM, dM - 0.03],
          positionM: [colCenterX, shelfY, -0.01],
          rotationRad: [0, 0, 0],
          colorHex: mat.secondaryHex,
          opacity: 1,
          metalness: mat.metalness,
          roughness: mat.roughness,
          cutDimensionsLabel: `${(colClearWidthM * 100).toFixed(1)} × ${(depthCm - 3).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
          materialLabel: mat.label,
        });
      }
    } else {
      // Hanging compartment: Upper Hanging Rod (+ Mid Hanging Rod on first column)
      const rodYTop = colStartY + mainColumnsHeightM - 0.08;
      parts.push({
        id: `hanging-rod-top-${colIdx}`,
        name: 'Tubo Colgador Cromado Ovalado',
        partCode: 'TUB-01',
        layer: 'hardware',
        shape: 'box',
        sizeM: [colClearWidthM, 0.025, 0.018],
        positionM: [colCenterX, rodYTop, 0],
        rotationRad: [0, 0, 0],
        colorHex: '#cbd5e1',
        opacity: 1,
        metalness: 0.85,
        roughness: 0.18,
        cutDimensionsLabel: `${(colClearWidthM * 100).toFixed(1)} cm (Tubo Cromado)`,
        materialLabel: 'Acero Cromado + Soportes',
      });

      if (colIdx === 0 && mainColumnsHeightM >= 1.35) {
        // Double hang (camiseros) with middle shelf & lower rod
        const midY = colStartY + mainColumnsHeightM * 0.5;
        parts.push({
          id: `closet-mid-shelf-${colIdx}`,
          name: 'Entrepaño Separador Colgador Doble',
          partCode: 'ENT-01',
          layer: 'interior',
          shape: 'box',
          sizeM: [colClearWidthM, tM, dM - 0.03],
          positionM: [colCenterX, midY, -0.01],
          rotationRad: [0, 0, 0],
          colorHex: mat.secondaryHex,
          opacity: 1,
          metalness: mat.metalness,
          roughness: mat.roughness,
          cutDimensionsLabel: `${(colClearWidthM * 100).toFixed(1)} × ${(depthCm - 3).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
          materialLabel: mat.label,
        });

        parts.push({
          id: `hanging-rod-low-${colIdx}`,
          name: 'Tubo Colgador Cromado Ovalado',
          partCode: 'TUB-01',
          layer: 'hardware',
          shape: 'box',
          sizeM: [colClearWidthM, 0.025, 0.018],
          positionM: [colCenterX, midY - 0.07, 0],
          rotationRad: [0, 0, 0],
          colorHex: '#cbd5e1',
          opacity: 1,
          metalness: 0.85,
          roughness: 0.18,
          cutDimensionsLabel: `${(colClearWidthM * 100).toFixed(1)} cm (Tubo Cromado)`,
          materialLabel: 'Acero Cromado + Soportes',
        });
      }
    }
  }

  // 5. Optional Outer Doors
  if (includeDoors) {
    const gapM = 0.003;
    const singleDoorW = (wM - gapM * (columnsCount + 1)) / columnsCount;
    const doorH = bodyHeightM - gapM * 2;
    const doorZ = dM / 2 + tM / 2;

    for (let d = 0; d < columnsCount; d++) {
      const doorX = -wM / 2 + gapM + singleDoorW / 2 + d * (singleDoorW + gapM);
      const dir = d < columnsCount / 2 ? -1 : 1;

      parts.push({
        id: `closet-door-${d}`,
        name: 'Hoja de Puerta de Closet',
        partCode: 'PUE-01',
        layer: 'front',
        shape: 'box',
        sizeM: [singleDoorW, doorH, tM],
        positionM: [doorX, bodyBaseY + bodyHeightM / 2, doorZ],
        rotationRad: [0, 0, 0],
        colorHex: mat.primaryHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${(doorH * 100).toFixed(1)} × ${(singleDoorW * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
        materialLabel: mat.label,
        openTransform: {
          translateM: [dir * singleDoorW * 0.4, 0, singleDoorW * 0.7],
          rotateYRad: dir * 1.25,
        },
      });
    }
  }

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Total Closet',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.01, dM / 2 + 0.18],
      endM: [wM / 2, 0.01, dM / 2 + 0.18],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-depth',
      label: 'Profundidad',
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
    {
      id: 'dim-luggage',
      label: 'Maletero Sup.',
      valueFormatted: `${topLuggageHeightCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.15, luggageShelfY, dM / 2],
      endM: [wM / 2 + 0.15, hM, dM / 2],
      colorHex: '#f472b6',
      axis: 'y',
    },
  ];

  return {
    title: 'Plano de Carpintería: Closet / Armario Modular',
    subtitle: `${widthCm} cm × ${heightCm} cm × ${depthCm} cm | ${columnsCount} Cuerpos | Maletero ${topLuggageHeightCm} cm`,
    category: 'closet',
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
      `Ancho libre interior de cada cuerpo (${columnsCount} cuerpos): ${(colClearWidthM * 100).toFixed(1)} cm`,
      `Altura interior útil de cuerpos principales: ${(mainColumnsHeightM * 100).toFixed(1)} cm`,
      `Altura libre de maletero superior: ${topLuggageHeightCm.toFixed(1)} cm`,
      `Incluye ${drawersCount} cajones internos, ${shelvesCount} entrepaños y tubos colgadores cromados`,
    ],
  };
}
