import { buildCutListFromParts } from '../cutlist-helper';
import { getMaterialVisual } from '../materials';
import type {
  DimensionLine3D,
  GeneratedBlueprint,
  Part3D,
  StairsParams,
} from '../types';

export function generateStairsBlueprint(params: StairsParams): GeneratedBlueprint {
  const {
    widthCm,
    totalRiseCm,
    totalRunCm,
    stepsCount,
    treadThicknessMm,
    stringerWidthCm,
    includeRisers,
    includeHandrail,
    materialFinish,
  } = params;

  const mat = getMaterialVisual(materialFinish);
  const parts: Part3D[] = [];

  const wM = widthCm / 100;
  const riseM = totalRiseCm / 100;
  const runM = totalRunCm / 100;
  const treadThickM = treadThicknessMm / 1000;
  const stringerWidthM = stringerWidthCm / 100;
  const stringerThickM = 0.045; // 45 mm structural stringer thickness

  const stepRiseM = riseM / stepsCount;
  const stepRunM = runM / stepsCount;
  const stepRiseCm = stepRiseM * 100;
  const stepRunCm = stepRunM * 100;

  // Nosings / overhang per tread (2.5 cm front overlap)
  const nosingM = 0.025;
  const treadDepthM = stepRunM + nosingM;
  const clearTreadWidthM = wM - stringerThickM * 2;

  // Stringer trigonometry (runs from front-bottom +Z to back-top -Z)
  const pitchRad = Math.atan2(riseM, runM);
  const pitchDeg = (pitchRad * 180) / Math.PI;
  const stringerLengthM = Math.hypot(riseM, runM);
  const stringerCenterY = Math.max(stringerWidthM / 2, riseM / 2 - stepRiseM * 0.45);

  // 1. Left & Right Slanted Structural Stringers (Zancas / Vigas Laterales)
  for (const [suffix, x] of [
    ['left', -wM / 2 + stringerThickM / 2],
    ['right', wM / 2 - stringerThickM / 2],
  ] as const) {
    parts.push({
      id: `stringer-${suffix}`,
      name: 'Zanca / Viga Lateral Inclinada',
      partCode: 'ZAN-01',
      layer: 'structure',
      shape: 'box',
      sizeM: [stringerThickM, stringerWidthM, stringerLengthM],
      positionM: [x, stringerCenterY, 0],
      rotationRad: [pitchRad, 0, 0],
      colorHex: mat.structureHex,
      opacity: 1,
      metalness: materialFinish === 'industrial_steel' ? 0.65 : mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(stringerLengthM * 100).toFixed(1)} × ${stringerWidthCm.toFixed(1)} × 4.5 cm (Corte ${pitchDeg.toFixed(1)}°)`,
      materialLabel:
        materialFinish === 'industrial_steel'
          ? 'Canal / Perfil Estructural Acero'
          : mat.label,
    });

    // Bottom floor anchor plate & top slab landing plate
    parts.push({
      id: `anchor-bottom-${suffix}`,
      name: 'Placa Base de Anclaje a Piso',
      partCode: 'ANC-01',
      layer: 'hardware',
      shape: 'box',
      sizeM: [0.12, 0.012, 0.18],
      positionM: [x, 0.006, runM / 2 - 0.06],
      rotationRad: [0, 0, 0],
      colorHex: '#64748b',
      opacity: 1,
      metalness: 0.75,
      roughness: 0.3,
      cutDimensionsLabel: '18.0 × 12.0 cm (Esp. 12 mm)',
      materialLabel: 'Platina de Acero Estructural',
    });
  }

  // 2. Steps / Treads (Peldaños / Huellas) & Optional Risers (Contrahuellas)
  const riserThickM = 0.018;
  for (let i = 0; i < stepsCount; i++) {
    const stepTopY = (i + 1) * stepRiseM;
    const stepCenterZ = runM / 2 - (i + 0.5) * stepRunM;

    parts.push({
      id: `tread-${i + 1}`,
      name: 'Peldaño / Huella Horizontal',
      partCode: 'PEL-01',
      layer: 'cover',
      shape: 'box',
      sizeM: [clearTreadWidthM, treadThickM, treadDepthM],
      positionM: [0, stepTopY - treadThickM / 2, stepCenterZ + nosingM / 2],
      rotationRad: [0, 0, 0],
      colorHex: mat.primaryHex,
      opacity: 1,
      metalness: mat.metalness,
      roughness: mat.roughness,
      cutDimensionsLabel: `${(clearTreadWidthM * 100).toFixed(1)} × ${(treadDepthM * 100).toFixed(1)} cm (Esp. ${treadThicknessMm} mm)`,
      materialLabel: mat.label,
    });

    if (includeRisers) {
      const riserHeightM = Math.max(0.05, stepRiseM - treadThickM);
      const riserFrontZ = runM / 2 - i * stepRunM;
      parts.push({
        id: `riser-${i + 1}`,
        name: 'Contrahuella Vertical de Cierre',
        partCode: 'CON-01',
        layer: 'secondary',
        shape: 'box',
        sizeM: [clearTreadWidthM, riserHeightM, riserThickM],
        positionM: [
          0,
          stepTopY - treadThickM - riserHeightM / 2,
          riserFrontZ - riserThickM / 2,
        ],
        rotationRad: [0, 0, 0],
        colorHex: mat.secondaryHex,
        opacity: 1,
        metalness: mat.metalness,
        roughness: mat.roughness,
        cutDimensionsLabel: `${(clearTreadWidthM * 100).toFixed(1)} × ${(riserHeightM * 100).toFixed(1)} cm (Esp. 18 mm)`,
        materialLabel: mat.label,
      });
    }
  }

  // 3. Optional Safety Handrail & Balusters (Baranda y Pasamanos Lateral)
  const handrailHeightM = 0.92;
  if (includeHandrail) {
    const railX = -wM / 2 + stringerThickM / 2;
    const postProfileM = 0.04;

    // Vertical Baluster Posts along the stair climb
    const postStepIndices = Array.from(
      new Set([
        0,
        Math.floor((stepsCount - 1) * 0.33),
        Math.floor((stepsCount - 1) * 0.66),
        stepsCount - 1,
      ])
    );

    for (const idx of postStepIndices) {
      const stepTopY = (idx + 1) * stepRiseM;
      const postZ = runM / 2 - (idx + 0.5) * stepRunM;
      parts.push({
        id: `handrail-post-${idx + 1}`,
        name: 'Paral Vertical de Baranda',
        partCode: 'BAR-01',
        layer: 'secondary',
        shape: 'box',
        sizeM: [postProfileM, handrailHeightM, postProfileM],
        positionM: [railX, stepTopY + handrailHeightM / 2, postZ],
        rotationRad: [0, 0, 0],
        colorHex: mat.structureHex,
        opacity: 1,
        metalness: 0.6,
        roughness: 0.35,
        cutDimensionsLabel: `${(handrailHeightM * 100).toFixed(0)} × 4.0 × 4.0 cm`,
        materialLabel: 'Perfil Tubular Baranda',
      });
    }

    // Top Continuous Slanted Handrail (Pasamanos Superior)
    parts.push({
      id: 'handrail-top',
      name: 'Pasamanos Superior Continuo',
      partCode: 'PAS-01',
      layer: 'front',
      shape: 'box',
      sizeM: [0.05, 0.045, stringerLengthM],
      positionM: [railX, riseM / 2 + handrailHeightM + stepRiseM * 0.4, 0],
      rotationRad: [pitchRad, 0, 0],
      colorHex: mat.accentHex,
      opacity: 1,
      metalness: 0.4,
      roughness: 0.35,
      cutDimensionsLabel: `${(stringerLengthM * 100).toFixed(1)} × 5.0 × 4.5 cm`,
      materialLabel: mat.label,
    });

    // Mid Safety Guardrail (Larguero Intermedio de Seguridad)
    parts.push({
      id: 'handrail-mid',
      name: 'Larguero Intermedio de Baranda',
      partCode: 'BAR-02',
      layer: 'secondary',
      shape: 'box',
      sizeM: [0.025, 0.025, stringerLengthM],
      positionM: [railX, riseM / 2 + handrailHeightM * 0.52 + stepRiseM * 0.4, 0],
      rotationRad: [pitchRad, 0, 0],
      colorHex: mat.secondaryHex,
      opacity: 1,
      metalness: 0.6,
      roughness: 0.35,
      cutDimensionsLabel: `${(stringerLengthM * 100).toFixed(1)} × 2.5 × 2.5 cm`,
      materialLabel: 'Perfil Tubular Intermedio',
    });
  }

  // Ergonomic Blondel Law calculation: 2 * Rise + 1 * Run (ideal: 60 - 64 cm)
  const blondelValue = 2 * stepRiseCm + stepRunCm;

  const dimensions: DimensionLine3D[] = [
    {
      id: 'dim-width',
      label: 'Ancho Escalera',
      valueFormatted: `${widthCm.toFixed(0)} cm`,
      startM: [-wM / 2, 0.02, runM / 2 + 0.22],
      endM: [wM / 2, 0.02, runM / 2 + 0.22],
      colorHex: '#38bdf8',
      axis: 'x',
    },
    {
      id: 'dim-run',
      label: 'Desarrollo (Huella Total)',
      valueFormatted: `${totalRunCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.22, 0.02, -runM / 2],
      endM: [wM / 2 + 0.22, 0.02, runM / 2],
      colorHex: '#34d399',
      axis: 'z',
    },
    {
      id: 'dim-rise',
      label: 'Altura Piso a Piso',
      valueFormatted: `${totalRiseCm.toFixed(0)} cm`,
      startM: [wM / 2 + 0.22, 0, -runM / 2],
      endM: [wM / 2 + 0.22, riseM, -runM / 2],
      colorHex: '#fbbf24',
      axis: 'y',
    },
    {
      id: 'dim-stringer',
      label: `Zanca (${pitchDeg.toFixed(1)}°)`,
      valueFormatted: `${(stringerLengthM * 100).toFixed(0)} cm`,
      startM: [-wM / 2 - 0.18, 0, runM / 2],
      endM: [-wM / 2 - 0.18, riseM, -runM / 2],
      colorHex: '#f472b6',
      axis: 'slope',
    },
  ];

  return {
    title: 'Plano Estructural: Escalera Recta con Zancas',
    subtitle: `${stepsCount} Peldaños | Altura ${totalRiseCm} cm × Desarrollo ${totalRunCm} cm | Ancho ${widthCm} cm | Pendiente ${pitchDeg.toFixed(1)}°`,
    category: 'stairs',
    unitSystem: 'cm',
    boundingBoxM: {
      widthX: wM,
      heightY: riseM + (includeHandrail ? handrailHeightM : 0.2),
      depthZ: runM,
    },
    parts,
    dimensions,
    cutList: buildCutListFromParts(parts),
    technicalNotes: [
      `Contrahuella exacta por paso (H / ${stepsCount}): ${stepRiseCm.toFixed(2)} cm (norma recomendada: 16.5 a 19.0 cm)`,
      `Huella útil de pisada (L / ${stepsCount} + 2.5 cm nariz): ${(treadDepthM * 100).toFixed(1)} cm (paso neto: ${stepRunCm.toFixed(1)} cm)`,
      `Fórmula ergonómica de Blondel (2×Contrahuella + 1×Huella): ${blondelValue.toFixed(1)} cm (óptimo arquitectónico: 60 a 64 cm)`,
      `Longitud de corte de zanca inclinada: ${(stringerLengthM * 100).toFixed(1)} cm con ángulo de inclinación de ${pitchDeg.toFixed(1)}°`,
    ],
  };
}
