-- 1. Añadir campos DNI/NIE a la tabla de alumnos
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS student_dni TEXT,
ADD COLUMN IF NOT EXISTS tutor_dni TEXT;

-- 2. Añadir meses inactivos a la tabla de aulas
ALTER TABLE public.classrooms
ADD COLUMN IF NOT EXISTS inactive_months SMALLINT[] DEFAULT '{}';

-- 3. Crear tabla para ingresos variables (Otros ingresos)
CREATE TABLE IF NOT EXISTS public.variable_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mosque_id UUID NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  concept TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asegurarse de que el RLS permita el acceso (si está activado) a la nueva tabla
ALTER TABLE public.variable_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variable incomes of their mosque"
ON public.variable_incomes FOR SELECT
TO authenticated
USING (
  mosque_id IN (
    SELECT m.id FROM public.mosques m
    JOIN public.user_roles ur ON ur.mosque_id = m.id
    WHERE ur.user_id = auth.uid()
  ) OR public.is_super_admin()
);

CREATE POLICY "Gerente and Super Admin can insert variable incomes"
ON public.variable_incomes FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role_for_mosque(mosque_id) IN ('super_admin', 'gerente', 'supervisor')
);

CREATE POLICY "Gerente and Super Admin can update variable incomes"
ON public.variable_incomes FOR UPDATE
TO authenticated
USING (
  public.get_user_role_for_mosque(mosque_id) IN ('super_admin', 'gerente', 'supervisor')
);

CREATE POLICY "Gerente and Super Admin can delete variable incomes"
ON public.variable_incomes FOR DELETE
TO authenticated
USING (
  public.get_user_role_for_mosque(mosque_id) IN ('super_admin', 'gerente', 'supervisor')
);
