import { z } from 'zod';
import type {
  LicenseActivationRecord,
  LicensePlanCode,
  LicenseStatusResponse,
} from '../../licensing/types/license.types';

export const UserRoleSchema = z.enum(['owner', 'engineer', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LoginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Por favor ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterTenantInputSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, 'El nombre del taller o empresa debe tener al menos 3 caracteres.'),
  nitOrTaxId: z
    .string()
    .trim()
    .min(5, 'Ingresa un NIT o identificación tributaria válida.'),
  fullName: z
    .string()
    .trim()
    .min(3, 'El nombre del titular o ingeniero es obligatorio.'),
  email: z
    .string()
    .trim()
    .email('Ingresa un correo electrónico corporativo válido.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Ingresa un número de teléfono o WhatsApp válido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export type RegisterTenantInput = z.infer<typeof RegisterTenantInputSchema>;

export interface AuthenticatedSession {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  tenantId: string;
  globalTenantId: string;
  tenantName: string;
  tenantSlug: string;
  nitOrTaxId: string;
  phone: string;
  planCode: LicensePlanCode;
  isTrial: boolean;
  validFromIso: string;
  validToIso: string;
  lastLicenseKey?: string;
  activeHistory: LicenseActivationRecord[];
}

export interface StudioSessionContext {
  session: AuthenticatedSession;
  license: LicenseStatusResponse;
}

export interface DemoAccountPreset {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  email: string;
  password: string;
  scenario: 'active_pro' | 'expiring_trial' | 'expired_blocked';
}
