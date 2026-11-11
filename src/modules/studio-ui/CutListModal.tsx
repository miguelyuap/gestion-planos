'use client';

import React from 'react';
import { Building2, FileSpreadsheet, Printer, X } from 'lucide-react';
import type { GeneratedBlueprint } from '../blueprint-engine/types';

export interface CutListModalProps {
  blueprint: GeneratedBlueprint;
  open: boolean;
  onClose: () => void;
  tenantName?: string;
  nitOrTaxId?: string;
  planName?: string;
}

export function CutListModal({
  blueprint,
  open,
  onClose,
  tenantName,
  nitOrTaxId,
  planName,
}: CutListModalProps) {
  if (!open) return null;

  const totalPieces = blueprint.cutList.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-xl bg-slate-900 border border-slate-700 text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/15 text-sky-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Ficha Técnica y Despiece de Materiales (BOM)
                </h2>
                {planName && (
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {planName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{blueprint.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold transition
              "
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Exportar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Corporate Tenant Header */}
          {tenantName && (
            <div className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-white">{tenantName}</span>
                {nitOrTaxId && (
                  <span className="text-slate-400 font-mono">
                    • NIT {nitOrTaxId}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                Documento técnico emitido con licencia oficial GST-SOFTWARE
              </span>
            </div>
          )}

          {/* Summary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {blueprint.dimensions.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-lg bg-slate-950/90 border border-slate-800"
              >
                <div className="text-[11px] text-slate-400">{d.label}</div>
                <div
                  className="text-sm font-mono font-bold mt-0.5"
                  style={{ color: d.colorHex }}
                >
                  {d.valueFormatted}
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800">
              <div className="text-[11px] text-slate-400">Total Elementos 3D</div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                {totalPieces} pzas
              </div>
            </div>
          </div>

          {/* Cut List Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Listado de Corte y Componentes Estructurales
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Elemento / Pieza</th>
                    <th className="py-2.5 px-3 text-center">Cant.</th>
                    <th className="py-2.5 px-3">Medidas de Corte Exactas</th>
                    <th className="py-2.5 px-3">Material / Especificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                  {blueprint.cutList.map((item) => (
                    <tr
                      key={`${item.partCode}-${item.name}-${item.dimensionsLabel}`}
                      className="hover:bg-slate-800/50"
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-sky-400">
                        {item.partCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-100">
                        {item.dimensionsLabel}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {item.materialLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Technical Notes */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Notas de Ingeniería y Fabricación
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              {blueprint.technicalNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
