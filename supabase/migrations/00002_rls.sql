-- ═══════════════════════════════════════════════════════════
-- RLS Policies for MizanMasjid
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosque_fixed_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shart_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shart_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jumuah_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramadan_entries ENABLE ROW LEVEL SECURITY;

-- Mosques
CREATE POLICY "public_insert_mosque" ON public.mosques FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "auth_read_own_mosque" ON public.mosques FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND mosque_id IS NOT NULL));
CREATE POLICY "super_admin_all_mosques" ON public.mosques FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "gerente_update_mosque" ON public.mosques FOR UPDATE TO authenticated
  USING (id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

-- Mosque fixed config
CREATE POLICY "auth_read_config" ON public.mosque_fixed_config FOR SELECT TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND mosque_id IS NOT NULL));
CREATE POLICY "admin_manage_config" ON public.mosque_fixed_config FOR ALL TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'))
  WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

-- Profiles
CREATE POLICY "auth_read_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles
CREATE POLICY "auth_read_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT ur2.mosque_id FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid() AND ur2.role = 'gerente'));
CREATE POLICY "admin_update_roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT ur2.mosque_id FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid() AND ur2.role = 'gerente'));
CREATE POLICY "admin_delete_roles" ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT ur2.mosque_id FROM public.user_roles ur2 WHERE ur2.user_id = auth.uid() AND ur2.role = 'gerente'));

-- Classrooms
CREATE POLICY "auth_read_classrooms" ON public.classrooms FOR SELECT TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND mosque_id IS NOT NULL));
CREATE POLICY "admin_manage_classrooms" ON public.classrooms FOR ALL TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'))
  WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

-- Classroom teachers
CREATE POLICY "auth_read_ct" ON public.classroom_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_manage_ct" ON public.classroom_teachers FOR ALL TO authenticated
  USING (public.is_super_admin() OR classroom_id IN (SELECT c.id FROM public.classrooms c JOIN public.user_roles ur ON ur.mosque_id = c.mosque_id WHERE ur.user_id = auth.uid() AND ur.role = 'gerente'))
  WITH CHECK (public.is_super_admin() OR classroom_id IN (SELECT c.id FROM public.classrooms c JOIN public.user_roles ur ON ur.mosque_id = c.mosque_id WHERE ur.user_id = auth.uid() AND ur.role = 'gerente'));

-- Students
CREATE POLICY "read_students" ON public.students FOR SELECT TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','profesorado')));
CREATE POLICY "manage_students" ON public.students FOR ALL TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','profesorado')))
  WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','profesorado')));

-- Student related (grades, notes, payments, assignments)
CREATE POLICY "all_student_grades" ON public.student_grades FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')))
  WITH CHECK (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')));

CREATE POLICY "all_student_notes" ON public.student_notes FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')))
  WITH CHECK (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')));

CREATE POLICY "all_student_payments" ON public.student_payments FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')))
  WITH CHECK (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')));

CREATE POLICY "all_student_assignments" ON public.student_assignments FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')))
  WITH CHECK (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')));

CREATE POLICY "all_attendance" ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')))
  WITH CHECK (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.students s JOIN public.user_roles ur ON ur.mosque_id = s.mosque_id WHERE s.id = student_id AND ur.user_id = auth.uid() AND ur.role IN ('gerente','profesorado')));

-- Financial: gerente + supervisor can read, only gerente can modify
CREATE POLICY "read_shart_contributors" ON public.shart_contributors FOR SELECT TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','supervisor')));
CREATE POLICY "manage_shart_contributors" ON public.shart_contributors FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));
CREATE POLICY "update_shart_contributors" ON public.shart_contributors FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));
CREATE POLICY "delete_shart_contributors" ON public.shart_contributors FOR DELETE TO authenticated
  USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

CREATE POLICY "read_shart_payments" ON public.shart_payments FOR SELECT TO authenticated
  USING (public.is_super_admin() OR contributor_id IN (SELECT sc.id FROM public.shart_contributors sc JOIN public.user_roles ur ON ur.mosque_id = sc.mosque_id WHERE ur.user_id = auth.uid()));
CREATE POLICY "manage_shart_payments" ON public.shart_payments FOR ALL TO authenticated
  USING (public.is_super_admin() OR contributor_id IN (SELECT sc.id FROM public.shart_contributors sc JOIN public.user_roles ur ON ur.mosque_id = sc.mosque_id WHERE ur.user_id = auth.uid() AND ur.role = 'gerente'))
  WITH CHECK (public.is_super_admin() OR contributor_id IN (SELECT sc.id FROM public.shart_contributors sc JOIN public.user_roles ur ON ur.mosque_id = sc.mosque_id WHERE ur.user_id = auth.uid() AND ur.role = 'gerente'));

-- Fixed expenses, variable expenses, fixed incomes, jumuah, ramadan
CREATE POLICY "read_fixed_expenses" ON public.fixed_expenses FOR SELECT TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','supervisor')));
CREATE POLICY "manage_fixed_expenses" ON public.fixed_expenses FOR ALL TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente')) WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

CREATE POLICY "read_variable_expenses" ON public.variable_expenses FOR SELECT TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','supervisor')));
CREATE POLICY "manage_variable_expenses" ON public.variable_expenses FOR ALL TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente')) WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

CREATE POLICY "read_fixed_incomes" ON public.fixed_incomes FOR SELECT TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','supervisor')));
CREATE POLICY "manage_fixed_incomes" ON public.fixed_incomes FOR ALL TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente')) WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

CREATE POLICY "read_jumuah" ON public.jumuah_collections FOR SELECT TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','supervisor')));
CREATE POLICY "manage_jumuah" ON public.jumuah_collections FOR ALL TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente')) WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

CREATE POLICY "read_ramadan" ON public.ramadan_entries FOR SELECT TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('gerente','supervisor')));
CREATE POLICY "manage_ramadan" ON public.ramadan_entries FOR ALL TO authenticated USING (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente')) WITH CHECK (public.is_super_admin() OR mosque_id IN (SELECT mosque_id FROM public.user_roles WHERE user_id = auth.uid() AND role = 'gerente'));

-- Storage bucket for student photos
INSERT INTO storage.buckets (id, name, public) VALUES ('student-photos', 'student-photos', true) ON CONFLICT DO NOTHING;
CREATE POLICY "auth_upload_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-photos');
CREATE POLICY "auth_update_photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'student-photos');
CREATE POLICY "public_read_photos" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'student-photos');
CREATE POLICY "auth_read_photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'student-photos');
