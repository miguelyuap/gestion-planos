'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  Box,
  Compass,
  DoorOpen,
  Eye,
  FileSpreadsheet,
  Grid,
  Home,
  Layers,
  Maximize2,
  Ruler,
  Sparkles,
  Table2,
  Utensils,
} from 'lucide-react';
import {
  CATEGORY_METADATA,
  DEFAULT_PARAMS_BY_CATEGORY,
   DEFAULT_ROOF_PARAMS,
  generateBlueprint,
} from '../blueprint-engine';
import { parseRequirementIntent } from '../blueprint-engine/intent-parser';
import type {
  BlueprintParams,
  Part3D,
  StructureCategory,
} from '../blueprint-engine/types';
import {
  BlueprintCanvas,
  type CameraViewPreset,
} from '../viewer-3d/BlueprintCanvas';
import { CutListModal } from './CutListModal';
import { ParameterForm } from './ParameterForm';

const CATEGORY_ICONS: Record<StructureCategory, React.ReactNode> = {
  roof: <Home className="w-4 h-4" />,
  table: <Table2 className="w-4 h-4" />,
  kitchen_cabinet: <Utensils className="w-4 h-4" />,
  closet: <Archive className="w-4 h-4" />,
  door: <DoorOpen className="w-4 h-4" />,
  frame: <Grid className="w-4 h-4" />,
};

