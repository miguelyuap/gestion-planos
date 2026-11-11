-- ============================================================================
-- GST-SOFTWARE OFFICIAL DATABASE MIGRATION
-- Application: GST-PLANOS 3D (app_gestion_planos)
-- Standards: DATABASE_STANDARD.md, SECURITY_STANDARD.md & Supabase Best Practices
-- ============================================================================

-- 1. Tabla de Empresas / Talleres (Tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    global_tenant_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    nit_or_tax_id TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    plan_code TEXT NOT NULL DEFAULT 'trial',
    license_status TEXT NOT NULL DEFAULT 'trial',
    is_trial BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    valid_to TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days') NOT NULL,
    last_license_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Tabla de Perfiles de Usuario vinculados a Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'engineer', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Tabla de Historial Acumulativo de Activaciones de Licencia
CREATE TABLE IF NOT EXISTS public.license_activations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    license_key TEXT NOT NULL,
    plan_code TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    months_added INTEGER NOT NULL CHECK (months_added >= 0),
    days_added INTEGER NOT NULL CHECK (days_added > 0),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Tabla de Planos 3D Guardados por Tenant
CREATE TABLE IF NOT EXISTS public.saved_blueprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    params JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ÍNDICES EN CLAVES FORÁNEAS (Postgres Performance Best Practices)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_license_activations_tenant_id ON public.license_activations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_blueprints_tenant_id ON public.saved_blueprints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_blueprints_created_by ON public.saved_blueprints(created_by);

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) OBLIGATORIO EN TODAS LAS TABLAS
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_blueprints ENABLE ROW LEVEL SECURITY;

-- Políticas para public.profiles
CREATE POLICY "profiles_select_own_or_same_tenant"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())
    OR tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- Políticas para public.tenants
CREATE POLICY "tenants_select_own"
ON public.tenants
FOR SELECT
TO authenticated
USING (
    id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "tenants_insert_on_signup"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "tenants_update_owner"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
    id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'owner')
)
WITH CHECK (
    id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.role = 'owner')
);

-- Políticas para public.license_activations
CREATE POLICY "license_activations_select_tenant"
ON public.license_activations
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "license_activations_insert_tenant"
ON public.license_activations
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

-- Políticas para public.saved_blueprints
CREATE POLICY "saved_blueprints_select_tenant"
ON public.saved_blueprints
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "saved_blueprints_insert_tenant"
ON public.saved_blueprints
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "saved_blueprints_update_tenant"
ON public.saved_blueprints
FOR UPDATE
TO authenticated
USING (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
)
WITH CHECK (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);

CREATE POLICY "saved_blueprints_delete_tenant"
ON public.saved_blueprints
FOR DELETE
TO authenticated
USING (
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = (SELECT auth.uid()))
);
