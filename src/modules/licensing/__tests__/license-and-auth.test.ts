import { describe, expect, it } from 'vitest';
import {
  buildPresetSession,
  parseSessionCookie,
  serializeSessionCookie,
} from '../../auth/services/auth.service';
import {
  buildLicenseStatusFromRecord,
  calculateAccumulatedValidity,
  parseAndValidateLicenseKey,
} from '../services/license.service';

describe('GST-SOFTWARE Auth & Centralized Licensing Engine', () => {
  it('validates official GST license keys (1M, 3M, 6M, 12M) and rejects malformed keys', () => {
    const valid6M = parseAndValidateLicenseKey('lic-6m-pro7-5520');
    expect(valid6M.valid).toBe(true);
    expect(valid6M.normalizedKey).toBe('LIC-6M-PRO7-5520');
    expect(valid6M.months).toBe(6);
    expect(valid6M.plan?.days).toBe(180);

    const valid12M = parseAndValidateLicenseKey('LIC-12M-IND1-9900');
    expect(valid12M.valid).toBe(true);
    expect(valid12M.months).toBe(12);
    expect(valid12M.plan?.days).toBe(365);

    const invalid = parseAndValidateLicenseKey('LIC-9M-XXXX-YYYY');
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toBeDefined();
  });

  it('accumulates remaining active or trial days when activating a new license (zero lost days)', () => {
    const fixedNow = new Date('2026-11-10T12:00:00.000Z');
    // Tenant still has 12 days remaining
    const activeValidTo = new Date(
      fixedNow.getTime() + 12 * 24 * 60 * 60 * 1000
    ).toISOString();

    const accumulated = calculateAccumulatedValidity(
      activeValidTo,
      180,
      fixedNow
    );
    expect(accumulated.totalDaysRemaining).toBe(192);

    // Expired tenant (-5 days) starts from fixedNow and gets exact 30 days
    const expiredValidTo = new Date(
      fixedNow.getTime() - 5 * 24 * 60 * 60 * 1000
    ).toISOString();
    const renewedFromExpired = calculateAccumulatedValidity(
      expiredValidTo,
      30,
      fixedNow
    );
    expect(renewedFromExpired.totalDaysRemaining).toBe(30);
  });

  it('evaluates can_operate accurately across active, expiring trial, and expired scenarios', () => {
    const fixedNow = new Date('2026-11-10T12:00:00.000Z');

    const activeSession = buildPresetSession('active_pro', fixedNow);
    const activeStatus = buildLicenseStatusFromRecord({
      tenantId: activeSession.globalTenantId,
      planCode: activeSession.planCode,
      isTrial: activeSession.isTrial,
      validFromIso: activeSession.validFromIso,
      validToIso: activeSession.validToIso,
      now: fixedNow,
    });
    expect(activeStatus.can_operate).toBe(true);
    expect(activeStatus.status).toBe('active');
    expect(activeStatus.days_remaining).toBe(165);

    const expiredSession = buildPresetSession('expired_blocked', fixedNow);
    const expiredStatus = buildLicenseStatusFromRecord({
      tenantId: expiredSession.globalTenantId,
      planCode: expiredSession.planCode,
      isTrial: expiredSession.isTrial,
      validFromIso: expiredSession.validFromIso,
      validToIso: expiredSession.validToIso,
      now: fixedNow,
    });
    expect(expiredStatus.can_operate).toBe(false);
    expect(expiredStatus.status).toBe('expired');
    expect(expiredStatus.days_remaining).toBe(0);
  });

  it('serializes and parses HttpOnly session payloads reliably', () => {
    const session = buildPresetSession('expiring_trial');
    const encoded = serializeSessionCookie(session);
    const decoded = parseSessionCookie(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe(session.email);
    expect(decoded?.globalTenantId).toBe(session.globalTenantId);
    expect(decoded?.isTrial).toBe(true);
  });
});
