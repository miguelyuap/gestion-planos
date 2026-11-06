'use client';

import React from 'react';
import { MATERIAL_PALETTE } from '../blueprint-engine/materials';
import type { BlueprintParams, MaterialFinish } from '../blueprint-engine/types';

export interface ParameterFormProps {
  params: BlueprintParams;
  onChange: (next: BlueprintParams) => void;
}

interface NumberFieldProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-slate-300">{label}</label>
        <span className="font-mono text-sky-400 font-semibold">
          {value} {unit}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value);
            if (!Number.isNaN(parsed)) {
              onChange(Math.min(max, Math.max(min, parsed)));
            }
          }}
          className="
            w-20 px-2 py-1 text-right text-xs font-mono
            bg-slate-900 border border-slate-700 rounded-md text-slate-100
            focus:outline-none focus:border-sky-500
          "
        />
      </div>
    </div>
  );
}

export function ParameterForm({ params, onChange }: ParameterFormProps) {
  const materialKeys = Object.keys(MATERIAL_PALETTE) as MaterialFinish[];

  return (
    <div className="space-y-4">
      {/* Category-specific fields */}
      {params.category === 'roof' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Diseño de Cubierta / Techo
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['gable', '2 Aguas'],
                  ['shed', '1 Agua'],
                  ['pergola', 'Pérgola'],
                ] as const
              ).map(([subtype, label]) => (
                <button
                  key={subtype}
                  type="button"
                  onClick={() => onChange({ ...params, roofSubtype: subtype })}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition ${
                    params.roofSubtype === subtype
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="Ancho Frontal (Luz entre columnas)"
            unit="m"
            value={params.widthM}
            min={2}
            max={25}
            step={0.2}
            onChange={(widthM) => onChange({ ...params, widthM })}
          />
          <NumberField
            label="Largo / Fondo"
            unit="m"
            value={params.lengthM}
            min={2}
            max={35}
            step={0.2}
            onChange={(lengthM) => onChange({ ...params, lengthM })}
          />
          <NumberField
            label="Altura Libre de Columnas"
            unit="m"
            value={params.columnHeightM}
            min={2}
            max={6.5}
            step={0.1}
            onChange={(columnHeightM) => onChange({ ...params, columnHeightM })}
          />
          {params.roofSubtype !== 'pergola' && (
            <NumberField
              label="Pendiente / Inclinación"
              unit="°"
              value={params.pitchDegrees}
              min={5}
              max={42}
              step={1}
              onChange={(pitchDegrees) => onChange({ ...params, pitchDegrees })}
            />
          )}
          <NumberField
            label="Alero / Voladizo Perimetral"
            unit="m"
            value={params.overhangM}
            min={0}
            max={1}
            step={0.05}
            onChange={(overhangM) => onChange({ ...params, overhangM })}
          />
          <NumberField
            label="Separación entre Correas"
            unit="m"
            value={params.purlinSpacingM}
            min={0.4}
            max={1.4}
            step={0.05}
            onChange={(purlinSpacingM) => onChange({ ...params, purlinSpacingM })}
          />
        </>
      )}

      {params.category === 'table' && (
        <>
          <NumberField
            label="Largo Frontal (Tablero)"
            unit="cm"
            value={params.widthCm}
            min={60}
            max={320}
            step={5}
            onChange={(widthCm) => onChange({ ...params, widthCm })}
          />
          <NumberField
            label="Ancho / Fondo"
            unit="cm"
            value={params.depthCm}
            min={45}
            max={160}
            step={5}
            onChange={(depthCm) => onChange({ ...params, depthCm })}
          />
          <NumberField
            label="Altura Total de Mesa"
            unit="cm"
            value={params.heightCm}
            min={40}
            max={110}
            step={1}
            onChange={(heightCm) => onChange({ ...params, heightCm })}
          />
          <NumberField
            label="Espesor del Tablero"
            unit="mm"
            value={params.topThicknessMm}
            min={15}
            max={60}
            step={1}
            onChange={(topThicknessMm) => onChange({ ...params, topThicknessMm })}
          />
          <NumberField
            label="Grosor de Patas"
            unit="cm"
            value={params.legThicknessCm}
            min={4}
            max={15}
            step={0.5}
            onChange={(legThicknessCm) => onChange({ ...params, legThicknessCm })}
          />
          <NumberField
            label="Altura de Faldón Perimetral"
            unit="cm"
            value={params.apronHeightCm}
            min={4}
            max={18}
            step={1}
            onChange={(apronHeightCm) => onChange({ ...params, apronHeightCm })}
          />
          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-xs font-medium text-slate-300">
              Incluir Repisa Inferior
            </span>
            <input
              type="checkbox"
              checked={params.includeLowerShelf}
              onChange={(e) =>
                onChange({ ...params, includeLowerShelf: e.target.checked })
              }
              className="w-4 h-4 accent-sky-500 rounded"
            />
          </label>
        </>
      )}

      {params.category === 'kitchen_cabinet' && (
        <>
          <NumberField
            label="Ancho Total del Mueble"
            unit="cm"
            value={params.widthCm}
            min={50}
            max={300}
            step={5}
            onChange={(widthCm) => onChange({ ...params, widthCm })}
          />
          <NumberField
            label="Altura Total"
            unit="cm"
            value={params.heightCm}
            min={55}
            max={220}
            step={2}
            onChange={(heightCm) => onChange({ ...params, heightCm })}
          />
          <NumberField
            label="Profundidad / Fondo"
            unit="cm"
            value={params.depthCm}
            min={32}
            max={75}
            step={2}
            onChange={(depthCm) => onChange({ ...params, depthCm })}
          />
          <NumberField
            label="Espesor de Melamina / Tablero"
            unit="mm"
            value={params.boardThicknessMm}
            min={15}
            max={25}
            step={1}
            onChange={(boardThicknessMm) =>
              onChange({ ...params, boardThicknessMm })
            }
          />
          <NumberField
            label="Cantidad de Puertas Batientes"
            unit="ud"
            value={params.doorsCount}
            min={1}
            max={5}
            step={1}
            onChange={(doorsCount) =>
              onChange({ ...params, doorsCount: Math.round(doorsCount) })
            }
          />
          <NumberField
            label="Cantidad de Cajones / Gavetas"
            unit="ud"
            value={params.drawersCount}
            min={0}
            max={5}
            step={1}
            onChange={(drawersCount) =>
              onChange({ ...params, drawersCount: Math.round(drawersCount) })
            }
          />
          <NumberField
            label="Entrepaños Internos"
            unit="ud"
            value={params.shelvesCount}
            min={0}
            max={4}
            step={1}
            onChange={(shelvesCount) =>
              onChange({ ...params, shelvesCount: Math.round(shelvesCount) })
            }
          />
          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-xs font-medium text-slate-300">
              Incluir Mesón Superior y Salpicadero
            </span>
            <input
              type="checkbox"
              checked={params.includeCountertop}
              onChange={(e) =>
                onChange({ ...params, includeCountertop: e.target.checked })
              }
              className="w-4 h-4 accent-sky-500 rounded"
            />
          </label>
        </>
      )}

      {params.category === 'closet' && (
        <>
          <NumberField
            label="Ancho Total del Closet"
            unit="cm"
            value={params.widthCm}
            min={90}
            max={380}
            step={5}
            onChange={(widthCm) => onChange({ ...params, widthCm })}
          />
          <NumberField
            label="Altura Total (Piso a Techo)"
            unit="cm"
            value={params.heightCm}
            min={170}
            max={260}
            step={5}
            onChange={(heightCm) => onChange({ ...params, heightCm })}
          />
          <NumberField
            label="Profundidad / Fondo"
            unit="cm"
            value={params.depthCm}
            min={45}
            max={75}
            step={2}
            onChange={(depthCm) => onChange({ ...params, depthCm })}
          />
          <NumberField
            label="Número de Cuerpos Verticales"
            unit="cuerpos"
            value={params.columnsCount}
            min={2}
            max={4}
            step={1}
            onChange={(columnsCount) =>
              onChange({ ...params, columnsCount: Math.round(columnsCount) })
            }
          />
          <NumberField
            label="Altura de Maletero Superior"
            unit="cm"
            value={params.topLuggageHeightCm}
            min={28}
            max={55}
            step={2}
            onChange={(topLuggageHeightCm) =>
              onChange({ ...params, topLuggageHeightCm })
            }
          />
          <NumberField
            label="Cajones en Torre Central"
            unit="ud"
            value={params.drawersCount}
            min={0}
            max={5}
            step={1}
            onChange={(drawersCount) =>
              onChange({ ...params, drawersCount: Math.round(drawersCount) })
            }
          />
          <NumberField
            label="Entrepaños en Torre Central"
            unit="ud"
            value={params.shelvesCount}
            min={2}
            max={6}
            step={1}
            onChange={(shelvesCount) =>
              onChange({ ...params, shelvesCount: Math.round(shelvesCount) })
            }
          />
          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-xs font-medium text-slate-300">
              Incluir Puertas Exteriores
            </span>
            <input
              type="checkbox"
              checked={params.includeDoors}
              onChange={(e) =>
                onChange({ ...params, includeDoors: e.target.checked })
              }
              className="w-4 h-4 accent-sky-500 rounded"
            />
          </label>
        </>
      )}

      {params.category === 'door' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Estilo de Hoja
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  ['paneled', 'Tableros'],
                  ['flush', 'Lisa'],
                  ['glass_vision', 'Con Visor'],
                ] as const
              ).map(([style, label]) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => onChange({ ...params, doorStyle: style })}
                  className={`px-2 py-1.5 rounded-md text-xs font-medium border transition ${
                    params.doorStyle === style
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="Ancho Total del Vano"
            unit="cm"
            value={params.openingWidthCm}
            min={65}
            max={140}
            step={2}
            onChange={(openingWidthCm) => onChange({ ...params, openingWidthCm })}
          />
          <NumberField
            label="Alto Total del Vano"
            unit="cm"
            value={params.openingHeightCm}
            min={190}
            max={250}
            step={2}
            onChange={(openingHeightCm) =>
              onChange({ ...params, openingHeightCm })
            }
          />
          <NumberField
            label="Profundidad del Marco (Muro)"
            unit="cm"
            value={params.frameDepthCm}
            min={8}
            max={25}
            step={1}
            onChange={(frameDepthCm) => onChange({ ...params, frameDepthCm })}
          />
          <NumberField
            label="Espesor de Jamba (Marco)"
            unit="mm"
            value={params.jambThicknessMm}
            min={25}
            max={50}
            step={1}
            onChange={(jambThicknessMm) =>
              onChange({ ...params, jambThicknessMm })
            }
          />
          <NumberField
            label="Espesor de Hoja de Puerta"
            unit="mm"
            value={params.leafThicknessMm}
            min={35}
            max={55}
            step={1}
            onChange={(leafThicknessMm) =>
              onChange({ ...params, leafThicknessMm })
            }
          />
          <NumberField
            label="Ancho de Tapajuntas / Chambrana"
            unit="cm"
            value={params.casingWidthCm}
            min={5}
            max={10}
            step={0.5}
            onChange={(casingWidthCm) => onChange({ ...params, casingWidthCm })}
          />
        </>
      )}

      {params.category === 'frame' && (
        <>
          <NumberField
            label="Ancho Exterior del Marco"
            unit="cm"
            value={params.widthCm}
            min={40}
            max={350}
            step={5}
            onChange={(widthCm) => onChange({ ...params, widthCm })}
          />
          <NumberField
            label="Alto Exterior del Marco"
            unit="cm"
            value={params.heightCm}
            min={40}
            max={260}
            step={5}
            onChange={(heightCm) => onChange({ ...params, heightCm })}
          />
          <NumberField
            label="Ancho Frontal del Perfil"
            unit="mm"
            value={params.profileWidthMm}
            min={25}
            max={100}
            step={5}
            onChange={(profileWidthMm) => onChange({ ...params, profileWidthMm })}
          />
          <NumberField
            label="Profundidad del Perfil"
            unit="mm"
            value={params.profileDepthMm}
            min={25}
            max={120}
            step={5}
            onChange={(profileDepthMm) => onChange({ ...params, profileDepthMm })}
          />
          <NumberField
            label="Parales Verticales Internos"
            unit="ud"
            value={params.verticalDivisions}
            min={0}
            max={6}
            step={1}
            onChange={(verticalDivisions) =>
              onChange({
                ...params,
                verticalDivisions: Math.round(verticalDivisions),
              })
            }
          />
          <NumberField
            label="Travesaños Horizontales Internos"
            unit="ud"
            value={params.horizontalDivisions}
            min={0}
            max={6}
            step={1}
            onChange={(horizontalDivisions) =>
              onChange({
                ...params,
                horizontalDivisions: Math.round(horizontalDivisions),
              })
            }
          />
          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-xs font-medium text-slate-300">
              Incluir Panel / Vidrio Interior
            </span>
            <input
              type="checkbox"
              checked={params.includeGlassOrPanel}
              onChange={(e) =>
                onChange({ ...params, includeGlassOrPanel: e.target.checked })
              }
              className="w-4 h-4 accent-sky-500 rounded"
            />
          </label>
        </>
      )}

      {/* Material selector */}
      <div className="pt-2 border-t border-slate-800 space-y-1.5">
        <label className="block text-xs font-medium text-slate-300">
          Acabado / Material Principal
        </label>
        <select
          value={params.materialFinish}
          onChange={(e) =>
            onChange({
              ...params,
              materialFinish: e.target.value as MaterialFinish,
            })
          }
          className="
            w-full px-2.5 py-2 text-xs bg-slate-900 border border-slate-700
            rounded-md text-slate-100 focus:outline-none focus:border-sky-500
          "
        >
          {materialKeys.map((key) => (
            <option key={key} value={key}>
              {MATERIAL_PALETTE[key].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
