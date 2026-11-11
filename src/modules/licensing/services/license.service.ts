import {
  GST_APP_ID,
  type LicenseActivationRecord,
  type LicensePlanCode,
  type LicensePlanDefinition,
  type LicenseStatusResponse,
  type WompiCheckoutInput,
  type WompiCheckoutSession,
} from '../types/license.types';

export const GST_LICENSE_PLANS: Record<LicensePlanCode, LicensePlanDefinition> = {
  trial: {
    id: 'plan-gst-planos-trial',
    code: 'trial',
    name: 'Período de Prueba (15 Días)',
    months: 0,
    days: 15,
    priceCop: 0,
    description: 'Evaluación funcional de los 10 motores paramétricos 3D.',
    feature_flags: {
      all_10_generators: true,
      export_pdf_cutlist: true,
      custom_company_header: false,
      multi_user: false,
    },
  },
  monthly: {
    id: 'plan-gst-planos-1m',
    code: 'monthly',
    name: 'Plan Mensual (1 Mes)',
    months: 1,
    days: 30,
    priceCop: 49900,
    description: 'Ideal para talleres independientes y proyectos puntuales.',
    feature_flags: {
      all_10_generators: true,
      export_pdf_cutlist: true,
      custom_company_header: true,
      multi_user: false,
    },
  },
  quarterly: {
    id: 'plan-gst-planos-3m',
    code: 'quarterly',
    name: 'Plan Trimestral (3 Meses)',
    months: 3,
    days: 90,
    priceCop: 134900,
    badgeText: 'Ahorra 10%',
    description: 'Continuidad operativa para carpinterías y ornamentadores.',
    feature_flags: {
      all_10_generators: true,
      export_pdf_cutlist: true,
      custom_company_header: true,
      multi_user: true,
    },
  },
  semiannual: {
    id: 'plan-gst-planos-6m',
    code: 'semiannual',
    name: 'Plan Semestral (6 Meses)',
    months: 6,
    days: 180,
    priceCop: 249900,
    badgeText: 'Más Popular • -16%',
    description: 'Incluye membrete corporativo en PDF y acumulación de vigencia.',
    feature_flags: {
      all_10_generators: true,
      export_pdf_cutlist: true,
      custom_company_header: true,
      multi_user: true,
    },
  },
  annual: {
    id: 'plan-gst-planos-12m',
    code: 'annual',
    name: 'Plan Anual Industrial (12 Meses)',
    months: 12,
    days: 365,
    priceCop: 449900,
    badgeText: 'Mejor Valor • -25%',
    description: 'Licencia anual completa multi-usuario con soporte prioritario.',
    feature_flags: {
      all_10_generators: true,
      export_pdf_cutlist: true,
      custom_company_header: true,
      multi_user: true,
    },
  },
};

export const SAMPLE_OFFICIAL_KEYS: ReadonlyArray<{
  key: string;
  label: string;
  months: 1 | 3 | 6 | 12;
}> = [
  { key: 'LIC-1M-GST4-2026', label: '1 Mes (+30 días)', months: 1 },
  { key: 'LIC-3M-CAD9-8841', label: '3 Meses (+90 días)', months: 3 },
  { key: 'LIC-6M-PRO7-5520', label: '6 Meses (+180 días)', months: 6 },
  { key: 'LIC-12M-IND1-9900', label: '12 Meses (+365 días)', months: 12 },
];

// In-memory server cache (1 hour TTL as required by LICENSE_SERVICE_INTEGRATION.md §5)
const licenseCache = new Map<
  string,
  { status: LicenseStatusResponse; expiresAtMs: number }
>();

const CACHE_TTL_MS = 3600 * 1000;

export function invalidateLicenseCache(tenantId: string): void {
  licenseCache.delete(`license:${tenantId}`);
}

export function getPlanByMonths(months: 1 | 3 | 6 | 12): LicensePlanDefinition {
  switch (months) {
    case 1:
      return GST_LICENSE_PLANS.monthly;
    case 3:
      return GST_LICENSE_PLANS.quarterly;
    case 6:
      return GST_LICENSE_PLANS.semiannual;
    case 12:
      return GST_LICENSE_PLANS.annual;
  }
}

