import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  DimensionLine3D,
  GeneratedBlueprint,
  KitchenCabinetParams,
  Part3D,
} from '../types';

export function generateKitchenCabinetBlueprint(
  params: KitchenCabinetParams
): GeneratedBlueprint {
  const {
    widthCm,
    heightCm,
    depthCm,
    boardThicknessMm,
    doorsCount,
    drawersCount,
    shelvesCount,
    toeKickHeightCm,
    includeCountertop,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const hM = heightCm / 100;
  const dM = depthCm / 100;
  const tM = boardThicknessMm / 1000;
  const toeM = toeKickHeightCm / 100;
  const counterThickM = includeCountertop ? 0.035 : 0;

  const carcassHeightM = Math.max(0.3, hM - toeM - counterThickM);
  const carcassHeightCm = carcassHeightM * 100;
  const carcassBaseY = toeM;
  const carcassDepthM = dM - 0.02; // 2cm front door space
  const carcassDepthCm = carcassDepthM * 100;

  // 1. Toe Kick (Zócalo inferior)
  if (toeKickHeightCm > 0) {
    const toeWidthM = wM - tM * 2;
    parts.push({
      id: 'toe-kick-front',
      name: 'Zócalo Frontal Inferior',
      partCode: 'ZOC-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [toeWidthM, toeM, tM],
      positionM: [0, toeM / 2, carcassDepthM / 2 - 0.04],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(toeWidthM * 100).toFixed(1)} × ${toeKickHeightCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 2. Left & Right Side Panels (Costados Laterales)
  for (const [suffix, x] of [
    ['left', -wM / 2 + tM / 2],
    ['right', wM / 2 - tM / 2],
  ] as const) {
    parts.push({
      id: `side-${suffix}`,
      name: 'Costado Lateral Vertical',
      partCode: 'LAT-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [tM, carcassHeightM, carcassDepthM],
      positionM: [x, carcassBaseY + carcassHeightM / 2, -0.01],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${carcassHeightCm.toFixed(1)} × ${carcassDepthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 3. Bottom & Top Stretchers (Piso y Amarres Superiores)
  const innerWidthM = wM - tM * 2;
  const innerWidthCm = innerWidthM * 100;

  parts.push({
    id: 'bottom-panel',
    name: 'Base / Piso del Mueble',
    partCode: 'BAS-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [innerWidthM, tM, carcassDepthM],
    positionM: [0, carcassBaseY + tM / 2, -0.01],
    rotationRad: [0, 0, 0],
    colorHex: mat.secondaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${innerWidthCm.toFixed(1)} × ${carcassDepthCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // Back Panel (Fondo MDF 6mm)
  parts.push({
    id: 'back-panel',
    name: 'Fondo Posterior Rigidez',
    partCode: 'FON-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [innerWidthM, carcassHeightM - tM * 2, 0.006],
    positionM: [0, carcassBaseY + carcassHeightM / 2, -carcassDepthM / 2 - 0.005],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: 0.05,
    roughness: 0.7,
    cutDimensionsLabel: `${innerWidthCm.toFixed(1)} × ${(carcassHeightCm - (boardThicknessMm * 2) / 10).toFixed(1)} cm (Esp. 6 mm)`,
    materialLabel: 'MDF / Triplay 6mm',
  });

  // Split internal space: if drawersCount > 0, right third is drawer bank
  const hasDrawerColumn = drawersCount > 0 && widthCm >= 80;
  const drawerBankWidthM = hasDrawerColumn ? Math.min(0.55, innerWidthM * 0.36) : 0;
  const doorsZoneWidthM = hasDrawerColumn
    ? innerWidthM - drawerBankWidthM - tM
    : innerWidthM;

  const dividerX = -innerWidthM / 2 + doorsZoneWidthM + tM / 2;

  if (hasDrawerColumn) {
    const internalH = carcassHeightM - tM * 2;
    parts.push({
      id: 'vertical-divider',
      name: 'División Vertical Interna',
      partCode: 'DIV-01',
      layer: 'interior',
      shape: 'box',
      sizeM: [tM, internalH, carcassDepthM - 0.01],
      positionM: [dividerX, carcassBaseY + carcassHeightM / 2, -0.005],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(internalH * 100).toFixed(1)} × ${((carcassDepthM - 0.01) * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 4. Internal Shelves (Entrepaños en zona de puertas)
  const internalHeightM = carcassHeightM - tM * 2;
  const doorsZoneCenterX = hasDrawerColumn
    ? -innerWidthM / 2 + doorsZoneWidthM / 2
    : 0;

  for (let s = 1; s <= shelvesCount; s++) {
    const shelfY =
      carcassBaseY + tM + (internalHeightM / (shelvesCount + 1)) * s;
    const shelfDepthM = carcassDepthM - 0.03;
    parts.push({
      id: `shelf-${s}`,
      name: 'Entrepaño Interno Regulable',
      partCode: 'ENT-01',
      layer: 'interior',
      shape: 'box',
      sizeM: [doorsZoneWidthM, tM, shelfDepthM],
      positionM: [doorsZoneCenterX, shelfY, -0.01],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(doorsZoneWidthM * 100).toFixed(1)} × ${(shelfDepthM * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 5. Front Doors (Puertas con apertura interactiva)
  const gapM = 0.003; // 3mm gap between fronts
  const totalDoorSpanM = hasDrawerColumn ? doorsZoneWidthM + tM : wM;
  const singleDoorWidthM = (totalDoorSpanM - gapM * (doorsCount + 1)) / doorsCount;
  const doorHeightM = carcassHeightM - gapM * 2;
  const doorZ = dM / 2 - tM / 2;
  const doorsStartX = -wM / 2 + gapM;

  for (let d = 0; d < doorsCount; d++) {
    const centerX = doorsStartX + singleDoorWidthM / 2 + d * (singleDoorWidthM + gapM);
    const isLeftHinge = d % 2 === 0;
    const hingeDirection = isLeftHinge ? -1 : 1;

    parts.push({
      id: `door-${d}`,
      name: 'Puerta Frontal Batiente',
      partCode: 'PUE-01',
      layer: 'front',
      shape: 'box',
      sizeM: [singleDoorWidthM, doorHeightM, tM],
      positionM: [centerX, carcassBaseY + carcassHeightM / 2, doorZ],
      rotationRad: [0, 0, 0],
      colorHex: mat.primaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(doorHeightM * 100).toFixed(1)} × ${(singleDoorWidthM * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
      openTransform: {
        translateM: [
          hingeDirection * (singleDoorWidthM * 0.35),
          0,
          singleDoorWidthM * 0.65,
        ],
        rotateYRad: hingeDirection * 1.15,
      },
    });
  }

  // 6. Drawer Fronts & Boxes (Gavetas / Cajones en columna derecha)
  if (hasDrawerColumn && drawersCount > 0) {
    const drawerSpanWidthM = wM - totalDoorSpanM - gapM * 2;
    const singleDrawerFrontH =
      (carcassHeightM - gapM * (drawersCount + 1)) / drawersCount;
    const drawerCenterX = wM / 2 - gapM - drawerSpanWidthM / 2;

    for (let dr = 0; dr < drawersCount; dr++) {
      const centerY =
        carcassBaseY +
        gapM +
        singleDrawerFrontH / 2 +
        dr * (singleDrawerFrontH + gapM);

      parts.push({
        id: `drawer-front-${dr}`,
        name: 'Frente de Cajón / Gaveta',
        partCode: 'CAJ-01',
        layer: 'front',
        shape: 'box',
        sizeM: [drawerSpanWidthM, singleDrawerFrontH, tM],
        positionM: [drawerCenterX, centerY, doorZ],
        rotationRad: [0, 0, 0],
        colorHex: mat.primaryHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${(drawerSpanWidthM * 100).toFixed(1)} × ${(singleDrawerFrontH * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
        materialLabel: mat.label,
        openTransform: {
          translateM: [0, 0, dM * 0.45],
        },
      });
    }
  }

  // 7. Countertop (Mesón / Encimera superior + Salpicadero)
  if (includeCountertop) {
    const counterWidthM = wM + 0.02;
    const counterDepthM = dM + 0.02;
    parts.push({
      id: 'countertop',
      name: 'Mesón / Encimera Superior',
      partCode: 'MES-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [counterWidthM, counterThickM, counterDepthM],
      positionM: [0, hM - counterThickM / 2, 0.005],
      rotationRad: [0, 0, 0],
      colorHex: '#1e293b',
      opacity: 1,
      metalness: 0.25,
      roughness: 0.25,
      cutDimensionsLabel: `${(counterWidthM * 100).toFixed(1)} × ${(counterDepthM * 100).toFixed(1)} cm (Esp. 35 mm)`,
      materialLabel: 'Cuarzo / Granito / Postformado',
    });

    // Backsplash (Salpicadero posterior 8cm)
    parts.push({
      id: 'backsplash',
      name: 'Zócalo / Salpicadero de Mesón',
      partCode: 'MES-02',
      layer: 'cover',
      shape: 'box',
      sizeM: [counterWidthM, 0.07, 0.02],
      positionM: [0, hM + 0.035, -counterDepthM / 2 + 0.015],
      rotationRad: [0, 0, 0],
      colorHex: '#1e293b',
      opacity: 1,
      metalness: 0.25,
      roughness: 0.25,
      cutDimensionsLabel: `${(counterWidthM * 100).toFixed(1)} × 7.0 cm (Esp. 20 mm)`,
      materialLabel: 'Cuarzo / Granito / Postformado',
    });
  }

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Total',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.01, dM / 2 + 0.16],
      endM: [wM / 2, 0.01, dM / 2 + 0.16],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-depth',
      label: 'Profundidad',
      valueFormatted: `${depthCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.16, 0.01, -dM / 2],
      endM: [wM / 2 + 0.16, 0.01, dM / 2],
      colorHex: '#34d399',
      axis: 'z',
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
  ];

  return {
    title: 'Plano de Carpintería: Mueble de Cocina Modular',
    subtitle: `${widthCm} cm (Ancho) × ${heightCm} cm (Alto) × ${depthCm} cm (Fondo) | Tablero ${boardThicknessMm} mm`,
    category: 'kitchen_cabinet',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: wM,
      heightY: hM + (includeCountertop ? 0.07 : 0),
      depthZ: dM,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Altura neta de módulo (sin zócalo ni mesón): ${carcassHeightCm.toFixed(1)} cm`,
      `Luz interna total horizontal: ${innerWidthCm.toFixed(1)} cm`,
      `Distribución frontal: ${doorsCount} puerta(s) batiente(s)${hasDrawerColumn ? ` + columna de ${drawersCount} gaveta(s)` : ''}`,
      `Usa el botón "Abrir Puertas/Cajones" o "Rayos X" en el visor 3D para inspeccionar las divisiones internas`,
    ],
  };
}
