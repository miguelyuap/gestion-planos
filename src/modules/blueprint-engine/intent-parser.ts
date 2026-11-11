import {
  DEFAULT_BED_PARAMS,
  DEFAULT_BOOKSHELF_PARAMS,
  DEFAULT_CLOSET_PARAMS,
  DEFAULT_DOOR_PARAMS,
  DEFAULT_FRAME_PARAMS,
  DEFAULT_KITCHEN_PARAMS,
  DEFAULT_ROOF_PARAMS,
  DEFAULT_SLIDING_GATE_PARAMS,
  DEFAULT_STAIRS_PARAMS,
  DEFAULT_TABLE_PARAMS,
} from './index';
import type { BlueprintParams, StructureCategory } from './types';

export interface ParsedIntentResult {
  category: StructureCategory;
  params: BlueprintParams;
  detectedKeywords: string[];
  interpretationSummary: string;
}

function normalizeDimensionToCm(val: number, unitHint?: string): number {
  if (unitHint === 'm' || unitHint === 'metros' || unitHint === 'metro') {
    return val * 100;
  }
  if (unitHint === 'mm') {
    return val / 10;
  }
  // Heuristic: if a carpentry dimension is between 0.4 and 4.5 without explicit 'cm', user likely meant meters (e.g. 1.8m x 2.1m)
  if (val >= 0.4 && val <= 4.5) {
    return Math.round(val * 100);
  }
  return val;
}

function normalizeDimensionToMeters(val: number, unitHint?: string): number {
  if (unitHint === 'cm' || unitHint === 'centimetros' || unitHint === 'centímetros') {
    return val / 100;
  }
  if (val >= 100) {
    return val / 100;
  }
  return val;
}

function extractDimensionsFromText(text: string): Array<{ value: number; unit?: string }> {
  const results: Array<{ value: number; unit?: string }> = [];

  // 1. Check compact NxM or NxMxK pattern first (e.g. "6x5", "180x90x75 cm", "2.4 x 2.2 m")
  const tupleRegex =
    /(\d+(?:[.,]\d+)?)\s*(m|cm|mm)?\s*[xX×*]\s*(\d+(?:[.,]\d+)?)\s*(m|cm|mm)?(?:\s*[xX×*]\s*(\d+(?:[.,]\d+)?)\s*(m|cm|mm)?)?/i;
  const tupleMatch = text.match(tupleRegex);

  if (tupleMatch && tupleMatch.index !== undefined) {
    const sharedUnit =
      tupleMatch[6]?.toLowerCase() ||
      tupleMatch[4]?.toLowerCase() ||
      tupleMatch[2]?.toLowerCase();
    const v1 = parseFloat(tupleMatch[1].replace(',', '.'));
    const v2 = parseFloat(tupleMatch[3].replace(',', '.'));
    results.push({ value: v1, unit: tupleMatch[2]?.toLowerCase() || sharedUnit });
    results.push({ value: v2, unit: tupleMatch[4]?.toLowerCase() || sharedUnit });
    if (tupleMatch[5]) {
      const v3 = parseFloat(tupleMatch[5].replace(',', '.'));
      results.push({ value: v3, unit: tupleMatch[6]?.toLowerCase() || sharedUnit });
    } else {
      // Check if there is an additional height/depth dimension after the 2-tuple (e.g. "de 8x6 metros con 3m de alto")
      const remainder = text.slice(tupleMatch.index + tupleMatch[0].length);
      const extraMatch = remainder.match(
        /(\d+(?:[.,]\d+)?)\s*(metros|metro|centimetros|centímetros|milimetros|milímetros|cm|mm|m)\b/i
      );
      if (extraMatch) {
        results.push({
          value: parseFloat(extraMatch[1].replace(',', '.')),
          unit: extraMatch[2].toLowerCase(),
        });
      }
    }
    return results;
  }

  // 2. Otherwise extract numbers followed by units or dimension keywords
  const numRegex =
    /(\d+(?:[.,]\d+)?)\s*(metros|metro|centimetros|centímetros|milimetros|milímetros|cm|mm|m)\b/gi;
  let match: RegExpExecArray | null = numRegex.exec(text);
  while (match !== null) {
    results.push({
      value: parseFloat(match[1].replace(',', '.')),
      unit: match[2].toLowerCase(),
    });
    match = numRegex.exec(text);
  }

  return results;
}

