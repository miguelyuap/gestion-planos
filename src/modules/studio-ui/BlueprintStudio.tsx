'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Archive,
  BedDouble,
  BookOpen,
  Box,
  Compass,
  DoorOpen,
  Eye,
  Fence,
  FileSpreadsheet,
  Grid,
  Home,
  Layers,
  LogOut,
  Maximize2,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Table2,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { signOutAction } from '../auth/actions/auth.actions';
import { buildPresetSession } from '../auth/services/auth.service';
import type { AuthenticatedSession } from '../auth/types/auth.types';
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
import { LicenseBadge } from '../licensing/components/LicenseBadge';
import { LicenseManagerModal } from '../licensing/components/LicenseManagerModal';
import { buildLicenseStatusFromRecord } from '../licensing/services/license.service';
import type { LicenseStatusResponse } from '../licensing/types/license.types';
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
  stairs: <TrendingUp className="w-4 h-4" />,
  bed: <BedDouble className="w-4 h-4" />,
  bookshelf: <BookOpen className="w-4 h-4" />,
  sliding_gate: <Fence className="w-4 h-4" />,
};

export interface BlueprintStudioProps {
  initialSession?: AuthenticatedSession;
  initialLicense?: LicenseStatusResponse;
}

export function BlueprintStudio({
  initialSession,
  initialLicense,
}: BlueprintStudioProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const defaultSession = useMemo(
    () => initialSession ?? buildPresetSession('active_pro'),
    [initialSession]
  );

  const defaultLicense = useMemo(
    () =>
      initialLicense ??
      buildLicenseStatusFromRecord({
        tenantId: defaultSession.globalTenantId,
        planCode: defaultSession.planCode,
        isTrial: defaultSession.isTrial,
        validFromIso: defaultSession.validFromIso,
        validToIso: defaultSession.validToIso,
        lastLicenseKey: defaultSession.lastLicenseKey,
        activeHistory: defaultSession.activeHistory,
      }),
    [initialLicense, defaultSession]
  );

  const [licenseState, setLicenseState] =
    useState<LicenseStatusResponse>(defaultLicense);
  const [licenseModalOpen, setLicenseModalOpen] = useState<boolean>(false);

  const [promptText, setPromptText] = useState<string>(
    'Voy a hacer un techo a dos aguas de 6m de ancho por 5m de fondo y 2.6m de alto'
  );
  const [params, setParams] = useState<BlueprintParams>(DEFAULT_ROOF_PARAMS);
  const [interpretationMessage, setInterpretationMessage] = useState<string>(
    'Techo (2 aguas) de 6m × 5m con altura de 2.6m.'
  );

  // Mobile/Tablet Responsive Panel State ('3d' | 'controls')
  const [mobilePanelOpen, setMobilePanelOpen] = useState<boolean>(false);

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
    setMobilePanelOpen(false);
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

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
      router.push('/login');
      router.refresh();
    });
  };

  const supportsOpenableFronts =
    params.category === 'kitchen_cabinet' ||
    params.category === 'closet' ||
    params.category === 'door' ||
    params.category === 'bed' ||
    params.category === 'bookshelf' ||
    params.category === 'sliding_gate';

  const isExpiringSoon =
    licenseState.can_operate && licenseState.days_remaining <= 10;

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Preventative License Expiration Alert Banner */}
      {isExpiringSoon && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 text-[11px] sm:text-xs text-amber-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong>Aviso de Suscripción:</strong> Quedan{' '}
              <strong>{licenseState.days_remaining} días</strong> de vigencia en{' '}
              {licenseState.current_plan.name}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLicenseModalOpen(true)}
            className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 hover:bg-amber-300 transition"
          >
            Renovar ahora
          </button>
        </div>
      )}

      {/* Top Header & Natural Language Requirement Bar */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur px-3 sm:px-4 py-2.5 sm:py-3 z-20 shrink-0">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center gap-2.5 sm:gap-3">
          {/* Brand Title + Mobile Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                    GST-PLANOS 3D
                  </h1>
                  <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    CAD
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate max-w-[210px]">
                  {defaultSession.tenantName}
                </p>
              </div>
            </div>

            {/* Mobile & Tablet Quick Controls */}
            <div className="flex lg:hidden items-center gap-1.5">
              <LicenseBadge
                license={licenseState}
                onClick={() => setLicenseModalOpen(true)}
              />

              <button
                type="button"
                onClick={() => setMobilePanelOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  mobilePanelOpen
                    ? 'bg-sky-500 text-slate-950 border-sky-400'
                    : 'bg-slate-800/90 border-slate-700 text-sky-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {mobilePanelOpen ? '3D' : 'Medidas'}
              </button>

              <button
                type="button"
                onClick={() => setCutListModalOpen(true)}
                className="
                  inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                  bg-emerald-500/20 border border-emerald-500/40 text-emerald-300
                  text-xs font-semibold
                "
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Natural Language Input Form */}
          <form
            onSubmit={handleGenerateFromPrompt}
            className="flex-1 flex flex-row items-center gap-1.5 sm:gap-2"
          >
            <div className="relative flex-1">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder='Ej: "Escalera de 100x270x320 cm", "Cama queen con 2 cajones", "Portón de 300x210 cm"...'
                className="
                  w-full pl-8 sm:pl-9 pr-2.5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg
                  bg-slate-950 border border-slate-700 text-slate-100
                  placeholder:text-slate-500 focus:outline-none focus:border-sky-400
                "
              />
            </div>
            <button
              type="submit"
              className="
                px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-sky-500 hover:bg-sky-400
                text-slate-950 font-semibold text-xs sm:text-sm shrink-0
                inline-flex items-center justify-center gap-1.5 transition shadow-md shadow-sky-500/10
              "
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Generar 3D</span>
            </button>
          </form>

          {/* Desktop License Badge, Cut-list Action & Logout */}
          <div className="hidden lg:flex items-center gap-2">
            <LicenseBadge
              license={licenseState}
              onClick={() => setLicenseModalOpen(true)}
            />

            <button
              type="button"
              onClick={() => setCutListModalOpen(true)}
              className="
                inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg
                bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40
                text-emerald-300 text-xs font-semibold transition
              "
            >
              <FileSpreadsheet className="w-4 h-4" />
              Despiece ({blueprint.parts.length} pzas)
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              title={`Cerrar sesión (${defaultSession.email})`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-rose-300 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Sidebar + 3D CAD Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Control Panel */}
        <aside
          className={`
            ${mobilePanelOpen ? 'flex' : 'hidden'} lg:flex
            w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800
            bg-slate-900/95 lg:bg-slate-900/70 flex-col overflow-y-auto
            max-h-[58dvh] lg:max-h-none z-20 shrink-0
          `}
        >
          {/* 1. Structure Category Selector */}
          <div className="p-3.5 sm:p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                1. Tipo de Estructura
              </span>
              <span className="text-[11px] text-sky-400 font-medium">
                10 categorías
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
                      <span
                        className={active ? 'text-sky-400' : 'text-slate-500'}
                      >
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
            <div className="mt-2.5 px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
              <Ruler className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <span>{interpretationMessage}</span>
            </div>
          </div>

          {/* 2. Real-time Parametric Dimensions */}
          <div className="p-3.5 sm:p-4 flex-1 space-y-3">
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
        <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-950 min-h-[260px]">
          {/* Viewport Floating Top Toolbar */}
          <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
            {/* Camera View Presets */}
            <div className="pointer-events-auto flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 shadow-lg max-w-full overflow-x-auto">
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
                  className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
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
            <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 p-1 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 shadow-lg max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setShowDimensions((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
                  showDimensions
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Cotas</span>
              </button>

              <button
                type="button"
                onClick={() => setXrayMode((prev) => !prev)}
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
                  xrayMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Rayos X</span>
              </button>

              {supportsOpenableFronts && (
                <button
                  type="button"
                  onClick={() => setOpenFronts((prev) => !prev)}
                  className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-medium whitespace-nowrap transition ${
                    openFronts
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>{openFronts ? 'Cerrar' : 'Abrir Puertas'}</span>
                </button>
              )}

              {/* Exploded View Slider */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 border-l border-slate-800">
                <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Explorar:
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={explosionFactor}
                  onChange={(e) =>
                    setExplosionFactor(parseFloat(e.target.value))
                  }
                  className="w-14 sm:w-20 accent-sky-500 h-1.5 bg-slate-800 rounded cursor-pointer"
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
              <div className="absolute bottom-3 right-3 left-3 sm:left-auto z-10 sm:w-72 p-3 rounded-xl bg-slate-900/95 backdrop-blur border border-sky-500/50 shadow-2xl">
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
                <div className="mt-1 text-xs font-mono text-emerald-400">
                  Corte: {selectedPart.cutDimensionsLabel}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Material: {selectedPart.materialLabel}
                </div>
              </div>
            )}

            {/* Helper hint bottom-left */}
            <div className="pointer-events-none absolute bottom-3 left-3 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
              <span>
                1 dedo / clic para rotar 3D • 2 dedos / rueda para zoom • Toca
                cualquier pieza para ver su corte
              </span>
            </div>
          </div>

          {/* Bottom Technical Status & Engineering Bar */}
          <footer className="border-t border-slate-800 bg-slate-900 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Box className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-semibold text-slate-200 truncate">
                {blueprint.title}
              </span>
              <span className="text-slate-400 truncate hidden md:inline">
                — {blueprint.subtitle}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono shrink-0">
              <span>{blueprint.parts.length} pzas</span>
              <span className="hidden sm:inline">
                {blueprint.cutList.length} cortes
              </span>
            </div>
          </footer>
        </main>
      </div>

      {/* Cut List & Printable Technical Sheet Modal */}
      <CutListModal
        blueprint={blueprint}
        open={cutListModalOpen}
        onClose={() => setCutListModalOpen(false)}
        tenantName={defaultSession.tenantName}
        nitOrTaxId={defaultSession.nitOrTaxId}
        planName={licenseState.current_plan.name}
      />

      {/* License & Subscription Manager Modal */}
      <LicenseManagerModal
        open={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        session={defaultSession}
        license={licenseState}
        onLicenseUpdated={setLicenseState}
      />
    </div>
  );
}
