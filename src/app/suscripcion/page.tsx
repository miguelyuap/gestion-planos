import React from 'react';
import { redirect } from 'next/navigation';
import { Compass, LogOut } from 'lucide-react';
import {
  getCurrentStudioContext,
  signOutAction,
} from '@/modules/auth/actions/auth.actions';
import { LicenseManagerPanel } from '@/modules/licensing/components/LicenseManagerModal';

export default async function SuscripcionPage() {
  const ctx = await getCurrentStudioContext();

  if (!ctx) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <Compass className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">GST-PLANOS 3D</span>
            <span className="ml-2 text-xs text-slate-400">
              • Portal de Licencias y Suscripciones
            </span>
          </div>
        </div>

        <form
          action={async () => {
            'use server';
            await signOutAction();
            redirect('/login');
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            Cambiar de Cuenta / Salir
          </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 my-auto">
        <LicenseManagerPanel
          session={ctx.session}
          license={ctx.license}
          isStandalonePage
        />
      </main>
    </div>
  );
}