export function parseAndValidateLicenseKey(rawKey: string): {
  valid: boolean;
  normalizedKey: string;
  months?: 1 | 3 | 6 | 12;
  plan?: LicensePlanDefinition;
  error?: string;
} {
  const normalizedKey = rawKey.trim().toUpperCase();
  const match = normalizedKey.match(
    /^LIC-(1M|3M|6M|12M)-([A-Z0-9]{4})-([A-Z0-9]{4})$/
  );

  if (!match) {
    return {
      valid: false,
      normalizedKey,
      error:
        'Clave inválida. Debe tener el formato oficial GST: LIC-1M-XXXX-XXXX, LIC-3M-XXXX-XXXX, LIC-6M-XXXX-XXXX o LIC-12M-XXXX-XXXX.',
    };
  }

  const durationToken = match[1];
  const months: 1 | 3 | 6 | 12 =
    durationToken === '1M'
      ? 1
      : durationToken === '3M'
        ? 3
        : durationToken === '6M'
          ? 6
          : 12;

  return {
    valid: true,
    normalizedKey,
    months,
    plan: getPlanByMonths(months),
  };
}

/**
 * Regla de Acumulación de Vigencia (LICENSE_SERVICE_INTEGRATION.md §4.2 y §6.4):
 * Si el cliente tiene días restantes vigentes (prueba o contrato activo), la nueva licencia
 * se suma a partir de la fecha de vencimiento actual sin perder días previos.
 */
export function calculateAccumulatedValidity(
  currentValidToIso: string | null | undefined,
  daysToAdd: number,
  now: Date = new Date()
): {
  newValidFromIso: string;
  newValidToIso: string;
  totalDaysRemaining: number;
} {
  const nowMs = now.getTime();
  const currentEndMs = currentValidToIso
    ? new Date(currentValidToIso).getTime()
    : nowMs;

  const baseStartMs =
    !Number.isNaN(currentEndMs) && currentEndMs > nowMs ? currentEndMs : nowMs;
  const addedMs = daysToAdd * 24 * 60 * 60 * 1000;
  const newEndMs = baseStartMs + addedMs;
  const totalDaysRemaining = Math.max(
    0,
    Math.ceil((newEndMs - nowMs) / (24 * 60 * 60 * 1000))
  );

  return {
    newValidFromIso: new Date(baseStartMs).toISOString(),
    newValidToIso: new Date(newEndMs).toISOString(),
    totalDaysRemaining,
  };
}

