'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import type { LicenseStatusResponse } from '../types/license.types';

export interface LicenseBadgeProps {
  license: LicenseStatusResponse;
  onClick: () => void;
}

export function LicenseBadge({ license, onClick }: LicenseBadgeProps) {
  const isExpired = !license.can_operate || license.days_remaining <= 0;
  const isExpiringSoon = !isExpired && license.days_remaining <= 10;

  const badgeStyle = isExpired
    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
    : isExpiringSoon
      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
      : license.is_trial
        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25';

  return (
    <button
      type="button"
      onClick={onClick}
      title="Gestionar Suscripción y Licencia GST-SOFTWARE"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${badgeStyle}`}
    >
      {isExpired ? (
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
      ) : isExpiringSoon ? (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      ) : license.is_trial ? (
        <KeyRound className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      )}
      <span className="hidden sm:inline">
        {isExpired
          ? 'Licencia Vencida'
          : license.is_trial
            ? 'Trial'
            : 'Licencia Activa'}
      </span>
      <span className="font-mono px-1.5 py-0.2 rounded bg-slate-950/60 text-[11px]">
        {license.days_remaining}d
      </span>
    </button>
  );
}
