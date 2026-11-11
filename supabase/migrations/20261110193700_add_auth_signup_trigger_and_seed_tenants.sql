-- ============================================================================
-- GST-SOFTWARE OFFICIAL DATABASE MIGRATION #2
-- Trigger automático en auth.users + Semilla de Tenants Demostrativos
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tenant_id UUID;
    v_business_name TEXT;
    v_slug TEXT;
    v_full_name TEXT;
    v_nit TEXT;
    v_phone TEXT;
BEGIN
    v_business_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'business_name'), ''), 'Taller Estructural CAD');
    v_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1));
    v_nit := COALESCE(NEW.raw_user_meta_data->>'nit_or_tax_id', '900.000.000-1');
    v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '3000000000');
    v_slug := lower(regexp_replace(v_business_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(NEW.id::text, 1, 6);

    INSERT INTO public.tenants (
        name,
        slug,
        nit_or_tax_id,
        email,
        phone,
        plan_code,
        license_status,
        is_trial,
        valid_from,
        valid_to,
        last_license_key
    ) VALUES (
        v_business_name,
        v_slug,
        v_nit,
        NEW.email,
        v_phone,
        'trial',
        'trial',
        true,
        NOW(),
        NOW() + INTERVAL '15 days',
        'TRIAL-15D-INICIAL'
    )
    RETURNING id INTO v_tenant_id;

    INSERT INTO public.profiles (
        id,
        tenant_id,
        full_name,
        email,
        role
    ) VALUES (
        NEW.id,
        v_tenant_id,
        v_full_name,
        NEW.email,
        'owner'
    );

    INSERT INTO public.license_activations (
        tenant_id,
        license_key,
        plan_code,
        plan_name,
        months_added,
        days_added,
        valid_from,
        valid_to
    ) VALUES (
        v_tenant_id,
        'TRIAL-15D-INICIAL',
        'trial',
        'Período de Prueba (15 Días)',
        0,
        15,
        NOW(),
        NOW() + INTERVAL '15 days'
    );

    RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_registration() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_registration();

INSERT INTO public.tenants (
    id,
    global_tenant_id,
    name,
    slug,
    nit_or_tax_id,
    email,
    phone,
    plan_code,
    license_status,
    is_trial,
    valid_from,
    valid_to,
    last_license_key
) VALUES
(
    'c0a80101-1234-4678-90ab-cdef12345601',
    'c0a80101-1234-4678-90ab-cdef12345601',
    'Estructuras & Carpintería El Roble S.A.S.',
    'estructuras-el-roble',
    '901.452.881-3',
    'ingenieria@elroble.co',
    '3004518890',
    'semiannual',
    'active',
    false,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '165 days',
    'LIC-6M-PRO7-5520'
),
(
    'c0a80101-1234-4678-90ab-cdef12345602',
    'c0a80101-1234-4678-90ab-cdef12345602',
    'Diseño Modular Andino Ltda.',
    'diseno-modular-andino',
    '900.812.334-9',
    'proyectos@modularandino.co',
    '3157894412',
    'trial',
    'trial',
    true,
    NOW() - INTERVAL '10 days',
    NOW() + INTERVAL '5 days',
    'TRIAL-15D-INICIAL'
),
(
    'c0a80101-1234-4678-90ab-cdef12345603',
    'c0a80101-1234-4678-90ab-cdef12345603',
    'Metalmecánica Industrial del Valle',
    'metalmecanica-del-valle',
    '890.312.990-1',
    'gerencia@metalvalle.co',
    '3109981122',
    'monthly',
    'expired',
    false,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '5 days',
    'LIC-1M-OLD1-2025'
)
ON CONFLICT (global_tenant_id) DO NOTHING;
