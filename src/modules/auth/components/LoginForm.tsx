'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  loginAction,
  loginWithDemoScenarioAction,
} from '../actions/auth.actions';
import { DEMO_ACCOUNT_PRESETS } from '../services/auth.service';
import type { DemoAccountPreset } from '../types/auth.types';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('ingenieria@elroble.co');
  const [password, setPassword] = useState<string>('Password2026*');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setErrorMessage(
          result.error ?? 'No fue posible iniciar sesión. Verifica tus datos.'
        );
        return;
      }

      if (result.canOperate === false) {
        router.push('/suscripcion');
      } else {
        router.push('/');
      }
      router.refresh();
    });
  };

  const handleQuickDemo = (scenario: DemoAccountPreset['scenario']) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await loginWithDemoScenarioAction(scenario);
      if (res.canOperate === false) {
        router.push('/suscripcion');
      } else {
        router.push('/');
      }
      router.refresh();
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Ambient CAD Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/25 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-6">
        {/* Left Column: Main Login Card */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* GST Software Header */}
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> GST-SOFTWARE • ESTUDIO CAD 3D
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                <Compass className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Iniciar Sesión en GST-PLANOS
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Accede al generador paramétrico 3D y despiece técnico de materiales.
                </p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" /> Correo Electrónico Corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                placeholder="ingenieria@tutaller.co"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" /> Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isPending ? (
                <span>Verificando sesión y licencia...</span>
              ) : (
                <>
                  <span>Ingresar al Estudio 3D</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-3 text-xs text-slate-400 border-t border-slate-800">
            ¿Nuevo taller o empresa constructora?{' '}
            <Link
              href="/register"
              className="text-sky-400 hover:text-sky-300 font-semibold hover:underline"
            >
              Registrar Empresa (15 Días Gratis)
            </Link>
          </div>
        </div>

        {/* Right Column: Instant Demo Scenarios for License Testing */}
        <div className="lg:col-span-5 bg-slate-900/75 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
            <KeyRound className="w-4 h-4" /> Acceso Rápido de Prueba (Licencias)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Selecciona cualquiera de estos 3 talleres preconfigurados para probar en un clic el comportamiento del **License Service** de GST-SOFTWARE:
          </p>

          <div className="space-y-2.5">
            {DEMO_ACCOUNT_PRESETS.map((preset) => {
              const badgeColor =
                preset.scenario === 'active_pro'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : preset.scenario === 'expiring_trial'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30';

              return (
                <div
                  key={preset.id}
                  className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {preset.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border shrink-0 ${badgeColor}`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{preset.subtitle}</p>
                  <div className="flex items-center justify-between pt-1">
                    <code className="text-[11px] font-mono text-slate-400">
                      {preset.email}
                    </code>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickDemo(preset.scenario)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-sky-300 text-xs font-semibold transition"
                    >
                      Probar escenario →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            {errorMessage ? (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span>
              Integrado con el estándar{' '}
              <strong className="text-slate-200">app_gestion_planos</strong>:
              soporta renovación con pasarela Wompi y códigos acumulativos{' '}
              <code className="text-sky-300">LIC-6M-...</code>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
