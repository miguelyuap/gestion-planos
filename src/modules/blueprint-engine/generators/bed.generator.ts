import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  BedParams,
  DimensionLine3D,
  GeneratedBlueprint,
  Part3D,
} from '../types';

export function generateBedBlueprint(params: BedParams): GeneratedBlueprint {
  const {
    widthCm,
    lengthCm,
    baseHeightCm,
    headboardHeightCm,
    boardThicknessMm,
    slatsCount,
    underDrawersCount,
    includeMattressGuide,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const lM = lengthCm / 100;
  const baseHM = baseHeightCm / 100;
  const headHM = headboardHeightCm / 100;
  const tM = boardThicknessMm / 1000;

  const innerWidthM = wM - tM * 2;
  const innerLengthM = lM - tM * 2;

  // 1. Headboard (Cabecero Estructural Posterior en -Z)
  parts.push({
    id: 'bed-headboard',
    name: 'Cabecero Principal Estructural',
    partCode: 'CAB-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [wM, headHM, tM * 1.4],
    positionM: [0, headHM / 2, -lM / 2 + (tM * 1.4) / 2],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${widthCm.toFixed(1)} × ${headboardHeightCm.toFixed(1)} cm (Esp. ${(boardThicknessMm * 1.4).toFixed(0)} mm)`,
    materialLabel: mat.label,
  });

  // Decorative Upholstered / Accent Headboard Cushion Panels
  const cushionHeightM = Math.max(0.25, (headHM - baseHM) * 0.72);
  const cushionWidthM = (wM - 0.12) / 2;
  for (const [idx, xOffset] of [
    [1, -cushionWidthM / 2 - 0.015],
    [2, cushionWidthM / 2 + 0.015],
  ] as const) {
    parts.push({
      id: `headboard-panel-${idx}`,
      name: 'Panel Decorativo de Cabecero',
      partCode: 'CAB-02',
      layer: 'front',
      shape: 'box',
      sizeM: [cushionWidthM, cushionHeightM, 0.025],
      positionM: [
        xOffset,
        baseHM + (headHM - baseHM) * 0.52,
        -lM / 2 + tM * 1.4 + 0.014,
      ],
      rotationRad: [0, 0, 0],
      colorHex: mat.accentHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(cushionWidthM * 100).toFixed(1)} × ${(cushionHeightM * 100).toFixed(1)} × 2.5 cm`,
      materialLabel: mat.label,
    });
  }

  // 2. Footboard (Piecero Frontal en +Z)
  parts.push({
    id: 'bed-footboard',
    name: 'Piecero Frontal de Cama',
    partCode: 'PIE-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [wM, baseHM, tM],
    positionM: [0, baseHM / 2, lM / 2 - tM / 2],
    rotationRad: [0, 0, 0],
    colorHex: mat.primaryHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${widthCm.toFixed(1)} × ${baseHeightCm.toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
    materialLabel: mat.label,
  });

  // 3. Left & Right Side Rails (Largueros Laterales)
  const railHeightM = Math.max(0.18, baseHM * 0.78);
  const railCenterY = baseHM - railHeightM / 2;
  for (const [suffix, x] of [
    ['left', -wM / 2 + tM / 2],
    ['right', wM / 2 - tM / 2],
  ] as const) {
    parts.push({
      id: `side-rail-${suffix}`,
      name: 'Larguero Lateral Estructural',
      partCode: 'LAR-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [tM, railHeightM, innerLengthM],
      positionM: [x, railCenterY, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.primaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(innerLengthM * 100).toFixed(1)} × ${(railHeightM * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
      materialLabel: mat.label,
    });
  }

  // 4. Center Longitudinal Spine Beam & Support Post (Travesaño Central de Refuerzo)
  const slatSupportY = baseHM - 0.06;
  parts.push({
    id: 'center-beam',
    name: 'Viga Central Longitudinal de Soporte',
    partCode: 'VIG-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [0.045, 0.09, innerLengthM],
    positionM: [0, slatSupportY - 0.045, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: mat.metalness,
    roughness: mat.roughness,
    cutDimensionsLabel: `${(innerLengthM * 100).toFixed(1)} × 9.0 × 4.5 cm`,
    materialLabel: mat.label,
  });

  // 5. Bed Slats / Somier (Tablas del Tendido)
  const slatWidthM = 0.075; // 7.5 cm wide wooden slats
  const slatThickM = 0.018; // 18 mm thick slats
  const usableSlatSpanZ = innerLengthM - 0.14;
  for (let i = 0; i < slatsCount; i++) {
    const ratio = slatsCount === 1 ? 0.5 : i / (slatsCount - 1);
    const zPos = -usableSlatSpanZ / 2 + ratio * usableSlatSpanZ;
    parts.push({
      id: `bed-slat-${i + 1}`,
      name: 'Tabla Transversal de Tendido / Somier',
      partCode: 'TEN-01',
      layer: 'interior',
      shape: 'box',
      sizeM: [innerWidthM - 0.006, slatThickM, slatWidthM],
      positionM: [0, slatSupportY + slatThickM / 2, zPos],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: 0.05,
      roughness: 0.7,
      cutDimensionsLabel: `${((innerWidthM - 0.006) * 100).toFixed(1)} × 7.5 × 1.8 cm`,
      materialLabel: 'Madera Pino / Somier Cepillado',
    });
  }

  // 6. Optional Under-Bed Storage Drawers (Cajones Inferiores Extraíbles)
  if (underDrawersCount > 0) {
    const drawerHeightM = Math.max(0.14, baseHM - 0.09);
    const drawerDepthM = Math.min(0.55, wM * 0.42);
    const drawersPerSide = Math.ceil(underDrawersCount / 2);
    const drawerWidthZ = (innerLengthM - 0.16) / drawersPerSide;

    for (let d = 0; d < underDrawersCount; d++) {
      const isLeft = d % 2 === 0;
      const sideSign = isLeft ? -1 : 1;
      const slotIdx = Math.floor(d / 2);
      const zCenter =
        -innerLengthM / 2 + 0.08 + drawerWidthZ * (slotIdx + 0.5);
      const xFront = sideSign * (wM / 2 - tM / 2);

      const slideDistanceM = drawerDepthM * 0.78;
      const openTransform = {
        translateM: [sideSign * slideDistanceM, 0, 0] as [number, number, number],
      };

      parts.push({
        id: `under-drawer-front-${d + 1}`,
        name: 'Frente de Cajón Inferior con Ruedas',
        partCode: 'CAJ-01',
        layer: 'front',
        shape: 'box',
        sizeM: [tM, drawerHeightM, drawerWidthZ - 0.015],
        positionM: [xFront, drawerHeightM / 2 + 0.015, zCenter],
        rotationRad: [0, 0, 0],
        colorHex: mat.accentHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${((drawerWidthZ - 0.015) * 100).toFixed(1)} × ${(drawerHeightM * 100).toFixed(1)} cm (Esp. ${boardThicknessMm} mm)`,
        materialLabel: mat.label,
        openTransform,
      });

      parts.push({
        id: `under-drawer-box-${d + 1}`,
        name: 'Cajón Contenedor Inferior',
        partCode: 'CAJ-02',
        layer: 'interior',
        shape: 'box',
        sizeM: [drawerDepthM, drawerHeightM - 0.02, drawerWidthZ - 0.04],
        positionM: [
          sideSign * (wM / 2 - drawerDepthM / 2 - tM),
          drawerHeightM / 2 + 0.01,
          zCenter,
        ],
        rotationRad: [0, 0, 0],
        colorHex: mat.secondaryHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${((drawerWidthZ - 0.04) * 100).toFixed(1)} × ${(drawerDepthM * 100).toFixed(1)} × ${((drawerHeightM - 0.02) * 100).toFixed(1)} cm`,
        materialLabel: mat.label,
        openTransform,
      });
    }
  }

  // 7. Optional Reference Mattress Volume (Colchón Guía de Referencia)
  if (includeMattressGuide) {
    const mattressHeightM = 0.22;
    parts.push({
      id: 'mattress-reference',
      name: 'Colchón Guía de Referencia (No requiere corte)',
      partCode: 'REF-COL',
      layer: 'cover',
      shape: 'box',
      sizeM: [innerWidthM - 0.01, mattressHeightM, innerLengthM - 0.01],
      positionM: [
        0,
        slatSupportY + slatThickM + mattressHeightM / 2,
        0.005,
      ],
      rotationRad: [0, 0, 0],
      colorHex: '#e2e8f0',
      opacity: 0.45,
      metalness: 0.05,
      roughness: 0.85,
      cutDimensionsLabel: `${(innerWidthM * 100).toFixed(0)} × ${(innerLengthM * 100).toFixed(0)} × 22.0 cm (Medida Colchón)`,
      materialLabel: 'Referencia Ergonómica de Colchón',
    });
  }

  const bedSizeLabel =
    widthCm <= 105
      ? 'Sencilla / Twin'
      : widthCm <= 145
        ? 'Doble / Full'
        : widthCm <= 170
          ? 'Queen Size'
          : 'King Size';

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: `Ancho (${bedSizeLabel})`,
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.02, lM / 2 + 0.18],
      endM: [wM / 2, 0.02, lM / 2 + 0.18],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-length',
      label: 'Largo Total',
      valueFormatted: `${lengthCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.18, 0.02, -lM / 2],
      endM: [wM / 2 + 0.18, 0.02, lM / 2],
      colorHex: '#34d399',
      axis: 'z',
    },
    {
      id: 'dim-headboard',
      label: 'Alto Cabecero',
      valueFormatted: `${headboardHeightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.18, 0, -lM / 2],
      endM: [-wM / 2 - 0.18, headHM, -lM / 2],
      colorHex: '#fbbf24',
      axis: 'y',
    },
    {
      id: 'dim-base-height',
      label: 'Alto Base',
      valueFormatted: `${baseHeightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.18, 0, lM / 2],
      endM: [-wM / 2 - 0.18, baseHM, lM / 2],
      colorHex: '#f472b6',
      axis: 'y',
    },
  ];

  return {
    title: `Plano de Mobiliario: Cama ${bedSizeLabel} con Cabecero`,
    subtitle: `${widthCm} × ${lengthCm} cm | Cabecero ${headboardHeightCm} cm | ${slatsCount} Tablas de Tendido | ${underDrawersCount} Cajones`,
    category: 'bed',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: wM,
      heightY: headHM,
      depthZ: lM,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(
      parts.filter((p) => p.partCode !== 'REF-COL')
    ),
    technicalNotes: [
      `Medida interna libre para colchón: ${(innerWidthM * 100).toFixed(1)} cm (ancho) × ${(innerLengthM * 100).toFixed(1)} cm (largo)`,
      `Separación centro a centro entre tablas del tendido: ${(innerLengthM * 100 / Math.max(1, slatsCount - 1)).toFixed(1)} cm`,
      `Viga central longitudinal de 9.0 × 4.5 cm incluida para evitar flexión de las tablas`,
    ],
  };
}
