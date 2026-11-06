import { generateClosetBlueprint } from './generators/closet.generator';
import { generateDoorBlueprint } from './generators/door.generator';
import { generateFrameBlueprint } from './generators/frame.generator';
import { generateKitchenCabinetBlueprint } from './generators/kitchen.generator';
import { generateRoofBlueprint } from './generators/roof.generator';
import { generateTableBlueprint } from './generators/table.generator';
import type {
  BlueprintParams,
  ClosetParams,
  DoorParams,
  FrameParams,
  GeneratedBlueprint,
  KitchenCabinetParams,
  RoofParams,
  StructureCategory,
  TableParams,
} from './types';

export const DEFAULT_ROOF_PARAMS: RoofParams = {
  category: 'roof',
  roofSubtype: 'gable',
  widthM: 6,
  lengthM: 5,
  columnHeightM: 2.6,
  pitchDegrees: 18,
  overhangM: 0.4,
  purlinSpacingM: 0.8,
  materialFinish: 'metal_red',
};

export const DEFAULT_TABLE_PARAMS: TableParams = {
  category: 'table',
  widthCm: 160,
  depthCm: 90,
  heightCm: 76,
  topThicknessMm: 30,
  legThicknessCm: 7,
  apronHeightCm: 9,
  includeLowerShelf: false,
  materialFinish: 'oak',
};

export const DEFAULT_KITCHEN_PARAMS: KitchenCabinetParams = {
  category: 'kitchen_cabinet',
  widthCm: 150,
  heightCm: 90,
  depthCm: 60,
  boardThicknessMm: 18,
  doorsCount: 2,
  drawersCount: 3,
  shelvesCount: 1,
  toeKickHeightCm: 10,
  includeCountertop: true,
  materialFinish: 'white_melamine',
};

export const DEFAULT_CLOSET_PARAMS: ClosetParams = {
  category: 'closet',
  widthCm: 180,
  heightCm: 220,
  depthCm: 60,
  boardThicknessMm: 18,
  columnsCount: 3,
  topLuggageHeightCm: 40,
  drawersCount: 4,
  shelvesCount: 4,
  includeDoors: true,
  materialFinish: 'oak',
};

export const DEFAULT_DOOR_PARAMS: DoorParams = {
  category: 'door',
  openingWidthCm: 90,
  openingHeightCm: 210,
  frameDepthCm: 12,
  jambThicknessMm: 35,
  leafThicknessMm: 45,
  doorStyle: 'paneled',
  casingWidthCm: 7,
  materialFinish: 'walnut',
};

export const DEFAULT_FRAME_PARAMS: FrameParams = {
  category: 'frame',
  widthCm: 180,
  heightCm: 120,
  profileWidthMm: 45,
  profileDepthMm: 45,
  verticalDivisions: 2,
  horizontalDivisions: 1,
  includeGlassOrPanel: true,
  materialFinish: 'graphite',
};

export const DEFAULT_PARAMS_BY_CATEGORY: Record<StructureCategory, BlueprintParams> = {
  roof: DEFAULT_ROOF_PARAMS,
  table: DEFAULT_TABLE_PARAMS,
  kitchen_cabinet: DEFAULT_KITCHEN_PARAMS,
  closet: DEFAULT_CLOSET_PARAMS,
  door: DEFAULT_DOOR_PARAMS,
  frame: DEFAULT_FRAME_PARAMS,
};

export const CATEGORY_METADATA: Record<
  StructureCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    examplePrompt: string;
  }
> = {
  roof: {
    label: 'Techos, Cubiertas y Pérgolas',
    shortLabel: 'Techo / Cubierta',
    description: 'Cubiertas a 1 agua, 2 aguas o pérgolas con columnas, vigas y correas.',
    examplePrompt: 'Voy a hacer un techo a dos aguas de 6m de ancho por 8m de fondo y 2.8m de alto',
  },
  table: {
    label: 'Mesas y Escritorios',
    shortLabel: 'Mesa / Escritorio',
    description: 'Mesas de comedor, trabajo o centro con tablero, patas, faldones y repisa.',
    examplePrompt: 'Quiero hacer una mesa de comedor de 180x90 cm y 76 cm de alto con repisa',
  },
  kitchen_cabinet: {
    label: 'Muebles de Cocina',
    shortLabel: 'Mueble Cocina',
    description: 'Módulos bajos o alacenas con puertas, gavetas, entrepaños, zócalo y mesón.',
    examplePrompt: 'Voy a hacer un mueble de cocina de 160 cm de ancho por 90 de alto y 60 de fondo con 3 cajones',
  },
  closet: {
    label: 'Closets y Armarios',
    shortLabel: 'Closet / Armario',
    description: 'Roperos modulares con cuerpos divisorios, maletero superior, cajonera y tubos.',
    examplePrompt: 'Necesito un closet de 200 cm de ancho por 220 cm de alto y 60 cm de fondo de 3 cuerpos',
  },
  door: {
    label: 'Puertas con Marco',
    shortLabel: 'Puerta',
    description: 'Puertas entableradas, lisas o con visor, incluyendo marco, jambas y chambranas.',
    examplePrompt: 'Voy a hacer una puerta entablerada con marco para un vano de 90x210 cm',
  },
  frame: {
    label: 'Marcos, Ventanas y Bastidores',
    shortLabel: 'Marco / Bastidor',
    description: 'Bastidores metálicos o de madera con retícula de parales y travesaños.',
    examplePrompt: 'Quiero hacer un marco metálico para ventana de 200x140 cm con 2 divisiones verticales',
  },
};

export function generateBlueprint(params: BlueprintParams): GeneratedBlueprint {
  switch (params.category) {
    case 'roof':
      return generateRoofBlueprint(params);
    case 'table':
      return generateTableBlueprint(params);
    case 'kitchen_cabinet':
      return generateKitchenCabinetBlueprint(params);
    case 'closet':
      return generateClosetBlueprint(params);
    case 'door':
      return generateDoorBlueprint(params);
    case 'frame':
      return generateFrameBlueprint(params);
  }
}
