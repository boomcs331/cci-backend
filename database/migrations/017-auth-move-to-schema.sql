-- Move auth-related tables from public to auth schema
-- This keeps operational data while isolating auth domain objects.

CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  -- move enum type first so moved tables keep enum in auth schema
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'role_scope_type_enum' AND n.nspname = 'public'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'role_scope_type_enum' AND n.nspname = 'auth'
  ) THEN
    ALTER TYPE public.role_scope_type_enum SET SCHEMA auth;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND to_regclass('auth.users') IS NULL THEN
    ALTER TABLE public.users SET SCHEMA auth;
  END IF;

  IF to_regclass('public.roles') IS NOT NULL AND to_regclass('auth.roles') IS NULL THEN
    ALTER TABLE public.roles SET SCHEMA auth;
  END IF;

  IF to_regclass('public.permissions') IS NOT NULL AND to_regclass('auth.permissions') IS NULL THEN
    ALTER TABLE public.permissions SET SCHEMA auth;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL AND to_regclass('auth.user_roles') IS NULL THEN
    ALTER TABLE public.user_roles SET SCHEMA auth;
  END IF;

  IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('auth.role_permissions') IS NULL THEN
    ALTER TABLE public.role_permissions SET SCHEMA auth;
  END IF;

  IF to_regclass('public.departments') IS NOT NULL AND to_regclass('auth.departments') IS NULL THEN
    ALTER TABLE public.departments SET SCHEMA auth;
  END IF;

  IF to_regclass('public.user_role_assignments') IS NOT NULL AND to_regclass('auth.user_role_assignments') IS NULL THEN
    ALTER TABLE public.user_role_assignments SET SCHEMA auth;
  END IF;
END $$;

-- Move legacy sequences if they remain in public after table move.
DO $$
BEGIN
  IF to_regclass('public.users_id_seq') IS NOT NULL AND to_regclass('auth.users_id_seq') IS NULL THEN
    ALTER SEQUENCE public.users_id_seq SET SCHEMA auth;
  END IF;
  IF to_regclass('public.roles_id_seq') IS NOT NULL AND to_regclass('auth.roles_id_seq') IS NULL THEN
    ALTER SEQUENCE public.roles_id_seq SET SCHEMA auth;
  END IF;
  IF to_regclass('public.permissions_id_seq') IS NOT NULL AND to_regclass('auth.permissions_id_seq') IS NULL THEN
    ALTER SEQUENCE public.permissions_id_seq SET SCHEMA auth;
  END IF;
  IF to_regclass('public.departments_id_seq') IS NOT NULL AND to_regclass('auth.departments_id_seq') IS NULL THEN
    ALTER SEQUENCE public.departments_id_seq SET SCHEMA auth;
  END IF;
  IF to_regclass('public.user_role_assignments_id_seq') IS NOT NULL
    AND to_regclass('auth.user_role_assignments_id_seq') IS NULL THEN
    ALTER SEQUENCE public.user_role_assignments_id_seq SET SCHEMA auth;
  END IF;
END $$;
