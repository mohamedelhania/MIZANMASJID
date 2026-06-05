-- ═══════════════════════════════════════════════════════════
-- MizanMasjid Multi-Tenant Schema
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'gerente', 'profesorado', 'supervisor');
CREATE TYPE public.currency_code AS ENUM ('EUR', 'MAD', 'USD', 'GBP', 'SAR', 'TRY', 'DZD', 'TND');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE public.mosque_status AS ENUM ('pending', 'active', 'suspended');

-- ─── Mosques ─────────────────────────────────────────────
CREATE TABLE public.mosques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  lat NUMERIC(10, 6),
  lng NUMERIC(10, 6),
  contact_phone TEXT,
  contact_email TEXT,
  bank_account TEXT,
  currency currency_code NOT NULL DEFAULT 'EUR',
  initial_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  classes_paid BOOLEAN NOT NULL DEFAULT FALSE,
  status mosque_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Mosque fixed config (dynamic expenses/incomes) ─────
CREATE TABLE public.mosque_fixed_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  config_type TEXT NOT NULL CHECK (config_type IN ('rent','water','electricity','income')),
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

-- ─── Profiles ────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── User Roles ──────────────────────────────────────────
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id UUID REFERENCES public.mosques(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, mosque_id, role)
);

-- ─── Classrooms ──────────────────────────────────────────
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.classroom_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (classroom_id, user_id)
);

-- ─── Students ────────────────────────────────────────────
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  address TEXT,
  photo_url TEXT,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.student_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  year INT NOT NULL,
  trimester SMALLINT NOT NULL CHECK (trimester BETWEEN 1 AND 3),
  grade NUMERIC(5,2),
  UNIQUE (student_id, year, trimester)
);

CREATE TABLE public.student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.student_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (student_id, year, month)
);

CREATE TABLE public.student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  grade NUMERIC(5,2),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, classroom_id, date)
);

-- ─── Financial tables ────────────────────────────────────
CREATE TABLE public.shart_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  year INT NOT NULL,
  monthly_amount NUMERIC(10,2) NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shart_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID NOT NULL REFERENCES public.shart_contributors(id) ON DELETE CASCADE,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (contributor_id, month)
);

CREATE TABLE public.fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (mosque_id, year, month, category)
);

CREATE TABLE public.variable_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fixed_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (mosque_id, year, month, category)
);

CREATE TABLE public.jumuah_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  friday_number SMALLINT NOT NULL CHECK (friday_number BETWEEN 1 AND 6),
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (mosque_id, year, month, friday_number)
);

CREATE TABLE public.ramadan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  year INT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('donation','collection','expense')),
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- Helper Functions
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin' AND mosque_id IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_for_mosque(_mosque_id UUID)
RETURNS app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = auth.uid()
    AND (mosque_id = _mosque_id OR (role = 'super_admin' AND mosque_id IS NULL))
  ORDER BY CASE role WHEN 'super_admin' THEN 0 WHEN 'gerente' THEN 1 WHEN 'profesorado' THEN 2 WHEN 'supervisor' THEN 3 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Trigger: new user gets a profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, FALSE)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
