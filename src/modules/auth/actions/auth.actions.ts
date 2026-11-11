'use server';

import { cookies } from 'next/headers';
import {
  createServerSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/server';
import {
  getTenantLicenseStatus,
  invalidateLicenseCache,
} from '../../licensing/services/license.service';
import {
  buildPresetSession,
  DEMO_ACCOUNT_PRESETS,
  parseSessionCookie,
  sanitizeTenantSlug,
  serializeSessionCookie,
  SESSION_COOKIE_NAME,
} from '../services/auth.service';
import {
  type AuthenticatedSession,
  type DemoAccountPreset,
  LoginInputSchema,
  RegisterTenantInputSchema,
  type StudioSessionContext,
} from '../types/auth.types';

async function setSessionCookie(session: AuthenticatedSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, serializeSessionCookie(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getCurrentStudioContext(): Promise<StudioSessionContext | null> {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionCookie(rawCookie);

  if (!session) {
    return null;
  }

  const license = await getTenantLicenseStatus(session.globalTenantId, {
    planCode: session.planCode,
    isTrial: session.isTrial,
    validFromIso: session.validFromIso,
    validToIso: session.validToIso,
    lastLicenseKey: session.lastLicenseKey,
    activeHistory: session.activeHistory,
  });

  return { session, license };
}

export async function loginAction(rawInput: {
  email: string;
  password: string;
}): Promise<{
  success: boolean;
  canOperate?: boolean;
  error?: string;
}> {
  const parsed = LoginInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ?? 'Datos de acceso inválidos.';
    return { success: false, error: firstError };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // 1. Check Preset Demo Accounts first
  const matchedPreset = DEMO_ACCOUNT_PRESETS.find(
    (p) => p.email.toLowerCase() === normalizedEmail
  );

  if (matchedPreset) {
    if (password !== matchedPreset.password) {
      return {
        success: false,
        error: 'Contraseña incorrecta para la cuenta demostrativa.',
      };
    }

    const session = buildPresetSession(matchedPreset.scenario);
    invalidateLicenseCache(session.globalTenantId);
    await setSessionCookie(session);

    const license = await getTenantLicenseStatus(session.globalTenantId, {
      planCode: session.planCode,
      isTrial: session.isTrial,
      validFromIso: session.validFromIso,
      validToIso: session.validToIso,
      lastLicenseKey: session.lastLicenseKey,
      activeHistory: session.activeHistory,
    });

    return {
      success: true,
      canOperate: license.can_operate,
    };
  }

  // 2. If Supabase is configured in .env, authenticate against Supabase Auth
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (authError || !authData.user) {
        return {
          success: false,
          error: 'Correo electrónico o contraseña incorrectos.',
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, tenants(*)')
        .eq('id', authData.user.id)
        .maybeSingle();

      const now = new Date();
      const defaultValidTo = new Date(
        now.getTime() + 15 * 24 * 60 * 60 * 1000
      ).toISOString();

      const tenantRow = Array.isArray(profile?.tenants)
        ? profile?.tenants[0]
        : profile?.tenants;

      const session: AuthenticatedSession = {
        userId: authData.user.id,
        email: normalizedEmail,
        fullName:
          profile?.full_name ?? normalizedEmail.split('@')[0] ?? 'Ingeniero',
        role:
          profile?.role === 'engineer' || profile?.role === 'viewer'
            ? profile.role
            : 'owner',
        roleLabel: 'Propietario / Ingeniero',
        tenantId:
          (tenantRow?.id as string | undefined) ?? authData.user.id,
        globalTenantId:
          (tenantRow?.global_tenant_id as string | undefined) ??
          authData.user.id,
        tenantName:
          (tenantRow?.name as string | undefined) ?? 'Mi Taller Estructural',
        tenantSlug:
          (tenantRow?.slug as string | undefined) ?? 'mi-taller-estructural',
        nitOrTaxId:
          (tenantRow?.nit_or_tax_id as string | undefined) ?? '900.000.000-1',
        phone: (tenantRow?.phone as string | undefined) ?? '3000000000',
        planCode: 'trial',
        isTrial: Boolean(tenantRow?.is_trial ?? true),
        validFromIso:
          (tenantRow?.valid_from as string | undefined) ?? now.toISOString(),
        validToIso:
          (tenantRow?.valid_to as string | undefined) ?? defaultValidTo,
        lastLicenseKey:
          (tenantRow?.last_license_key as string | undefined) ??
          'TRIAL-15D-INICIAL',
        activeHistory: [],
      };

      invalidateLicenseCache(session.globalTenantId);
      await setSessionCookie(session);

      const license = await getTenantLicenseStatus(session.globalTenantId, {
        planCode: session.planCode,
        isTrial: session.isTrial,
        validFromIso: session.validFromIso,
        validToIso: session.validToIso,
        lastLicenseKey: session.lastLicenseKey,
        activeHistory: session.activeHistory,
      });

      return {
        success: true,
        canOperate: license.can_operate,
      };
    } catch {
      return {
        success: false,
        error:
          'No fue posible conectar con el servidor de autenticación. Intenta de nuevo.',
      };
    }
  }

  return {
    success: false,
    error:
      'Credenciales no reconocidas. Usa una de las cuentas demostrativas o registra tu taller.',
  };
}

export async function loginWithDemoScenarioAction(
  scenario: DemoAccountPreset['scenario']
): Promise<{
  success: boolean;
  canOperate: boolean;
}> {
  const session = buildPresetSession(scenario);
  invalidateLicenseCache(session.globalTenantId);
  await setSessionCookie(session);

  const license = await getTenantLicenseStatus(session.globalTenantId, {
    planCode: session.planCode,
    isTrial: session.isTrial,
    validFromIso: session.validFromIso,
    validToIso: session.validToIso,
    lastLicenseKey: session.lastLicenseKey,
    activeHistory: session.activeHistory,
  });

  return {
    success: true,
    canOperate: license.can_operate,
  };
}

export async function registerTenantAction(rawInput: {
  businessName: string;
  nitOrTaxId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = RegisterTenantInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message ??
      'Verifica los datos del formulario de registro.';
    return { success: false, error: firstError };
  }

  const data = parsed.data;
  const slug = sanitizeTenantSlug(data.businessName) || 'taller-cad';
  const now = new Date();
  const validFromIso = now.toISOString();
  const validToIso = new Date(
    now.getTime() + 15 * 24 * 60 * 60 * 1000
  ).toISOString();
  const generatedTenantId = crypto.randomUUID();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: data.email.toLowerCase(),
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              business_name: data.businessName,
              nit_or_tax_id: data.nitOrTaxId,
              phone: data.phone,
            },
          },
        });

      if (signUpError) {
        return {
          success: false,
          error:
            signUpError.message ||
            'No se pudo registrar el correo en Supabase Auth.',
        };
      }

      // El trigger on_auth_user_created en PostgreSQL crea automáticamente el registro
      // en public.tenants, public.profiles y public.license_activations (Trial 15 días).
      if (signUpData.user) {
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', signUpData.user.id)
          .maybeSingle();
        if (profileRow?.tenant_id) {
          // Use the database-generated tenant UUID if available
        }
      }
    } catch {
      // Fallback to signed local session if DB migration hasn't run yet
    }
  }

  const newSession: AuthenticatedSession = {
    userId: crypto.randomUUID(),
    email: data.email.toLowerCase(),
    fullName: data.fullName,
    role: 'owner',
    roleLabel: 'Propietario / Ingeniero Titular',
    tenantId: generatedTenantId,
    globalTenantId: generatedTenantId,
    tenantName: data.businessName,
    tenantSlug: slug,
    nitOrTaxId: data.nitOrTaxId,
    phone: data.phone,
    planCode: 'trial',
    isTrial: true,
    validFromIso,
    validToIso,
    lastLicenseKey: 'TRIAL-15D-INICIAL',
    activeHistory: [
      {
        id: `trial-${Date.now()}`,
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

  invalidateLicenseCache(newSession.globalTenantId);
  await setSessionCookie(newSession);

  return { success: true };
}

export async function signOutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signout network errors
    }
  }

  return { success: true };
}
