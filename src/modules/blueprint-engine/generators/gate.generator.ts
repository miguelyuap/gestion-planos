import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  DimensionLine3D,
  GeneratedBlueprint,
  Part3D,
  SlidingGateParams,
} from '../types';

export function generateSlidingGateBlueprint(
  params: SlidingGateParams
): GeneratedBlueprint {
  const {
    widthCm,
    heightCm,
    frameProfileMm,
    picketSpacingCm,
    bottomSheetHeightCm,
    gateStyle,
    includeGuideRail,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const hM = heightCm / 100;
  const profM = frameProfileMm / 1000;
  const spacingM = picketSpacingCm / 100;
  const sheetHM = Math.min(hM * 0.65, bottomSheetHeightCm / 100);
  const wheelClearanceM = 0.06; // 6 cm bottom clearance for rollers

  const leafHeightM = hM - wheelClearanceM;
  const innerWidthM = wM - profM * 2;
  const innerHeightM = leafHeightM - profM * 2;

  // Sliding opening animation when user clicks "Abrir / Deslizar"
  const gateSlideTransform = {
    translateM: [wM * 0.72, 0, 0] as [number, number, number],
  };

  // 1. Optional Floor Track Rail & Guide Posts (Riel de Piso y Columnas Guía)
  if (includeGuideRail) {
    const railLengthM = wM * 1.95;
    parts.push({
      id: 'gate-floor-rail',
      name: 'Riel Inferior de Piso (Ángulo / Redondo Macizo)',
      partCode: 'RIE-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [railLengthM, 0.025, 0.08],
      positionM: [wM * 0.42, 0.0125, 0],
      rotationRad: [0, 0, 0],
      colorHex: '#64748b',
      opacity: 1,
      metalness: 0.75,
      roughness: 0.3,
      cutDimensionsLabel: `${(railLengthM * 100).toFixed(0)} × 8.0 × 2.5 cm`,
      materialLabel: 'Riel Acero Laminado de Piso',
    });

    // Receiver Post (Left) & Guide Roller Post (Right)
    const postSizeM = Math.max(0.08, profM * 1.35);
    for (const [id, name, xPos] of [
      ['gate-post-receiver', 'Columna Recibidora de Cierre', -wM / 2 - postSizeM * 0.7],
      ['gate-post-guide', 'Columna Pórtico Guía Superior', wM / 2 + postSizeM * 0.7],
    ] as const) {
      parts.push({
        id,
        name,
        partCode: 'COL-01',
        layer: 'structure',
        shape: 'box',
        sizeM: [postSizeM, hM + 0.05, postSizeM],
        positionM: [xPos, (hM + 0.05) / 2, -profM * 0.9],
        rotationRad: [0, 0, 0],
        colorHex: mat.structureHex,
        opacity: 1,
        metalness: 0.6,
        roughness: 0.38,
        cutDimensionsLabel: `${((hM + 0.05) * 100).toFixed(1)} × ${(postSizeM * 100).toFixed(1)} × ${(postSizeM * 100).toFixed(1)} cm`,
        materialLabel: 'Columna Tubular de Anclaje',
      });
    }
  }

  // 2. Perimeter Tubular Gate Frame (Bastidor Perimetral Móvil)
  // Left & Right Vertical Stiles
  for (const [suffix, x] of [
    ['left', -wM / 2 + profM / 2],
    ['right', wM / 2 - profM / 2],
  ] as const) {
    parts.push({
      id: `gate-stile-${suffix}`,
      name: 'Paral Vertical de Bastidor Principal',
      partCode: 'BAS-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [profM, leafHeightM, profM],
      positionM: [x, wheelClearanceM + leafHeightM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: 0.6,
      roughness: 0.35,
      cutDimensionsLabel: `${(leafHeightM * 100).toFixed(1)} × ${(frameProfileMm / 10).toFixed(1)} × ${(frameProfileMm / 10).toFixed(1)} cm`,
      materialLabel: `Perfil Tubular ${frameProfileMm}×${frameProfileMm} mm`,
      openTransform: gateSlideTransform,
    });
  }

  // Top & Bottom Horizontal Frame Rails
  for (const [id, name, yPos] of [
    [
      'gate-rail-top',
      'Cabezal Horizontal Superior',
      wheelClearanceM + leafHeightM - profM / 2,
    ],
    [
      'gate-rail-bottom',
      'Travesaño Horizontal Inferior Portarruedas',
      wheelClearanceM + profM / 2,
    ],
  ] as const) {
    parts.push({
      id,
      name,
      partCode: 'BAS-02',
      layer: 'structure',
      shape: 'box',
      sizeM: [innerWidthM, profM, profM],
      positionM: [0, yPos, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: 0.6,
      roughness: 0.35,
      cutDimensionsLabel: `${(innerWidthM * 100).toFixed(1)} × ${(frameProfileMm / 10).toFixed(1)} × ${(frameProfileMm / 10).toFixed(1)} cm`,
      materialLabel: `Perfil Tubular ${frameProfileMm}×${frameProfileMm} mm`,
      openTransform: gateSlideTransform,
    });
  }

  // 3. Heavy-Duty Bottom Rollers (Ruedas de Carga con Rodamiento)
  for (const [suffix, xWheel] of [
    ['left', -wM / 2 + 0.28],
    ['right', wM / 2 - 0.28],
  ] as const) {
    parts.push({
      id: `gate-wheel-${suffix}`,
      name: 'Rueda Canal en V Acero Torneado',
      partCode: 'HER-01',
      layer: 'hardware',
      shape: 'cylinder',
      sizeM: [0.09, 0.035, 0.09],
      positionM: [xWheel, wheelClearanceM * 0.6, 0],
      rotationRad: [Math.PI / 2, 0, 0],
      colorHex: '#fbbf24',
      opacity: 1,
      metalness: 0.85,
      roughness: 0.22,
      cutDimensionsLabel: 'Rueda Ø 90 mm con Doble Balinera',
      materialLabel: 'Herraje Rodamiento Pesado',
      openTransform: gateSlideTransform,
    });
  }

  // 4. Optional Bottom Blind Steel Sheet & Mid Transom (Zócalo Inferior en Lámina)
  let infillBottomY = wheelClearanceM + profM;
  if (sheetHM > 0.05) {
    const midRailY = wheelClearanceM + profM + sheetHM + profM / 2;

    parts.push({
      id: 'gate-bottom-sheet',
      name: 'Zócalo Inferior en Lámina Plegada Cal. 18',
      partCode: 'LAM-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [innerWidthM, sheetHM, 0.015],
      positionM: [0, wheelClearanceM + profM + sheetHM / 2, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: 0.55,
      roughness: 0.4,
      cutDimensionsLabel: `${(innerWidthM * 100).toFixed(1)} × ${(sheetHM * 100).toFixed(1)} cm (Lámina Cal. 18)`,
      materialLabel: 'Lámina Acero Cold Rolled Cal. 18',
      openTransform: gateSlideTransform,
    });

    parts.push({
      id: 'gate-mid-rail',
      name: 'Travesaño Intermedio Divisor',
      partCode: 'BAS-03',
      layer: 'secondary',
      shape: 'box',
      sizeM: [innerWidthM, profM * 0.8, profM],
      positionM: [0, midRailY, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: 0.6,
      roughness: 0.35,
      cutDimensionsLabel: `${(innerWidthM * 100).toFixed(1)} × ${((frameProfileMm * 0.8) / 10).toFixed(1)} × ${(frameProfileMm / 10).toFixed(1)} cm`,
      materialLabel: `Perfil Tubular Divisor`,
      openTransform: gateSlideTransform,
    });

    infillBottomY = midRailY + (profM * 0.8) / 2;
  }

  // 5. Gate Infill: Vertical Pickets (Barrotes) or Horizontal Louvers (Entablonado)
  const infillTopY = wheelClearanceM + leafHeightM - profM;
  const clearInfillHeightM = Math.max(0.2, infillTopY - infillBottomY);
  const infillCenterY = infillBottomY + clearInfillHeightM / 2;

  let infillCount = 0;

  if (gateStyle === 'vertical_pickets') {
    const picketThickM = 0.025; // 25x25 mm square tube
    infillCount = Math.max(
      2,
      Math.min(45, Math.floor(innerWidthM / spacingM) - 1)
    );
    const actualStepX = innerWidthM / (infillCount + 1);

    for (let i = 1; i <= infillCount; i++) {
      const xPos = -innerWidthM / 2 + i * actualStepX;
      parts.push({
        id: `gate-picket-${i}`,
        name: 'Barrote Vertical Tubular',
        partCode: 'BAR-01',
        layer: 'front',
        shape: 'box',
        sizeM: [picketThickM, clearInfillHeightM, picketThickM],
        positionM: [xPos, infillCenterY, 0],
        rotationRad: [0, 0, 0],
        colorHex: mat.primaryHex,
        opacity: 1,
        metalness: 0.55,
        roughness: 0.38,
        cutDimensionsLabel: `${(clearInfillHeightM * 100).toFixed(1)} × 2.5 × 2.5 cm`,
        materialLabel: 'Perfil Tubular 25×25 mm',
        openTransform: gateSlideTransform,
      });
    }
  } else {
    // horizontal_louvers
    const louverHeightM = 0.065;
    const louverDepthM = 0.025;
    infillCount = Math.max(
      2,
      Math.min(28, Math.floor(clearInfillHeightM / spacingM))
    );
    const actualStepY = clearInfillHeightM / (infillCount + 1);

    for (let i = 1; i <= infillCount; i++) {
      const yPos = infillBottomY + i * actualStepY;
      parts.push({
        id: `gate-louver-${i}`,
        name: 'Perfil Horizontal Tipo Louver',
        partCode: 'LOU-01',
        layer: 'front',
        shape: 'box',
        sizeM: [innerWidthM - 0.004, louverHeightM, louverDepthM],
        positionM: [0, yPos, 0],
        rotationRad: [0.22, 0, 0],
        colorHex: mat.primaryHex,
        opacity: 1,
        metalness: 0.55,
        roughness: 0.38,
        cutDimensionsLabel: `${((innerWidthM - 0.004) * 100).toFixed(1)} × 6.5 × 2.5 cm`,
        materialLabel: 'Perfil Rectangular 65×25 mm',
        openTransform: gateSlideTransform,
      });
    }
  }

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Hoja Portón',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.02, 0.25],
      endM: [wM / 2, 0.02, 0.25],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-height',
      label: 'Altura Total',
      valueFormatted: `${heightCm.toFixed(0)} cm`,
      startM: [-wM / 2 - 0.22, 0, 0],
      endM: [-wM / 2 - 0.22, hM, 0],
      colorHex: '#fbbf24',
      axis: 'y',
    },
    {
      id: 'dim-infill-height',
      label: 'Luz Reja Superior',
      valueFormatted: `${(clearInfillHeightM * 100).toFixed(1)} cm`,
      startM: [wM / 2 + 0.22, infillBottomY, 0],
      endM: [wM / 2 + 0.22, infillTopY, 0],
      colorHex: '#34d399',
      axis: 'y',
    },
  ];

  return {
    title: 'Plano Metalmecánico: Portón Corredizo / Reja Estructural',
    subtitle: `${widthCm} × ${heightCm} cm | Bastidor ${frameProfileMm} mm | ${infillCount} ${gateStyle === 'vertical_pickets' ? 'Barrotes Verticales' : 'Perfiles Horizontales'}`,
    category: 'sliding_gate',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: includeGuideRail ? wM * 1.45 : wM,
      heightY: hM,
      depthZ: 0.4,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Altura neta del bastidor metálico (descontando 6 cm de ruedas): ${(leafHeightM * 100).toFixed(1)} cm`,
      `Cantidad calculada de elementos de relleno: ${infillCount} piezas de ${(gateStyle === 'vertical_pickets' ? clearInfillHeightM * 100 : innerWidthM * 100).toFixed(1)} cm`,
      `Longitud total recomendada del riel de piso: ${(wM * 195).toFixed(0)} cm para apertura libre al 100%`,
    ],
  };
}
