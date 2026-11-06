import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type { DimensionLine3D, GeneratedBlueprint, Part3D, RoofParams } from '../types';

export function generateRoofBlueprint(params: RoofParams): GeneratedBlueprint {
  const {
    roofSubtype,
    widthM,
    lengthM,
    columnHeightM,
    pitchDegrees,
    overhangM,
    purlinSpacingM,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const colSize = 0.12; // 12x12 cm column
  const beamHeight = 0.14;
  const beamWidth = 0.1;
  const purlinSize = 0.06;
  const sheetThickness = 0.03;

  const halfW = widthM / 2;
  const halfL = lengthM / 2;

  // Number of column bays along length (every ~3.5m, min 2 per side)
  const baysZ = Math.max(1, Math.ceil(lengthM / 3.5));
  const stepZ = lengthM / baysZ;

  const effectivePitch = roofSubtype === 'pergola' ? 0 : pitchDegrees;
  const pitchRad = (effectivePitch * Math.PI) / 180;

  // Ridge height calculation
  const riseM =
    roofSubtype === 'gable'
      ? halfW * Math.tan(pitchRad)
      : roofSubtype === 'shed'
        ? widthM * Math.tan(pitchRad)
        : 0;

  // 1. Columns along left and right sides
  for (let i = 0; i <= baysZ; i++) {
    const z = -halfL + i * stepZ;

    // Left column (-halfW)
    const leftColHeight = columnHeightM;
    parts.push({
      id: `col-left-${i}`,
      name: 'Columna Estructural Izquierda',
      partCode: 'COL-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [colSize, leftColHeight, colSize],
      positionM: [-halfW + colSize / 2, leftColHeight / 2, z],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: 0.5,
      roughness: 0.4,
      cutDimensionsLabel: `${leftColHeight.toFixed(2)} m × ${(colSize * 100).toFixed(0)}×${(colSize * 100).toFixed(0)} cm`,
      materialLabel: 'Perfil Estructural Columna',
    });

    // Right column (+halfW)
    const rightColHeight = roofSubtype === 'shed' ? columnHeightM + riseM : columnHeightM;
    parts.push({
      id: `col-right-${i}`,
      name: roofSubtype === 'shed' ? 'Columna Estructural Alta' : 'Columna Estructural Derecha',
      partCode: roofSubtype === 'shed' ? 'COL-02' : 'COL-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [colSize, rightColHeight, colSize],
      positionM: [halfW - colSize / 2, rightColHeight / 2, z],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: 0.5,
      roughness: 0.4,
      cutDimensionsLabel: `${rightColHeight.toFixed(2)} m × ${(colSize * 100).toFixed(0)}×${(colSize * 100).toFixed(0)} cm`,
      materialLabel: 'Perfil Estructural Columna',
    });
  }

  // 2. Longitudinal Tie Beams (Vigas Soleras / Cargueras)
  const leftBeamY = columnHeightM + beamHeight / 2;
  const rightBeamY =
    (roofSubtype === 'shed' ? columnHeightM + riseM : columnHeightM) + beamHeight / 2;

  parts.push({
    id: 'beam-left',
    name: 'Viga Solera Longitudinal Izquierda',
    partCode: 'VIG-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [beamWidth, beamHeight, lengthM],
    positionM: [-halfW + colSize / 2, leftBeamY, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: 0.5,
    roughness: 0.4,
    cutDimensionsLabel: `${lengthM.toFixed(2)} m × ${(beamWidth * 100).toFixed(0)}×${(beamHeight * 100).toFixed(0)} cm`,
    materialLabel: 'Viga Principal de Carga',
  });

  parts.push({
    id: 'beam-right',
    name: 'Viga Solera Longitudinal Derecha',
    partCode: 'VIG-01',
    layer: 'structure',
    shape: 'box',
    sizeM: [beamWidth, beamHeight, lengthM],
    positionM: [halfW - colSize / 2, rightBeamY, 0],
    rotationRad: [0, 0, 0],
    colorHex: mat.structureHex,
    opacity: 1,
    metalness: 0.5,
    roughness: 0.4,
    cutDimensionsLabel: `${lengthM.toFixed(2)} m × ${(beamWidth * 100).toFixed(0)}×${(beamHeight * 100).toFixed(0)} cm`,
    materialLabel: 'Viga Principal de Carga',
  });

  const baseRoofY = columnHeightM + beamHeight;
  const totalDepthWithOverhang = lengthM + overhangM * 2;

  if (roofSubtype === 'gable') {
    // Two-slope roof (Dos aguas)
    const spanSide = halfW + overhangM;
    const slopeLength = spanSide / Math.cos(pitchRad);

    // Ridge beam (Viga Cumbrera)
    parts.push({
      id: 'beam-ridge',
      name: 'Viga Cumbrera Central',
      partCode: 'VIG-02',
      layer: 'structure',
      shape: 'box',
      sizeM: [beamWidth, beamHeight, totalDepthWithOverhang],
      positionM: [0, baseRoofY + riseM, 0],
      rotationRad: [0, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: 0.5,
      roughness: 0.4,
      cutDimensionsLabel: `${totalDepthWithOverhang.toFixed(2)} m × ${(beamWidth * 100).toFixed(0)}×${(beamHeight * 100).toFixed(0)} cm`,
      materialLabel: 'Viga Cumbrera',
    });

    // Rafters (Cerchas / Cabios transversales) at each column bay
    for (let i = 0; i <= baysZ; i++) {
      const z = -halfL + i * stepZ;

      // Left rafter
      const midXLeft = -spanSide / 2 + overhangM / 2;
      const midYLeft = baseRoofY + (riseM - overhangM * Math.tan(pitchRad)) / 2;
      parts.push({
        id: `rafter-left-${i}`,
        name: 'Viga Inclinada / Cercha (Faldón Izquierdo)',
        partCode: 'CER-01',
        layer: 'structure',
        shape: 'box',
        sizeM: [slopeLength, beamHeight * 0.85, beamWidth * 0.85],
        positionM: [midXLeft, midYLeft, z],
        rotationRad: [0, 0, pitchRad],
        colorHex: mat.secondaryHex,
        opacity: 1,
        metalness: 0.45,
        roughness: 0.45,
        cutDimensionsLabel: `${slopeLength.toFixed(2)} m (Corte a ${effectivePitch}°)`,
        materialLabel: 'Perfil Cercha Inclinada',
      });

      // Right rafter
      const midXRight = spanSide / 2 - overhangM / 2;
      parts.push({
        id: `rafter-right-${i}`,
        name: 'Viga Inclinada / Cercha (Faldón Derecho)',
        partCode: 'CER-01',
        layer: 'structure',
        shape: 'box',
        sizeM: [slopeLength, beamHeight * 0.85, beamWidth * 0.85],
        positionM: [midXRight, midYLeft, z],
        rotationRad: [0, 0, -pitchRad],
        colorHex: mat.secondaryHex,
        opacity: 1,
        metalness: 0.45,
        roughness: 0.45,
        cutDimensionsLabel: `${slopeLength.toFixed(2)} m (Corte a ${effectivePitch}°)`,
        materialLabel: 'Perfil Cercha Inclinada',
      });
    }

    // Purlins (Correas longitudinales) along each slope
    const purlinCountPerSide = Math.max(2, Math.floor(slopeLength / purlinSpacingM) + 1);
    for (let p = 0; p < purlinCountPerSide; p++) {
      const t = purlinCountPerSide === 1 ? 0.5 : p / (purlinCountPerSide - 1);
      const xOffset = t * spanSide;
      const yOffset = (1 - t) * riseM - Math.max(0, xOffset - halfW) * Math.tan(pitchRad);

      // Left purlin
      parts.push({
        id: `purlin-left-${p}`,
        name: 'Correa de Cubierta Longitudinal',
        partCode: 'COR-01',
        layer: 'secondary',
        shape: 'box',
        sizeM: [purlinSize, purlinSize, totalDepthWithOverhang],
        positionM: [-xOffset, baseRoofY + yOffset + purlinSize, 0],
        rotationRad: [0, 0, pitchRad],
        colorHex: mat.secondaryHex,
        opacity: 1,
        metalness: 0.5,
        roughness: 0.4,
        cutDimensionsLabel: `${totalDepthWithOverhang.toFixed(2)} m × ${(purlinSize * 100).toFixed(0)}×${(purlinSize * 100).toFixed(0)} cm`,
        materialLabel: 'Perfil Correa (PHR / Tubo)',
      });

      // Right purlin
      if (p > 0) {
        parts.push({
          id: `purlin-right-${p}`,
          name: 'Correa de Cubierta Longitudinal',
          partCode: 'COR-01',
          layer: 'secondary',
          shape: 'box',
          sizeM: [purlinSize, purlinSize, totalDepthWithOverhang],
          positionM: [xOffset, baseRoofY + yOffset + purlinSize, 0],
          rotationRad: [0, 0, -pitchRad],
          colorHex: mat.secondaryHex,
          opacity: 1,
          metalness: 0.5,
          roughness: 0.4,
          cutDimensionsLabel: `${totalDepthWithOverhang.toFixed(2)} m × ${(purlinSize * 100).toFixed(0)}×${(purlinSize * 100).toFixed(0)} cm`,
          materialLabel: 'Perfil Correa (PHR / Tubo)',
        });
      }
    }

    // Roof Cover Sheets (Faldón Izquierdo y Faldón Derecho)
    const sheetY = baseRoofY + (riseM - overhangM * Math.tan(pitchRad)) / 2 + purlinSize * 1.6;
    parts.push({
      id: 'cover-left',
      name: 'Cubierta Faldón Izquierdo',
      partCode: 'CUB-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [slopeLength, sheetThickness, totalDepthWithOverhang],
      positionM: [-spanSide / 2, sheetY, 0],
      rotationRad: [0, 0, pitchRad],
      colorHex: mat.primaryHex,
      opacity: mat.opacity ?? 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${slopeLength.toFixed(2)} m × ${totalDepthWithOverhang.toFixed(2)} m (${(slopeLength * totalDepthWithOverhang).toFixed(1)} m²)`,
      materialLabel: mat.label,
    });

    parts.push({
      id: 'cover-right',
      name: 'Cubierta Faldón Derecho',
      partCode: 'CUB-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [slopeLength, sheetThickness, totalDepthWithOverhang],
      positionM: [spanSide / 2, sheetY, 0],
      rotationRad: [0, 0, -pitchRad],
      colorHex: mat.primaryHex,
      opacity: mat.opacity ?? 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${slopeLength.toFixed(2)} m × ${totalDepthWithOverhang.toFixed(2)} m (${(slopeLength * totalDepthWithOverhang).toFixed(1)} m²)`,
      materialLabel: mat.label,
    });
  } else {
    // Shed (Un agua) or Pergola (0 degrees)
    const totalSpanX = widthM + overhangM * 2;
    const slopeLength = totalSpanX / Math.cos(pitchRad);
    const centerSlopeY = baseRoofY + riseM / 2;

    // Cross rafters
    for (let i = 0; i <= baysZ; i++) {
      const z = -halfL + i * stepZ;
      parts.push({
        id: `rafter-single-${i}`,
        name: 'Viga Transversal de Cubierta',
        partCode: 'CER-01',
        layer: 'structure',
        shape: 'box',
        sizeM: [slopeLength, beamHeight * 0.85, beamWidth * 0.85],
        positionM: [0, centerSlopeY, z],
        rotationRad: [0, 0, pitchRad],
        colorHex: mat.secondaryHex,
        opacity: 1,
        metalness: 0.45,
        roughness: 0.45,
        cutDimensionsLabel: `${slopeLength.toFixed(2)} m`,
        materialLabel: 'Viga Transversal',
      });
    }

    // Purlins along Z
    const purlinCount = Math.max(2, Math.floor(totalSpanX / purlinSpacingM) + 1);
    for (let p = 0; p < purlinCount; p++) {
      const t = purlinCount === 1 ? 0.5 : p / (purlinCount - 1);
      const x = -totalSpanX / 2 + t * totalSpanX;
      const y = baseRoofY + (t - 0.5) * riseM + riseM / 2 + purlinSize;
      parts.push({
        id: `purlin-single-${p}`,
        name: roofSubtype === 'pergola' ? 'Listón / Vigueta de Pérgola' : 'Correa Longitudinal',
        partCode: 'COR-01',
        layer: 'secondary',
        shape: 'box',
        sizeM: [purlinSize, purlinSize, totalDepthWithOverhang],
        positionM: [x, y, 0],
        rotationRad: [0, 0, pitchRad],
        colorHex: mat.primaryHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${totalDepthWithOverhang.toFixed(2)} m × ${(purlinSize * 100).toFixed(0)}×${(purlinSize * 100).toFixed(0)} cm`,
        materialLabel: roofSubtype === 'pergola' ? mat.label : 'Perfil Correa',
      });
    }

    if (roofSubtype === 'shed') {
      parts.push({
        id: 'cover-shed',
        name: 'Superficie de Cubierta (Un Agua)',
        partCode: 'CUB-01',
        layer: 'cover',
        shape: 'box',
        sizeM: [slopeLength, sheetThickness, totalDepthWithOverhang],
        positionM: [0, centerSlopeY + purlinSize * 1.6, 0],
        rotationRad: [0, 0, pitchRad],
        colorHex: mat.primaryHex,
        opacity: mat.opacity ?? 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${slopeLength.toFixed(2)} m × ${totalDepthWithOverhang.toFixed(2)} m (${(slopeLength * totalDepthWithOverhang).toFixed(1)} m²)`,
        materialLabel: mat.label,
      });
    }
  }

  const maxTotalHeight = baseRoofY + riseM + 0.1;

  // 3. Technical 3D Dimension Lines (Cotas)
  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho entre apoyos',
      valueFormatted: `${widthM.toFixed(2)} m`,
      startM: [-halfW, 0.02, halfL + 0.45],
      endM: [halfW, 0.02, halfL + 0.45],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-length',
      label: 'Largo / Fondo',
      valueFormatted: `${lengthM.toFixed(2)} m`,
      startM: [halfW + 0.45, 0.02, -halfL],
      endM: [halfW + 0.45, 0.02, halfL],
      colorHex: '#34d399',
      axis: 'z',
    },
    {
      id: 'dim-col-height',
      label: 'Altura Columna',
      valueFormatted: `${columnHeightM.toFixed(2)} m`,
      startM: [-halfW - 0.35, 0, halfL],
      endM: [-halfW - 0.35, columnHeightM, halfL],
      colorHex: '#fbbf24',
      axis: 'y',
    },
  ];

  if (riseM > 0.05) {
    dimensions.push({
      id: 'dim-ridge-height',
      label: `Altura Máx (${effectivePitch}°)`,
      valueFormatted: `${(baseRoofY + riseM).toFixed(2)} m`,
      startM: [
        roofSubtype === 'gable' ? 0 : halfW,
        0,
        -halfL - 0.35,
      ],
      endM: [
        roofSubtype === 'gable' ? 0 : halfW,
        baseRoofY + riseM,
        -halfL - 0.35,
      ],
      colorHex: '#f472b6',
      axis: 'y',
    });
  }

  const subtypeLabel =
    roofSubtype === 'gable'
      ? 'Cubierta a Dos Aguas'
      : roofSubtype === 'shed'
        ? 'Cubierta a Un Agua'
        : 'Pérgola Estructural';

  const planArea = widthM * lengthM;
  const totalRoofArea =
    ((widthM + overhangM * 2) / Math.cos(pitchRad)) * (lengthM + overhangM * 2);

  return {
    title: `Plano Estructural: ${subtypeLabel}`,
    subtitle: `${widthM.toFixed(2)} m × ${lengthM.toFixed(2)} m | Altura libre ${columnHeightM.toFixed(2)} m | Pendiente ${effectivePitch}°`,
    category: 'roof',
    unitSystem: 'm',
    boundingBoxM: {
      widthX: widthM + overhangM * 2,
      heightY: maxTotalHeight,
      depthZ: lengthM + overhangM * 2,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Área útil entre columnas: ${planArea.toFixed(2)} m²`,
      `Área real de cubierta (incluyendo aleros de ${(overhangM * 100).toFixed(0)} cm y pendiente de ${effectivePitch}°): ${totalRoofArea.toFixed(2)} m²`,
      `Diferencia de nivel (flecha/cumbrera): ${(riseM * 100).toFixed(1)} cm sobre nivel de viga solera`,
      `Separación configurada entre correas: ${(purlinSpacingM * 100).toFixed(0)} cm`,
    ],
  };
}