export function BlueprintStudio() {
  const [promptText, setPromptText] = useState<string>(
    'Voy a hacer un techo a dos aguas de 6m de ancho por 5m de fondo y 2.6m de alto'
  );
  const [params, setParams] = useState<BlueprintParams>(DEFAULT_ROOF_PARAMS);
  const [interpretationMessage, setInterpretationMessage] = useState<string>(
    'Techo (2 aguas) de 6m × 5m con altura de 2.6m.'
  );

  // 3D Viewport States
  const [cameraView, setCameraView] = useState<CameraViewPreset>('perspective');
  const [xrayMode, setXrayMode] = useState<boolean>(false);
  const [openFronts, setOpenFronts] = useState<boolean>(false);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [explosionFactor, setExplosionFactor] = useState<number>(0);
  const [selectedPart, setSelectedPart] = useState<Part3D | null>(null);
  const [cutListModalOpen, setCutListModalOpen] = useState<boolean>(false);

  const blueprint = useMemo(() => generateBlueprint(params), [params]);

  const handleGenerateFromPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;

    const parsed = parseRequirementIntent(promptText);
    setParams(parsed.params);
    setInterpretationMessage(parsed.interpretationSummary);
    setSelectedPart(null);
    setExplosionFactor(0);
  };

  const handleSelectCategory = (category: StructureCategory) => {
    const nextParams = DEFAULT_PARAMS_BY_CATEGORY[category];
    setParams(nextParams);
    setPromptText(CATEGORY_METADATA[category].examplePrompt);
    setInterpretationMessage(CATEGORY_METADATA[category].description);
    setSelectedPart(null);
    setExplosionFactor(0);
    setOpenFronts(false);
  };

  const supportsOpenableFronts =
    params.category === 'kitchen_cabinet' ||
    params.category === 'closet' ||
    params.category === 'door';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Header & Natural Language Requirement Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-3 z-20">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Brand Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 pr-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Compass className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-white">
                    GST-PLANOS 3D
                  </h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    CAD Paramétrico
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Generador de Planos 3D por Requerimiento y Medidas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCutListModalOpen(true)}
              className="
                lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-emerald-500/20 border border-emerald-500/40 text-emerald-300
                text-xs font-semibold
              "
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Despiece
            </button>
          </div>

          {/* Natural Language Input Form */}
          <form
            onSubmit={handleGenerateFromPrompt}
            className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder='Ej: "Voy a hacer un techo de 6x5m", "Quiero un closet de 200x220x60 cm", "Mesa de 180x90 cm"...'
                className="
                  w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg
                  bg-slate-950 border border-slate-700 text-slate-100
                  placeholder:text-slate-500 focus:outline-none focus:border-sky-400
                "
              />
            </div>
            <button
              type="submit"
              className="
                px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400
                text-slate-950 font-semibold text-xs sm:text-sm
                inline-flex items-center justify-center gap-1.5 transition shadow-md shadow-sky-500/10
              "
            >
              <Sparkles className="w-4 h-4" />
              Generar Plano 3D
            </button>
          </form>

          {/* Desktop Cut-list / Technical Sheet Action */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCutListModalOpen(true)}
              className="
                inline-flex items-center gap-2 px-3.5 py-2 rounded-lg
                bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40
                text-emerald-300 text-xs font-semibold transition
              "
            >
              <FileSpreadsheet className="w-4 h-4" />
              Ver Despiece / Ficha Técnica ({blueprint.parts.length} pzas)
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Sidebar + 3D CAD Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Panel */}
        <aside className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/70 flex flex-col overflow-y-auto max-h-[44vh] lg:max-h-none">
          {/* 1. Structure Category Selector */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                1. Tipo de Estructura
              </span>
              <span className="text-[11px] text-sky-400 font-medium">
                6 categorías activas
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5">
              {(Object.keys(CATEGORY_METADATA) as StructureCategory[]).map(
                (catKey) => {
                  const active = params.category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => handleSelectCategory(catKey)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition ${
                        active
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className={active ? 'text-sky-400' : 'text-slate-500'}>
                        {CATEGORY_ICONS[catKey]}
                      </span>
                      <span className="truncate">
                        {CATEGORY_METADATA[catKey].shortLabel}
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            {/* Interpretation feedback */}
            <div className="mt-3 px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <Ruler className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>{interpretationMessage}</span>
            </div>
          </div>

          {/* 2. Real-time Parametric Dimensions */}
          <div className="p-4 flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                2. Medidas y Parámetros ({blueprint.unitSystem})
              </span>
              <button
                type="button"
                onClick={() =>
                  setParams(DEFAULT_PARAMS_BY_CATEGORY[params.category])
                }
                className="text-[11px] text-slate-400 hover:text-sky-400 underline"
              >
                Restaurar base
              </button>
            </div>

            <ParameterForm params={params} onChange={setParams} />
          </div>
        </aside>

        {/* Center/Right 3D Viewport Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
          {/* Viewport Floating Top Toolbar */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Camera View Presets */}
            <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 shadow-lg">
              {(
                [
                  ['perspective', '3D Iso'],
                  ['front', 'Frontal'],
                  ['side', 'Lateral'],
                  ['top', 'Planta'],
                ] as const
              ).map(([viewKey, label]) => (
                <button
                  key={viewKey}
                  type="button"
                  onClick={() => setCameraView(viewKey)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    cameraView === viewKey
                      ? 'bg-sky-500 text-slate-950 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Interactive CAD Inspection Controls */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 shadow-lg">
              <button
                type="button"
                onClick={() => setShowDimensions((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  showDimensions
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                Cotas 3D
              </button>

              <button
                type="button"
                onClick={() => setXrayMode((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  xrayMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Rayos X / Estructura
              </button>

              {supportsOpenableFronts && (
                <button
                  type="button"
                  onClick={() => setOpenFronts((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    openFronts
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  {openFronts ? 'Cerrar Puertas/Cajones' : 'Abrir Puertas/Cajones'}
                </button>
              )}

              {/* Exploded View Slider */}
              <div className="flex items-center gap-2 px-2.5 py-0.5 border-l border-slate-800">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Explorar:
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={explosionFactor}
                  onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-sky-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                  title="Separar piezas en vista explotada 3D"
                />
              </div>
            </div>
          </div>

          {/* 3D Canvas */}
          <div className="flex-1 relative">
            <BlueprintCanvas
              blueprint={blueprint}
              cameraView={cameraView}
              xrayMode={xrayMode}
              openFronts={openFronts}
              explosionFactor={explosionFactor}
              showDimensions={showDimensions}
              selectedPartId={selectedPart?.id ?? null}
              onSelectPart={setSelectedPart}
            />

            {/* Selected 3D Part Inspector Card */}
            {selectedPart && (
              <div className="absolute bottom-4 right-4 z-10 w-72 p-3.5 rounded-xl bg-slate-900/95 backdrop-blur border border-sky-500/50 shadow-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-500/20 text-sky-300">
                    {selectedPart.partCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPart(null)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cerrar ✕
                  </button>
                </div>
                <div className="text-xs font-semibold text-white">
                  {selectedPart.name}
                </div>
                <div className="mt-1.5 text-xs font-mono text-emerald-400">
                  Corte: {selectedPart.cutDimensionsLabel}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Material: {selectedPart.materialLabel}
                </div>
              </div>
            )}

            {/* Helper hint bottom-left */}
            <div className="pointer-events-none absolute bottom-3 left-3 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Arrastra para rotar 3D • Rueda para zoom • Haz clic en cualquier
                pieza para ver su medida de corte
              </span>
            </div>
          </div>

          {/* Bottom Technical Status & Engineering Bar */}
          <footer className="border-t border-slate-800 bg-slate-900 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold text-slate-200">
                {blueprint.title}:
              </span>
              <span className="text-slate-400 truncate">
                {blueprint.subtitle}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
              <span>Piezas 3D: {blueprint.parts.length}</span>
              <span>Grupos de corte: {blueprint.cutList.length}</span>
            </div>
          </footer>
        </main>
      </div>

      {/* Cut List & Printable Technical Sheet Modal */}
      <CutListModal
        blueprint={blueprint}
        open={cutListModalOpen}
        onClose={() => setCutListModalOpen(false)}
      />
    </div>
  );
}