export function computeDaysRemaining(
  validToIso: string,
  now: Date = new Date()
): number {
  const endMs = new Date(validToIso).getTime();
  if (Number.isNaN(endMs)) return 0;
  const diffMs = endMs - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function buildLicenseStatusFromRecord(params: {
  tenantId: string;
  planCode: LicensePlanCode;
  isTrial: boolean;
  validFromIso: string;
  validToIso: string;
  lastLicenseKey?: string;
  activeHistory?: LicenseActivationRecord[];
  now?: Date;
}): LicenseStatusResponse {
  const plan = GST_LICENSE_PLANS[params.planCode] ?? GST_LICENSE_PLANS.trial;
  const daysRemaining = computeDaysRemaining(params.validToIso, params.now);
  const canOperate = daysRemaining > 0;
  const status = !canOperate
    ? 'expired'
    : params.isTrial
      ? 'trial'
      : 'active';

  return {
    tenant_id: params.tenantId,
    application_id: GST_APP_ID,
    has_license: true,
    status,
    is_trial: params.isTrial,
    can_operate: canOperate,
    days_remaining: daysRemaining,
    valid_from: params.validFromIso,
    valid_to: params.validToIso,
    last_license_key: params.lastLicenseKey,
    current_plan: {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      months: plan.months,
      priceCop: plan.priceCop,
      feature_flags: plan.feature_flags,
    },
    active_history: params.activeHistory ?? [],
  };
}

/**
 * Consulta el microservicio central License Service (GET /api/v1/licenses/{tenantId}/status)
 * con caché de 1 hora y Fallback de Grace Period si el servicio externo no está configurado.
 */
export async function getTenantLicenseStatus(
  tenantId: string,
  fallbackRecord: {
    planCode: LicensePlanCode;
    isTrial: boolean;
    validFromIso: string;
    validToIso: string;
    lastLicenseKey?: string;
    activeHistory?: LicenseActivationRecord[];
  }
): Promise<LicenseStatusResponse> {
  const cacheKey = `license:${tenantId}`;
  const cached = licenseCache.get(cacheKey);
  if (cached && cached.expiresAtMs > Date.now()) {
    return cached.status;
  }

  const serviceUrl = process.env.LICENSE_SERVICE_URL;
  const apiKey = process.env.LICENSE_SERVICE_API_KEY;
  const isExternalConfigured = Boolean(
    serviceUrl &&
      apiKey &&
      !serviceUrl.includes('license-service.gst.com') &&
      apiKey !== 'your-license-service-secret-api-key'
  );

  if (isExternalConfigured && serviceUrl && apiKey) {
    try {
      const endpoint = `${serviceUrl.replace(/\/$/, '')}/api/v1/licenses/${encodeURIComponent(
        tenantId
      )}/status?applicationId=${GST_APP_ID}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'x-app-id': GST_APP_ID,
        },
        next: { revalidate: 3600 },
      });

      if (res.ok) {
        const externalData = (await res.json()) as LicenseStatusResponse;
        licenseCache.set(cacheKey, {
          status: externalData,
          expiresAtMs: Date.now() + CACHE_TTL_MS,
        });
        return externalData;
      }
    } catch {
      // Fallback en caso de caída (Grace Period según LICENSE_SERVICE_INTEGRATION.md §5)
    }
  }

  const localStatus = buildLicenseStatusFromRecord({
    tenantId,
    ...fallbackRecord,
  });

  licenseCache.set(cacheKey, {
    status: localStatus,
    expiresAtMs: Date.now() + CACHE_TTL_MS,
  });

  return localStatus;
}

/**
 * Paso 4.1 de LICENSE_SERVICE_INTEGRATION.md:
 * Solicita firma criptográfica e inicio de Checkout al License Service centralizado.
 * Ninguna llave privada de Wompi vive en esta aplicación cliente.
 */
export async function createCentralizedWompiCheckout(
  input: WompiCheckoutInput
): Promise<WompiCheckoutSession> {
  const plan = GST_LICENSE_PLANS[input.planCode];
  const serviceUrl = process.env.LICENSE_SERVICE_URL;
  const apiKey = process.env.LICENSE_SERVICE_API_KEY;
  const isExternalConfigured = Boolean(
    serviceUrl &&
      apiKey &&
      !serviceUrl.includes('license-service.gst.com') &&
      apiKey !== 'your-license-service-secret-api-key'
  );

  if (isExternalConfigured && serviceUrl && apiKey) {
    const res = await fetch(
      `${serviceUrl.replace(/\/$/, '')}/api/v1/licenses/checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'x-app-id': GST_APP_ID,
        },
        body: JSON.stringify({
          tenantId: input.tenantId,
          planId: plan.id,
          customerEmail: input.customerEmail,
          customerFullName: input.customerFullName,
          customerPhone: input.customerPhone,
        }),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as {
        config: {
          publicKey: string;
          reference: string;
          signature: string;
          amountInCents: number;
        };
      };
      return {
        publicKey: data.config.publicKey,
        reference: data.config.reference,
        signatureIntegrity: data.config.signature,
        amountInCents: data.config.amountInCents,
        currency: 'COP',
        plan,
      };
    }
  }

  // Respuesta simulada determinista cuando se opera en entorno local de desarrollo
  const shortTenant = input.tenantId.slice(0, 8).toUpperCase();
  const stamp = Date.now().toString().slice(-6);
  return {
    publicKey: 'pub_test_gst_software_wompi_sandbox',
    reference: `GST-${shortTenant}-${input.planCode.toUpperCase()}-${stamp}`,
    signatureIntegrity: `sig_integrity_sha256_${shortTenant}_${stamp}`,
    amountInCents: plan.priceCop * 100,
    currency: 'COP',
    plan,
  };
}
