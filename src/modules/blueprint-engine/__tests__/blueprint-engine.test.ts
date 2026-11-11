import { describe, expect, it } from 'vitest';
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
  generateBlueprint,
} from '../index';
import { parseRequirementIntent } from '../intent-parser';

describe('Blueprint Engine & Natural Language Intent Parser', () => {
  it('parses roof prompt ("voy a hacer un techo") and extracts dimensions in meters', () => {
    const res = parseRequirementIntent(
      'voy a hacer un techo a dos aguas de 8x6 metros con 3m de alto'
    );
    expect(res.category).toBe('roof');
    if (res.params.category === 'roof') {
      expect(res.params.roofSubtype).toBe('gable');
      expect(res.params.widthM).toBe(8);
      expect(res.params.lengthM).toBe(6);
      expect(res.params.columnHeightM).toBe(3);
    }
  });

  it('parses closet, kitchen, table, door, and frame prompts accurately', () => {
    const closetRes = parseRequirementIntent(
      'quiero hacer un closet de 200x220x60 cm de 4 cuerpos'
    );
    expect(closetRes.category).toBe('closet');
    if (closetRes.params.category === 'closet') {
      expect(closetRes.params.widthCm).toBe(200);
      expect(closetRes.params.heightCm).toBe(220);
      expect(closetRes.params.depthCm).toBe(60);
      expect(closetRes.params.columnsCount).toBe(4);
    }

    const kitchenRes = parseRequirementIntent(
      'voy a hacer un mueble de cocina de 180x90x60 cm con 4 cajones'
    );
    expect(kitchenRes.category).toBe('kitchen_cabinet');
    if (kitchenRes.params.category === 'kitchen_cabinet') {
      expect(kitchenRes.params.widthCm).toBe(180);
      expect(kitchenRes.params.drawersCount).toBe(4);
    }

    const doorRes = parseRequirementIntent(
      'necesito una puerta con visor de 95x215 cm'
    );
    expect(doorRes.category).toBe('door');
    if (doorRes.params.category === 'door') {
      expect(doorRes.params.openingWidthCm).toBe(95);
      expect(doorRes.params.openingHeightCm).toBe(215);
      expect(doorRes.params.doorStyle).toBe('glass_vision');
    }
  });

  it('parses new categories: stairs, bed, bookshelf, and sliding_gate accurately', () => {
    const stairsRes = parseRequirementIntent(
      'voy a hacer una escalera de 110x280x340 cm con 16 peldaños'
    );
    expect(stairsRes.category).toBe('stairs');
    if (stairsRes.params.category === 'stairs') {
      expect(stairsRes.params.widthCm).toBe(110);
      expect(stairsRes.params.totalRiseCm).toBe(280);
      expect(stairsRes.params.totalRunCm).toBe(340);
      expect(stairsRes.params.stepsCount).toBe(16);
    }

    const bedRes = parseRequirementIntent(
      'quiero hacer una cama queen con 4 cajones'
    );
    expect(bedRes.category).toBe('bed');
    if (bedRes.params.category === 'bed') {
      expect(bedRes.params.widthCm).toBe(160);
      expect(bedRes.params.lengthCm).toBe(200);
      expect(bedRes.params.underDrawersCount).toBe(4);
    }

    const bookshelfRes = parseRequirementIntent(
      'necesito una estantería librero de 150x200x35 cm de 3 columnas y 6 niveles'
    );
    expect(bookshelfRes.category).toBe('bookshelf');
    if (bookshelfRes.params.category === 'bookshelf') {
      expect(bookshelfRes.params.widthCm).toBe(150);
      expect(bookshelfRes.params.verticalColumns).toBe(3);
      expect(bookshelfRes.params.shelvesCount).toBe(6);
    }

    const gateRes = parseRequirementIntent(
      'voy a hacer un portón corredizo de 350x220 cm con louvers horizontales'
    );
    expect(gateRes.category).toBe('sliding_gate');
    if (gateRes.params.category === 'sliding_gate') {
      expect(gateRes.params.widthCm).toBe(350);
      expect(gateRes.params.heightCm).toBe(220);
      expect(gateRes.params.gateStyle).toBe('horizontal_louvers');
    }
  });

  it('generates valid 3D parts, dimensions, and cutlists for all 10 structure categories', () => {
    const allDefaults = [
      DEFAULT_ROOF_PARAMS,
      DEFAULT_TABLE_PARAMS,
      DEFAULT_KITCHEN_PARAMS,
      DEFAULT_CLOSET_PARAMS,
      DEFAULT_DOOR_PARAMS,
      DEFAULT_FRAME_PARAMS,
      DEFAULT_STAIRS_PARAMS,
      DEFAULT_BED_PARAMS,
      DEFAULT_BOOKSHELF_PARAMS,
      DEFAULT_SLIDING_GATE_PARAMS,
    ];

    for (const paramSet of allDefaults) {
      const bp = generateBlueprint(paramSet);
      expect(bp.parts.length).toBeGreaterThan(3);
      expect(bp.dimensions.length).toBeGreaterThanOrEqual(3);
      expect(bp.cutList.length).toBeGreaterThan(0);
      expect(bp.boundingBoxM.widthX).toBeGreaterThan(0);
      expect(bp.boundingBoxM.heightY).toBeGreaterThan(0);
    }
  });
});
