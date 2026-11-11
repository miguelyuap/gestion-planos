import { z } from 'zod';

export const GST_APP_ID = 'app_gestion_planos' as const;

export const LicensePlanCodeSchema = z.enum([
  'trial',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
]);

export type LicensePlanCode = z.infer<typeof LicensePlanCodeSchema>;

export const LicenseStatusStateSchema = z.enum(['active', 'trial', 'expired']);

export type LicenseStatusState = z.infer<typeof LicenseStatusStateSchema>;

export interface LicenseFeatureFlags {
  all_10_generators: boolean;
  export_pdf_cutlist: boolean;
  custom_company_header: boolean;
  multi_user: boolean;
}

export interface LicensePlanDefinition {
  id: string;
  code: LicensePlanCode;
  name: string;
  months: number;
  days: number;
  priceCop: number;
  badgeText?: string;
  description: string;
  feature_flags: LicenseFeatureFlags;
}

export interface LicenseActivationRecord {
  id: string;
  license_key: string;
  plan_code: LicensePlanCode;
  plan_name: string;
  months_added: number;
  days_added: number;
  valid_from: string;
  valid_to: string;
  payment_reference?: string;
}

/**
 * Respuesta oficial del License Service según LICENSE_SERVICE_INTEGRATION.md
 */
export interface LicenseStatusResponse {
  tenant_id: string;
  application_id: string;
  has_license: boolean;
  status: LicenseStatusState;
  is_trial: boolean;
  can_operate: boolean;
  days_remaining: number;
  valid_from: string;
  valid_to: string;
  last_license_key?: string;
  current_plan: {
    id: string;
    name: string;
    code: LicensePlanCode;
    months: number;
    priceCop: number;
    feature_flags: LicenseFeatureFlags;
  };
  active_history: LicenseActivationRecord[];
}

export const ActivateLicenseKeyInputSchema = z.object({
  licenseKey: z
    .string()
    .trim()
    .min(10, 'Ingresa una clave de activación válida (ej. LIC-6M-A1B2-C3D4).')
    .regex(
      /^LIC-(1M|3M|6M|12M)-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
      'Formato inválido. Usa el formato oficial GST: LIC-1M-XXXX-XXXX, LIC-3M-XXXX-XXXX, LIC-6M-XXXX-XXXX o LIC-12M-XXXX-XXXX.'
    ),
});

export const WompiCheckoutInputSchema = z.object({
  tenantId: z.string().min(1),
  planCode: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']),
  customerEmail: z.string().email('Correo electrónico inválido.'),
  customerFullName: z.string().min(2, 'Nombre completo requerido.'),
  customerPhone: z.string().min(7, 'Teléfono de contacto requerido.'),
});

export type WompiCheckoutInput = z.infer<typeof WompiCheckoutInputSchema>;

export interface WompiCheckoutSession {
  publicKey: string;
  reference: string;
  signatureIntegrity: string;
  amountInCents: number;
  currency: 'COP';
  plan: LicensePlanDefinition;
}

export const VerifyTransactionInputSchema = z.object({
  reference: z.string().min(5),
  gatewayTransactionId: z.string().min(5),
  planCode: z.enum(['monthly', 'quarterly', 'semiannual', 'annual']),
});
