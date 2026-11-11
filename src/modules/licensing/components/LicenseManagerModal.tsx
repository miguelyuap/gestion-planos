'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  History,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AuthenticatedSession,
  DemoAccountPreset,
} from '../../auth/types/auth.types';
import {
  activateLicenseKeyAction,
  initiateWompiCheckoutAction,
  simulateLicenseScenarioAction,
  verifyWompiTransactionAction,
} from '../actions/license.actions';
import {
  GST_LICENSE_PLANS,
  SAMPLE_OFFICIAL_KEYS,
} from '../services/license.service';
import type {
  LicensePlanCode,
  LicenseStatusResponse,
  WompiCheckoutSession,
} from '../types/license.types';

export interface LicenseManagerPanelProps {
  session: AuthenticatedSession;
  license: LicenseStatusResponse;
  onLicenseUpdated?: (next: LicenseStatusResponse) => void;
  onClose?: () => void;
  isStandalonePage?: boolean;
}

function formatDateEs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function LicenseManagerPanel({
  session,
  license,
  onLicenseUpdated,
  onClose,
  isStandalonePage = false,
}: LicenseManagerPanelProps) {
  const router = useRouter();
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [activeCheckout, setActiveCheckout] =
    useState<WompiCheckoutSession | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isExpired = !license.can_operate || license.days_remaining <= 0;
  const isExpiringSoon = !isExpired && license.days_remaining <= 10;

  const handleActivateKey = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedbackSuccess(null);
    setFeedbackError(null);

    startTransition(async () => {
      const res = await activateLicenseKeyAction(licenseKeyInput);
      if (!res.success || !res.license) {
        setFeedbackError(
          res.error ?? 'No se pudo activar la clave ingresada.'
        );
        return;
      }

      setFeedbackSuccess(res.message ?? 'Licencia renovada exitosamente.');
      setLicenseKeyInput('');
      if (onLicenseUpdated) {
        onLicenseUpdated(res.license);
      }
      if (isStandalonePage && res.license.can_operate) {
        router.push('/');
      }
      router.refresh();
    });
  };

  const handleStartWompiCheckout = (
    planCode: Exclude<LicensePlanCode, 'trial'>
  ) => {
    setFeedbackSuccess(null);
    setFeedbackError(null);

    startTransition(async () => {
      const res = await initiateWompiCheckoutAction(planCode);
      if (!res.success || !res.checkout) {
        setFeedbackError(
          res.error ?? 'Error al iniciar el checkout con License Service.'
        );
        return;
      }
      setActiveCheckout(res.checkout);
    });
  };

  const handleConfirmSimulatedWompiPayment = () => {
    if (!activeCheckout) return;
    setFeedbackSuccess(null);
    setFeedbackError(null);

    startTransition(async () => {
      const fakeGatewayTxId = `WMP-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      const res = await verifyWompiTransactionAction({
        reference: activeCheckout.reference,
        gatewayTransactionId: fakeGatewayTxId,
        planCode: activeCheckout.plan.code as Exclude<LicensePlanCode, 'trial'>,
      });

      if (!res.success || !res.license) {
        setFeedbackError(
          res.error ?? 'No se pudo verificar la transacción con Wompi.'
        );
        return;
      }

      setActiveCheckout(null);
      setFeedbackSuccess(
        res.message ?? 'Pago aprobado y días acumulados exitosamente.'
      );
      if (onLicenseUpdated) {
        onLicenseUpdated(res.license);
      }
      if (isStandalonePage && res.license.can_operate) {
        router.push('/');
      }
      router.refresh();
    });
  };

  const handleSimulateScenario = (
    scenario: DemoAccountPreset['scenario']
  ) => {
    setFeedbackSuccess(null);
    setFeedbackError(null);

    startTransition(async () => {
      const res = await simulateLicenseScenarioAction(scenario);
      if (onLicenseUpdated) {
        onLicenseUpdated(res.license);
      }
      if (!res.canOperate) {
        router.push('/suscripcion');
      } else if (isStandalonePage) {
        router.push('/');
      }
      router.refresh();
    });
  };

  const paidPlans = [
    GST_LICENSE_PLANS.monthly,
    GST_LICENSE_PLANS.quarterly,
    GST_LICENSE_PLANS.semiannual,
    GST_LICENSE_PLANS.annual,
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      {/* Top Modal / Page Header */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Suscripción y Licencia del Sistema
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase rounded bg-slate-800 text-sky-300 border border-slate-700">
                {license.application_id}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Tenant: <strong className="text-slate-200">{session.tenantName}</strong> • NIT {session.nitOrTaxId}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
          >
            <X className="w-3.5 h-3.5" /> Cerrar
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-5 max-h-[82dvh] overflow-y-auto">
        {/* Feedback banners */}
        {feedbackSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {feedbackError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{feedbackError}</span>
          </div>
        )}

        {/* Expiration Warning or Blocked Banner */}
        {isExpired && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-rose-300">
                SUSCRIPCIÓN VENCIDA — ACCESO OPERATIVO PAUSADO (can_operate: false)
              </div>
              <p className="mt-1 text-slate-300">
                La vigencia de tu licencia para <strong>{session.tenantName}</strong> ha finalizado. Activa una clave oficial <code className="text-sky-300">LIC-*</code> o realiza el pago en línea con Wompi para restaurar el Estudio CAD 3D inmediatamente.
              </p>
            </div>
          </div>
        )}

        {isExpiringSoon && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>ALERTA DE VENCIMIENTO PRÓXIMO:</strong> Quedan{' '}
              <strong>{license.days_remaining} días</strong> de vigencia. Si renuevas hoy, los nuevos días se sumarán automáticamente sobre tu fecha actual de vencimiento ({formatDateEs(license.valid_to)}).
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Current Status + Key Activation + History */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Estado Actual del Sistema */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-400" /> Estado Actual de la Licencia
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                    isExpired
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : license.is_trial
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isExpired
                    ? '✕ VENCIDA'
                    : license.is_trial
                      ? '⚡ TRIAL ACTIVO'
                      : '✓ ACTIVA'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Plan Contratado
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {license.current_plan.name}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">
                    Vigencia Acumulada
                  </div>
                  <div
                    className={`text-base sm:text-lg font-mono font-extrabold mt-0.5 ${
                      isExpired
                        ? 'text-rose-400'
                        : isExpiringSoon
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {license.days_remaining} Días
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-2 pt-1 border-t border-slate-800/80 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Global Tenant ID:</span>
                  <code className="font-mono text-[11px] text-slate-300">
                    {license.tenant_id}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Última Clave Activada:</span>
                  <code className="font-mono text-xs font-semibold text-sky-300">
                    {license.last_license_key ?? 'TRIAL-15D-INICIAL'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fecha Cobertura Inicial:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {formatDateEs(license.valid_from)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fecha Expiración Final:</span>
                  <strong className="text-white">
                    {formatDateEs(license.valid_to)}
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Formulario de Activación por Clave Oficial (LIC-*) */}
            <form
              onSubmit={handleActivateKey}
              className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Activar o Renovar con Código Oficial
                </span>
                <span className="text-[11px] text-slate-400">
                  Acumula días vigentes
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Ingresa la llave de 1, 3, 6 o 12 meses emitida por GST-SOFTWARE (o haz clic en una clave de prueba para autocompletar):
              </p>

              {/* Sample Keys Quick Fill */}
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_OFFICIAL_KEYS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setLicenseKeyInput(item.key)}
                    className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-sky-300 transition"
                  >
                    {item.key} ({item.label})
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  required
                  value={licenseKeyInput}
                  onChange={(e) =>
                    setLicenseKeyInput(e.target.value.toUpperCase())
                  }
                  placeholder="Ej: LIC-6M-PRO7-5520"
                  className="flex-1 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs sm:text-sm text-white uppercase focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shrink-0 transition disabled:opacity-50"
                >
                  {isPending ? 'Validando...' : 'Activar Licencia'}
                </button>
              </div>
            </form>

            {/* 3. Historial Acumulativo de Licencias */}
            {license.active_history.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-sky-400" /> Cadena de Licencias Activas ({license.active_history.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1.5 pr-2">Clave / Ref</th>
                        <th className="py-1.5 px-2">Plan</th>
                        <th className="py-1.5 px-2">Días</th>
                        <th className="py-1.5 pl-2">Nuevo Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {license.active_history.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 pr-2 font-mono text-[11px] text-sky-300">
                            {item.license_key}
                          </td>
                          <td className="py-2 px-2 text-slate-200">
                            {item.plan_name}
                          </td>
                          <td className="py-2 px-2 font-mono text-emerald-400">
                            +{item.days_added}d
                          </td>
                          <td className="py-2 pl-2 font-semibold text-white">
                            {formatDateEs(item.valid_to)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Centralized Wompi Checkout Plans + QA Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Renovación en Línea (Wompi)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Firma Centralizada
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Selecciona un plan para generar la firma criptográfica desde el{' '}
                <strong className="text-slate-200">License Service</strong> y acumular días al instante:
              </p>

              {/* Active Wompi Checkout Confirmation Box */}
              {activeCheckout ? (
                <div className="p-4 rounded-xl bg-slate-900 border-2 border-emerald-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Widget Checkout Wompi Listo
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCheckout(null)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                    <div>Plan: {activeCheckout.plan.name}</div>
                    <div>Valor: {formatCop(activeCheckout.plan.priceCop)}</div>
                    <div>Ref: {activeCheckout.reference}</div>
                    <div className="truncate text-[10px] text-slate-400">
                      Firma SHA256: {activeCheckout.signatureIntegrity}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmSimulatedWompiPayment}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    {isPending
                      ? 'Verificando en License Service...'
                      : `Simular Pago Aprobado (+${activeCheckout.plan.days} Días)`}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {paidPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {plan.name}
                          </span>
                          {plan.badgeText && (
                            <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              {plan.badgeText}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Suma +{plan.days} días • {formatCop(plan.priceCop)}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          handleStartWompiCheckout(
                            plan.code as Exclude<LicensePlanCode, 'trial'>
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shrink-0 transition"
                      >
                        Pagar con Wompi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QA Scenario Switcher */}
            <div className="p-4 rounded-xl bg-slate-950/75 border border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Simulador Rápido de Estados (Pruebas QA)
              </div>
              <p className="text-[11px] text-slate-400">
                Prueba cómo responde el middleware y la interfaz ante cada estado de vigencia:
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSimulateScenario('active_pro')}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold"
                >
                  Activa (165d)
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSimulateScenario('expiring_trial')}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold"
                >
                  Por vencer (5d)
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSimulateScenario('expired_blocked')}
                  className="px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold"
                >
                  Vencida (0d)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface LicenseManagerModalProps {
  open: boolean;
  onClose: () => void;
  session: AuthenticatedSession;
  license: LicenseStatusResponse;
  onLicenseUpdated: (next: LicenseStatusResponse) => void;
}

export function LicenseManagerModal({
  open,
  onClose,
  session,
  license,
  onLicenseUpdated,
}: LicenseManagerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl">
        <LicenseManagerPanel
          session={session}
          license={license}
          onLicenseUpdated={onLicenseUpdated}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
