import { z } from 'zod';

export const StructureCategorySchema = z.enum([
  'roof',
  'table',
  'kitchen_cabinet',
  'closet',
  'door',
  'frame',
]);

export type StructureCategory = z.infer<typeof StructureCategorySchema>;

export const MaterialFinishSchema = z.enum([
  'oak',
  'walnut',
  'white_melamine',
  'graphite',
  'industrial_steel',
  'metal_red',
  'metal_zinc',
  'polycarbonate',
]);

export type MaterialFinish = z.infer<typeof MaterialFinishSchema>;

export const RoofParamsSchema = z.object({
  category: z.literal('roof'),
  roofSubtype: z.enum(['gable', 'shed', 'pergola']),
  widthM: z.number().min(1.5).max(30),
  lengthM: z.number().min(1.5).max(40),
  columnHeightM: z.number().min(1.8).max(8),
  pitchDegrees: z.number().min(0).max(45),
  overhangM: z.number().min(0).max(1.2),
  purlinSpacingM: z.number().min(0.4).max(1.5),
  materialFinish: MaterialFinishSchema,
});

export const TableParamsSchema = z.object({
  category: z.literal('table'),
  widthCm: z.number().min(40).max(400),
  depthCm: z.number().min(40).max(200),
  heightCm: z.number().min(35).max(120),
  topThicknessMm: z.number().min(15).max(80),
  legThicknessCm: z.number().min(3).max(20),
  apronHeightCm: z.number().min(4).max(25),
  includeLowerShelf: z.boolean(),
  materialFinish: MaterialFinishSchema,
});

export const KitchenCabinetParamsSchema = z.object({
  category: z.literal('kitchen_cabinet'),
  widthCm: z.number().min(40).max(360),
  heightCm: z.number().min(50).max(240),
  depthCm: z.number().min(30).max(90),
  boardThicknessMm: z.number().min(12).max(25),
  doorsCount: z.number().int().min(1).max(6),
  drawersCount: z.number().int().min(0).max(5),
  shelvesCount: z.number().int().min(0).max(5),
  toeKickHeightCm: z.number().min(0).max(20),
  includeCountertop: z.boolean(),
  materialFinish: MaterialFinishSchema,
});

export const ClosetParamsSchema = z.object({
  category: z.literal('closet'),
  widthCm: z.number().min(80).max(450),
  heightCm: z.number().min(150).max(280),
  depthCm: z.number().min(40).max(90),
  boardThicknessMm: z.number().min(15).max(25),
  columnsCount: z.number().int().min(2).max(4),
  topLuggageHeightCm: z.number().min(25).max(65),
  drawersCount: z.number().int().min(0).max(6),
  shelvesCount: z.number().int().min(2).max(7),
  includeDoors: z.boolean(),
  materialFinish: MaterialFinishSchema,
});

export const DoorParamsSchema = z.object({
  category: z.literal('door'),
  openingWidthCm: z.number().min(60).max(160),
  openingHeightCm: z.number().min(180).max(260),
  frameDepthCm: z.number().min(7).max(30),
  jambThicknessMm: z.number().min(20).max(60),
  leafThicknessMm: z.number().min(30).max(60),
  doorStyle: z.enum(['paneled', 'flush', 'glass_vision']),
  casingWidthCm: z.number().min(4).max(12),
  materialFinish: MaterialFinishSchema,
});

export const FrameParamsSchema = z.object({
  category: z.literal('frame'),
  widthCm: z.number().min(30).max(400),
  heightCm: z.number().min(30).max(300),
  profileWidthMm: z.number().min(20).max(120),
  profileDepthMm: z.number().min(20).max(150),
  verticalDivisions: z.number().int().min(0).max(8),
  horizontalDivisions: z.number().int().min(0).max(8),
  includeGlassOrPanel: z.boolean(),
  materialFinish: MaterialFinishSchema,
});

export const BlueprintParamsSchema = z.discriminatedUnion('category', [
  RoofParamsSchema,
  TableParamsSchema,
  KitchenCabinetParamsSchema,
  ClosetParamsSchema,
  DoorParamsSchema,
  FrameParamsSchema,
]);

export type RoofParams = z.infer<typeof RoofParamsSchema>;
export type TableParams = z.infer<typeof TableParamsSchema>;
export type KitchenCabinetParams = z.infer<typeof KitchenCabinetParamsSchema>;
export type ClosetParams = z.infer<typeof ClosetParamsSchema>;
export type DoorParams = z.infer<typeof DoorParamsSchema>;
export type FrameParams = z.infer<typeof FrameParamsSchema>;
export type BlueprintParams = z.infer<typeof BlueprintParamsSchema>;

export type PartLayer =
  | 'structure'
  | 'secondary'
  | 'cover'
  | 'front'
  | 'interior'
  | 'hardware';

export interface Part3D {
  id: string;
  name: string;
  partCode: string;
  layer: PartLayer;
  shape: 'box' | 'cylinder';
  /** Dimensions in 3D scene units (meters): [widthX, heightY, depthZ] */
  sizeM: [number, number, number];
  /** Center position in 3D scene units (meters): [x, y, z] */
  positionM: [number, number, number];
  /** Euler rotation in radians: [rx, ry, rz] */
  rotationRad: [number, number, number];
  /** Hex color for 3D rendering */
  colorHex: string;
  /** Opacity (1 = opaque, <1 = glass/translucent) */
  opacity: number;
  /** Metalness & roughness for realistic CAD look */
  metalness: number;
  roughness: number;
  /** Human-readable cut dimensions (e.g. "210.0 x 60.0 x 1.8 cm") */
  cutDimensionsLabel: string;
  /** Quantity represented or group tag */
  materialLabel: string;
  /** Optional hinge/slide offset when user activates "Open Doors/Drawers" */
  openTransform?: {
    translateM?: [number, number, number];
    rotateYRad?: number;
    pivotM?: [number, number, number];
  };
}

export interface DimensionLine3D {
  id: string;
  label: string;
  valueFormatted: string;
  startM: [number, number, number];
  endM: [number, number, number];
  colorHex: string;
  axis: 'x' | 'y' | 'z' | 'slope';
}

export interface CutListItem {
  partCode: string;
  name: string;
  quantity: number;
  dimensionsLabel: string;
  materialLabel: string;
  layer: PartLayer;
}

export interface GeneratedBlueprint {
  title: string;
  subtitle: string;
  category: StructureCategory;
  unitSystem: 'm' | 'cm';
  boundingBoxM: {
    widthX: number;
    heightY: number;
    depthZ: number;
  };
  parts: Part3D[];
  dimensions: DimensionLine3D[];
  cutList: CutListItem[];
  technicalNotes: string[];
}
