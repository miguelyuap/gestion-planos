'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Compass,
  FileText,
  Lock,
  Mail,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import { registerTenantAction } from '../actions/auth.actions';

export function RegisterForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState<string>('');
  const [nitOrTaxId, setNitOrTaxId] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await registerTenantAction({
        businessName,
        nitOrTaxId,
        fullName,
        email,
        phone,
        password,
      });

      if (!res.success) {
        setErrorMessage(
          res.error ?? 'No fue posible completar el registro de la empresa.'
        );
        return;
      }

      router.push('/');
      router.refresh();
    });
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/25 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> LICENCIA TRIAL DE 15 DÍAS INCLUIDA
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Compass className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Registrar Taller / Constructora
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Crea tu cuenta Multi-Tenant en GST-PLANOS 3D y obtén 15 días de acceso inmediato.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" /> Nombre de Empresa / Taller
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Carpintería & Diseño S.A.S."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> NIT / Identificación Fiscal
              </label>
              <input
                type="text"
                required
                value={nitOrTaxId}
                onChange={(e) => setNitOrTaxId(e.target.value)}
                placeholder="Ej: 901.234.567-8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" /> Nombre del Ingeniero / Titular
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Ing. Juan Pérez"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" /> Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3001234567"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" /> Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-sky-400" /> Contraseña (mín. 6 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isPending ? (
              <span>Creando Tenant y activando licencia Trial...</span>
            ) : (
              <>
                <span>Crear Cuenta y Activar 15 Días Gratis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 text-xs text-slate-400 border-t border-slate-800">
          ¿Ya tienes una cuenta registrada?{' '}
          <Link
            href="/login"
            className="text-sky-400 hover:text-sky-300 font-semibold hover:underline"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