export function parseRequirementIntent(rawPrompt: string): ParsedIntentResult {
  const text = rawPrompt.trim().toLowerCase();
  const detectedKeywords: string[] = [];

  // 1. Detect category across all 10 parametric engines
  let category: StructureCategory = 'roof';

  if (/(escalera|escaleras|peldaños|peldanos|gradas|zanca)/i.test(text)) {
    category = 'stairs';
    detectedKeywords.push('Escalera Estructural');
  } else if (/(cama|base de cama|base cama|somier|cabecero)/i.test(text)) {
    category = 'bed';
    detectedKeywords.push('Cama / Base');
  } else if (/(estanteria|estantería|librero|biblioteca|repisero|estante|rack)/i.test(text)) {
    category = 'bookshelf';
    detectedKeywords.push('Estantería / Librero');
  } else if (/(portón|porton|reja|verja|corredizo|corrediza)/i.test(text)) {
    category = 'sliding_gate';
    detectedKeywords.push('Portón / Reja');
  } else if (/(closet|clóset|armario|ropero|vestier|guardarropa)/i.test(text)) {
    category = 'closet';
    detectedKeywords.push('Closet / Armario');
  } else if (/(cocina|alacena|gabinete|mueble bajo|meson|mesón|encimera)/i.test(text)) {
    category = 'kitchen_cabinet';
    detectedKeywords.push('Mueble de Cocina');
  } else if (/(mesa|escritorio|comedor|mesón de trabajo|isla)/i.test(text)) {
    category = 'table';
    detectedKeywords.push('Mesa / Escritorio');
  } else if (/(puerta|hoja de puerta)/i.test(text)) {
    category = 'door';
    detectedKeywords.push('Puerta con Marco');
  } else if (/(marco|bastidor|ventana|cerramiento|estructura rectangular)/i.test(text)) {
    category = 'frame';
    detectedKeywords.push('Marco / Bastidor');
  } else if (/(techo|cubierta|tejado|pergola|pérgola|galpón|galpon|ramada|marquesina)/i.test(text)) {
    category = 'roof';
    detectedKeywords.push('Techo / Cubierta');
  }

  const dims = extractDimensionsFromText(text);

  if (category === 'roof') {
    const params = { ...DEFAULT_ROOF_PARAMS };

    if (/(un agua|1 agua|una caída|una caida|inclinado simple)/i.test(text)) {
      params.roofSubtype = 'shed';
      detectedKeywords.push('A un agua');
    } else if (/(pergola|pérgola|plano)/i.test(text)) {
      params.roofSubtype = 'pergola';
      params.pitchDegrees = 0;
      detectedKeywords.push('Pérgola');
    } else if (/(dos aguas|2 aguas|doble caída)/i.test(text)) {
      params.roofSubtype = 'gable';
      detectedKeywords.push('A dos aguas');
    }

    if (dims.length >= 2) {
      const w = normalizeDimensionToMeters(dims[0].value, dims[0].unit);
      const l = normalizeDimensionToMeters(dims[1].value, dims[1].unit);
      params.widthM = Math.min(30, Math.max(1.5, w));
      params.lengthM = Math.min(40, Math.max(1.5, l));
    }
    if (dims.length >= 3) {
      const h = normalizeDimensionToMeters(dims[2].value, dims[2].unit);
      params.columnHeightM = Math.min(8, Math.max(1.8, h));
    }

    if (/(policarbonato|traslucido|traslúcido|transparente)/i.test(text)) {
      params.materialFinish = 'polycarbonate';
    } else if (/(zinc|aluzinc|metalico|metálico)/i.test(text)) {
      params.materialFinish = 'metal_zinc';
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Techo (${
        params.roofSubtype === 'gable'
          ? '2 aguas'
          : params.roofSubtype === 'shed'
            ? '1 agua'
            : 'Pérgola'
      }) de ${params.widthM}m × ${params.lengthM}m con altura de ${params.columnHeightM}m.`,
    };
  }

  if (category === 'table') {
    const params = { ...DEFAULT_TABLE_PARAMS };

    if (dims.length >= 2) {
      params.widthCm = Math.min(400, Math.max(40, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
      params.depthCm = Math.min(200, Math.max(40, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (dims.length >= 3) {
      params.heightCm = Math.min(120, Math.max(35, normalizeDimensionToCm(dims[2].value, dims[2].unit)));
    }
    if (/(repisa|entrepaño|doble nivel)/i.test(text)) {
      params.includeLowerShelf = true;
    }
    if (/(industrial|hierro|acero|metal)/i.test(text)) {
      params.materialFinish = 'industrial_steel';
    } else if (/(nogal|oscura|oscuro)/i.test(text)) {
      params.materialFinish = 'walnut';
    } else if (/(blanca|blanco)/i.test(text)) {
      params.materialFinish = 'white_melamine';
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Mesa de ${params.widthCm} cm (largo) × ${params.depthCm} cm (ancho) × ${params.heightCm} cm (alto).`,
    };
  }

  if (category === 'kitchen_cabinet') {
    const params = { ...DEFAULT_KITCHEN_PARAMS };

    if (dims.length >= 1) {
      params.widthCm = Math.min(360, Math.max(40, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
    }
    if (dims.length >= 2) {
      params.heightCm = Math.min(240, Math.max(50, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (dims.length >= 3) {
      params.depthCm = Math.min(90, Math.max(30, normalizeDimensionToCm(dims[2].value, dims[2].unit)));
    }

    const drawersMatch = text.match(/(\d+)\s*(?:cajones|cajón|gavetas|gaveta)/i);
    if (drawersMatch) {
      params.drawersCount = Math.min(5, Math.max(0, parseInt(drawersMatch[1], 10)));
    }
    const doorsMatch = text.match(/(\d+)\s*(?:puertas|puerta)/i);
    if (doorsMatch) {
      params.doorsCount = Math.min(6, Math.max(1, parseInt(doorsMatch[1], 10)));
    }
    if (/(sin meson|sin mesón|alacena|aereo|aéreo)/i.test(text)) {
      params.includeCountertop = false;
      params.toeKickHeightCm = 0;
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Mueble de cocina de ${params.widthCm} × ${params.heightCm} × ${params.depthCm} cm (${params.doorsCount} puertas, ${params.drawersCount} cajones).`,
    };
  }

  if (category === 'closet') {
    const params = { ...DEFAULT_CLOSET_PARAMS };

    if (dims.length >= 2) {
      params.widthCm = Math.min(450, Math.max(80, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
      params.heightCm = Math.min(280, Math.max(150, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (dims.length >= 3) {
      params.depthCm = Math.min(90, Math.max(40, normalizeDimensionToCm(dims[2].value, dims[2].unit)));
    }

    const colsMatch = text.match(/(\d+)\s*(?:cuerpos|columnas|secciones|modulos|módulos)/i);
    if (colsMatch) {
      params.columnsCount = Math.min(4, Math.max(2, parseInt(colsMatch[1], 10)));
    }
    if (/(abierto|vestier|sin puertas)/i.test(text)) {
      params.includeDoors = false;
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Closet de ${params.widthCm} × ${params.heightCm} × ${params.depthCm} cm distribuido en ${params.columnsCount} cuerpos con maletero superior.`,
    };
  }

  if (category === 'door') {
    const params = { ...DEFAULT_DOOR_PARAMS };

    if (dims.length >= 2) {
      params.openingWidthCm = Math.min(160, Math.max(60, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
      params.openingHeightCm = Math.min(260, Math.max(180, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (/(visor|vidrio|mirilla)/i.test(text)) {
      params.doorStyle = 'glass_vision';
    } else if (/(lisa|llana)/i.test(text)) {
      params.doorStyle = 'flush';
    } else if (/(entablerada|tableros|paneles)/i.test(text)) {
      params.doorStyle = 'paneled';
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Puerta con marco para vano de ${params.openingWidthCm} × ${params.openingHeightCm} cm.`,
    };
  }

  if (category === 'stairs') {
    const params = { ...DEFAULT_STAIRS_PARAMS };

    if (dims.length >= 1) {
      params.widthCm = Math.min(200, Math.max(60, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
    }
    if (dims.length >= 2) {
      params.totalRiseCm = Math.min(450, Math.max(100, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (dims.length >= 3) {
      params.totalRunCm = Math.min(550, Math.max(120, normalizeDimensionToCm(dims[2].value, dims[2].unit)));
    }

    const stepsMatch = text.match(/(\d+)\s*(?:peldaños|peldanos|pasos|escalones|gradas)/i);
    if (stepsMatch) {
      params.stepsCount = Math.min(22, Math.max(4, parseInt(stepsMatch[1], 10)));
    }
    if (/(contrahuella|cerrada)/i.test(text)) {
      params.includeRisers = true;
    }
    if (/(sin baranda|sin pasamanos)/i.test(text)) {
      params.includeHandrail = false;
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Escalera de ${params.widthCm} cm de ancho, ${params.totalRiseCm} cm de altura y ${params.totalRunCm} cm de desarrollo (${params.stepsCount} peldaños).`,
    };
  }

  if (category === 'bed') {
    const params = { ...DEFAULT_BED_PARAMS };

    if (/(sencilla|individual|twin)/i.test(text)) {
      params.widthCm = 100;
      params.lengthCm = 190;
    } else if (/(doble|full|matrimonial)/i.test(text)) {
      params.widthCm = 140;
      params.lengthCm = 190;
    } else if (/(queen)/i.test(text)) {
      params.widthCm = 160;
      params.lengthCm = 200;
    } else if (/(king)/i.test(text)) {
      params.widthCm = 200;
      params.lengthCm = 200;
    }

    if (dims.length >= 2) {
      params.widthCm = Math.min(220, Math.max(90, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
      params.lengthCm = Math.min(230, Math.max(180, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (dims.length >= 3) {
      params.headboardHeightCm = Math.min(160, Math.max(60, normalizeDimensionToCm(dims[2].value, dims[2].unit)));
    }

    const drawersMatch = text.match(/(\d+)\s*(?:cajones|cajón|gavetas)/i);
    if (drawersMatch) {
      params.underDrawersCount = Math.min(4, Math.max(0, parseInt(drawersMatch[1], 10)));
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Cama de ${params.widthCm} × ${params.lengthCm} cm con cabecero de ${params.headboardHeightCm} cm y ${params.underDrawersCount} cajones inferiores.`,
    };
  }

  if (category === 'bookshelf') {
    const params = { ...DEFAULT_BOOKSHELF_PARAMS };

    if (dims.length >= 2) {
      params.widthCm = Math.min(360, Math.max(50, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
      params.heightCm = Math.min(260, Math.max(70, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (dims.length >= 3) {
      params.depthCm = Math.min(70, Math.max(22, normalizeDimensionToCm(dims[2].value, dims[2].unit)));
    }

    const colsMatch = text.match(/(\d+)\s*(?:columnas|cuerpos|divisiones|modulos|módulos)/i);
    if (colsMatch) {
      params.verticalColumns = Math.min(5, Math.max(1, parseInt(colsMatch[1], 10)));
    }
    const shelvesMatch = text.match(/(\d+)\s*(?:niveles|repisas|entrepaños|estantes)/i);
    if (shelvesMatch) {
      params.shelvesCount = Math.min(9, Math.max(2, parseInt(shelvesMatch[1], 10)));
    }
    if (/(puertas|puerta)/i.test(text)) {
      params.includeBottomDoors = true;
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Estantería / Librero de ${params.widthCm} × ${params.heightCm} × ${params.depthCm} cm (${params.verticalColumns} columnas × ${params.shelvesCount} niveles).`,
    };
  }

  if (category === 'sliding_gate') {
    const params = { ...DEFAULT_SLIDING_GATE_PARAMS };

    if (dims.length >= 2) {
      params.widthCm = Math.min(600, Math.max(150, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
      params.heightCm = Math.min(300, Math.max(120, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
    }
    if (/(horizontal|horizontales|louver|entablonado)/i.test(text)) {
      params.gateStyle = 'horizontal_louvers';
    } else if (/(barrote|barrotes|vertical|verticales)/i.test(text)) {
      params.gateStyle = 'vertical_pickets';
    }

    return {
      category,
      params,
      detectedKeywords,
      interpretationSummary: `Portón Corredizo / Reja de ${params.widthCm} × ${params.heightCm} cm (${params.gateStyle === 'vertical_pickets' ? 'Barrotes verticales' : 'Louvers horizontales'}).`,
    };
  }

  // category === 'frame'
  const params = { ...DEFAULT_FRAME_PARAMS };
  if (dims.length >= 2) {
    params.widthCm = Math.min(400, Math.max(30, normalizeDimensionToCm(dims[0].value, dims[0].unit)));
    params.heightCm = Math.min(300, Math.max(30, normalizeDimensionToCm(dims[1].value, dims[1].unit)));
  }
  const vertMatch = text.match(/(\d+)\s*(?:divisiones|parales|verticales)/i);
  if (vertMatch) {
    params.verticalDivisions = Math.min(8, Math.max(0, parseInt(vertMatch[1], 10)));
  }

  return {
    category,
    params,
    detectedKeywords,
    interpretationSummary: `Marco / Bastidor de ${params.widthCm} × ${params.heightCm} cm.`,
  };
}
