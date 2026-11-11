import type {
  AuthenticatedSession,
  DemoAccountPreset,
} from '../types/auth.types';

export const SESSION_COOKIE_NAME = 'gst_planos_session' as const;

export const DEMO_ACCOUNT_PRESETS: readonly DemoAccountPreset[] = [
  {
    id: 'demo-active-pro',
    badge: 'ACTIVA • 180 DÍAS',
    title: 'Estructuras & Carpintería El Roble S.A.S.',
    subtitle: 'Plan Semestral Activo (Acceso total al Estudio CAD 3D)',
    email: 'ingenieria@elroble.co',
    password: 'Password2026*',
    scenario: 'active_pro',
  },
  {
    id: 'demo-expiring-trial',
    badge: 'ALERTA • 5 DÍAS',
    title: 'Diseño Modular Andino Ltda.',
    subtitle: 'Período Trial próximo a vencer (Muestra alerta preventiva)',
    email: 'proyectos@modularandino.co',
    password: 'Password2026*',
    scenario: 'expiring_trial',
  },
  {
    id: 'demo-expired-blocked',
    badge: 'VENCIDA • 0 DÍAS',
    title: 'Metalmecánica Industrial del Valle',
    subtitle: 'Suscripción vencida (Redirige a /suscripcion para renovar)',
    email: 'gerencia@metalvalle.co',
    password: 'Password2026*',
    scenario: 'expired_blocked',
  },
] as const;

export function buildPresetSession(
  scenario: DemoAccountPreset['scenario'],
  now: Date = new Date()
): AuthenticatedSession {
  const dayMs = 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  if (scenario === 'active_pro') {
    const validFromIso = new Date(nowMs - 15 * dayMs).toISOString();
    const validToIso = new Date(nowMs + 165 * dayMs).toISOString();
    return {
      userId: 'b1000000-0000-4000-8000-000000000001',
      email: 'ingenieria@elroble.co',
      fullName: 'Ing. Miguel Muñoz',
      role: 'owner',
      roleLabel: 'Director de Ingeniería (Owner)',
      tenantId: 'c0a80101-1234-4678-90ab-cdef12345601',
      globalTenantId: 'c0a80101-1234-4678-90ab-cdef12345601',
      tenantName: 'Estructuras & Carpintería El Roble S.A.S.',
      tenantSlug: 'estructuras-el-roble',
      nitOrTaxId: '901.452.881-3',
      phone: '3004518890',
      planCode: 'semiannual',
      isTrial: false,
      validFromIso,
      validToIso,
      lastLicenseKey: 'LIC-6M-PRO7-5520',
      activeHistory: [
        {
          id: 'act-001',
          license_key: 'LIC-6M-PRO7-5520',
          plan_code: 'semiannual',
          plan_name: 'Plan Semestral (6 Meses)',
          months_added: 6,
          days_added: 180,
          valid_from: validFromIso,
          valid_to: validToIso,
          payment_reference: 'GST-C0A80101-SEMIANNUAL-884120',
        },
      ],
    };
  }

  if (scenario === 'expiring_trial') {
    const validFromIso = new Date(nowMs - 10 * dayMs).toISOString();
    const validToIso = new Date(nowMs + 5 * dayMs).toISOString();
    return {
      userId: 'b1000000-0000-4000-8000-000000000002',
      email: 'proyectos@modularandino.co',
      fullName: 'Arq. Valentina Gómez',
      role: 'owner',
      roleLabel: 'Arquitecta Líder (Owner)',
      tenantId: 'c0a80101-1234-4678-90ab-cdef12345602',
      globalTenantId: 'c0a80101-1234-4678-90ab-cdef12345602',
      tenantName: 'Diseño Modular Andino Ltda.',
      tenantSlug: 'diseno-modular-andino',
      nitOrTaxId: '900.812.334-9',
      phone: '3157894412',
      planCode: 'trial',
      isTrial: true,
      validFromIso,
      validToIso,
      lastLicenseKey: 'TRIAL-15D-INICIAL',
      activeHistory: [
        {
          id: 'act-002',
          license_key: 'TRIAL-15D-INICIAL',
          plan_code: 'trial',
          plan_name: 'Período de Prueba (15 Días)',
          months_added: 0,
          days_added: 15,
          valid_from: validFromIso,
          valid_to: validToIso,
        },
      ],
    };
  }

  // expired_blocked
  const validFromIso = new Date(nowMs - 40 * dayMs).toISOString();
  const validToIso = new Date(nowMs - 5 * dayMs).toISOString();
  return {
    userId: 'b1000000-0000-4000-8000-000000000003',
    email: 'gerencia@metalvalle.co',
    fullName: 'Ing. Carlos Andrés Mejía',
    role: 'owner',
    roleLabel: 'Gerente Técnico (Owner)',
    tenantId: 'c0a80101-1234-4678-90ab-cdef12345603',
    globalTenantId: 'c0a80101-1234-4678-90ab-cdef12345603',
    tenantName: 'Metalmecánica Industrial del Valle',
    tenantSlug: 'metalmecanica-del-valle',
    nitOrTaxId: '890.312.990-1',
    phone: '3109981122',
    planCode: 'monthly',
    isTrial: false,
    validFromIso,
    validToIso,
    lastLicenseKey: 'LIC-1M-OLD1-2025',
    activeHistory: [
      {
        id: 'act-003',
        license_key: 'LIC-1M-OLD1-2025',
        plan_code: 'monthly',
        plan_name: 'Plan Mensual (1 Mes)',
        months_added: 1,
        days_added: 30,
        valid_from: validFromIso,
        valid_to: validToIso,
      },
    ],
  };
}

export function sanitizeTenantSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function serializeSessionCookie(session: AuthenticatedSession): string {
  return Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url');
}

export function parseSessionCookie(
  rawCookieValue: string | undefined
): AuthenticatedSession | null {
  if (!rawCookieValue) return null;
  try {
    const json = Buffer.from(rawCookieValue, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json) as AuthenticatedSession;
    if (!parsed.tenantId || !parsed.email || !parsed.validToIso) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
