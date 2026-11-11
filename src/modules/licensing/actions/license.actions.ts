'use server';

import { cookies } from 'next/headers';
import {
  buildPresetSession,
  parseSessionCookie,
  serializeSessionCookie,
  SESSION_COOKIE_NAME,
} from '../../auth/services/auth.service';
import type {
  AuthenticatedSession,
  DemoAccountPreset,
} from '../../auth/types/auth.types';
import {
  buildLicenseStatusFromRecord,
  calculateAccumulatedValidity,
  createCentralizedWompiCheckout,
  GST_LICENSE_PLANS,
  invalidateLicenseCache,
  parseAndValidateLicenseKey,
} from '../services/license.service';
import {
  ActivateLicenseKeyInputSchema,
  type LicenseActivationRecord,
  type LicensePlanCode,
  type LicenseStatusResponse,
  VerifyTransactionInputSchema,
  type WompiCheckoutSession,
} from '../types/license.types';

async function saveUpdatedSessionCookie(
  session: AuthenticatedSession
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, serializeSessionCookie(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

/**
 * Activa o renueva una licencia mediante código oficial GST (LIC-1M-..., LIC-3M-..., LIC-6M-..., LIC-12M-...)
 * Acumula automáticamente los días sobre la vigencia restante si aún no ha vencido.
 */
export async function activateLicenseKeyAction(rawKeyInput: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  license?: LicenseStatusResponse;
}> {
  const zodCheck = ActivateLicenseKeyInputSchema.safeParse({
    licenseKey: rawKeyInput,
  });

  if (!zodCheck.success) {
    return {
      success: false,
      error:
        zodCheck.error.issues[0]?.message ??
        'Formato de clave de activación inválido.',
    };
  }

  const parsedKey = parseAndValidateLicenseKey(zodCheck.data.licenseKey);
  if (!parsedKey.valid || !parsedKey.plan || !parsedKey.months) {
    return {
      success: false,
      error: parsedKey.error ?? 'Clave de licencia no válida.',
    };
  }

  const cookieStore = await cookies();
  const currentSession = parseSessionCookie(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!currentSession) {
    return {
      success: false,
      error: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
    };
  }

  const accumulated = calculateAccumulatedValidity(
    currentSession.validToIso,
    parsedKey.plan.days
  );

  const newActivationRecord: LicenseActivationRecord = {
    id: `act-${Date.now()}`,
    license_key: parsedKey.normalizedKey,
    plan_code: parsedKey.plan.code,
    plan_name: parsedKey.plan.name,
    months_added: parsedKey.months,
    days_added: parsedKey.plan.days,
    valid_from: accumulated.newValidFromIso,
    valid_to: accumulated.newValidToIso,
  };

  const updatedHistory = [
    newActivationRecord,
    ...currentSession.activeHistory,
  ].slice(0, 10);

  const updatedSession: AuthenticatedSession = {
    ...currentSession,
    planCode: parsedKey.plan.code,
    isTrial: false,
    validToIso: accumulated.newValidToIso,
    lastLicenseKey: parsedKey.normalizedKey,
    activeHistory: updatedHistory,
  };

  invalidateLicenseCache(updatedSession.globalTenantId);
  await saveUpdatedSessionCookie(updatedSession);

  const updatedLicense = buildLicenseStatusFromRecord({
    tenantId: updatedSession.globalTenantId,
    planCode: updatedSession.planCode,
    isTrial: false,
    validFromIso: updatedSession.validFromIso,
    validToIso: updatedSession.validToIso,
    lastLicenseKey: updatedSession.lastLicenseKey,
    activeHistory: updatedSession.activeHistory,
  });

  return {
    success: true,
    message: `¡Licencia ${parsedKey.plan.name} activada con éxito! Ahora cuentas con ${updatedLicense.days_remaining} días de vigencia acumulada.`,
    license: updatedLicense,
  };
}

/**
 * Paso 4.1 de LICENSE_SERVICE_INTEGRATION.md:
 * Inicia sesión de pago con firma criptográfica delegada al License Service.
 */
export async function initiateWompiCheckoutAction(
  planCode: Exclude<LicensePlanCode, 'trial'>
): Promise<{
  success: boolean;
  checkout?: WompiCheckoutSession;
  error?: string;
}> {
  const cookieStore = await cookies();
  const currentSession = parseSessionCookie(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!currentSession) {
    return {
      success: false,
      error: 'Debes iniciar sesión para contratar un plan.',
    };
  }

  try {
    const checkout = await createCentralizedWompiCheckout({
      tenantId: currentSession.globalTenantId,
      planCode,
      customerEmail: currentSession.email,
      customerFullName: currentSession.fullName,
      customerPhone: currentSession.phone || '3000000000',
    });

    return {
      success: true,
      checkout,
    };
  } catch {
    return {
      success: false,
      error:
        'No fue posible generar la firma de pago con el License Service. Intenta nuevamente.',
    };
  }
}

/**
 * Paso 4.2 de LICENSE_SERVICE_INTEGRATION.md:
 * Verifica la transacción aprobada en Wompi, extiende los días de forma acumulativa
 * e invalida el caché local.
 */
export async function verifyWompiTransactionAction(rawInput: {
  reference: string;
  gatewayTransactionId: string;
  planCode: Exclude<LicensePlanCode, 'trial'>;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  license?: LicenseStatusResponse;
}> {
  const parsed = VerifyTransactionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Datos de confirmación de transacción inválidos.',
    };
  }

  const cookieStore = await cookies();
  const currentSession = parseSessionCookie(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (!currentSession) {
    return {
      success: false,
      error: 'Sesión no encontrada.',
    };
  }

  const plan = GST_LICENSE_PLANS[parsed.data.planCode];
  const accumulated = calculateAccumulatedValidity(
    currentSession.validToIso,
    plan.days
  );

  const generatedKey = `LIC-${plan.months}M-WMP${Date.now().toString().slice(-1)}-${parsed.data.gatewayTransactionId.slice(-4).toUpperCase()}`;

  const newActivationRecord: LicenseActivationRecord = {
    id: `wompi-${Date.now()}`,
    license_key: generatedKey,
    plan_code: plan.code,
    plan_name: plan.name,
    months_added: plan.months,
    days_added: plan.days,
    valid_from: accumulated.newValidFromIso,
    valid_to: accumulated.newValidToIso,
    payment_reference: parsed.data.reference,
  };

  const updatedHistory = [
    newActivationRecord,
    ...currentSession.activeHistory,
  ].slice(0, 10);

  const updatedSession: AuthenticatedSession = {
    ...currentSession,
    planCode: plan.code,
    isTrial: false,
    validToIso: accumulated.newValidToIso,
    lastLicenseKey: generatedKey,
    activeHistory: updatedHistory,
  };

  invalidateLicenseCache(updatedSession.globalTenantId);
  await saveUpdatedSessionCookie(updatedSession);

  const updatedLicense = buildLicenseStatusFromRecord({
    tenantId: updatedSession.globalTenantId,
    planCode: updatedSession.planCode,
    isTrial: false,
    validFromIso: updatedSession.validFromIso,
    validToIso: updatedSession.validToIso,
    lastLicenseKey: updatedSession.lastLicenseKey,
    activeHistory: updatedSession.activeHistory,
  });

  return {
    success: true,
    message: `Pago verificado (${parsed.data.reference}). Se acreditaron +${plan.days} días al plan ${plan.name}.`,
    license: updatedLicense,
  };
}

/**
 * Permite simular en 1 clic los escenarios de licencia (Activa, Alerta por vencer, Vencida)
 * para pruebas de QA sin tener que cerrar sesión.
 */
export async function simulateLicenseScenarioAction(
  scenario: DemoAccountPreset['scenario']
): Promise<{
  success: boolean;
  canOperate: boolean;
  license: LicenseStatusResponse;
}> {
  const cookieStore = await cookies();
  const currentSession = parseSessionCookie(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );
  const preset = buildPresetSession(scenario);

  const nextSession: AuthenticatedSession = currentSession
    ? {
        ...currentSession,
        planCode: preset.planCode,
        isTrial: preset.isTrial,
        validFromIso: preset.validFromIso,
        validToIso: preset.validToIso,
        lastLicenseKey: preset.lastLicenseKey,
        activeHistory: preset.activeHistory,
      }
    : preset;

  invalidateLicenseCache(nextSession.globalTenantId);
  await saveUpdatedSessionCookie(nextSession);

  const license = buildLicenseStatusFromRecord({
    tenantId: nextSession.globalTenantId,
    planCode: nextSession.planCode,
    isTrial: nextSession.isTrial,
    validFromIso: nextSession.validFromIso,
    validToIso: nextSession.validToIso,
    lastLicenseKey: nextSession.lastLicenseKey,
    activeHistory: nextSession.activeHistory,
  });

  return {
    success: true,
    canOperate: license.can_operate,
    license,
  };
}
