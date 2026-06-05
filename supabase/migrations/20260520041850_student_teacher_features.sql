-- Add new columns to classrooms
ALTER TABLE public.classrooms
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add new columns to students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS tutor_name text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS classroom_id uuid REFERENCES public.classrooms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS monthly_fee numeric NOT NULL DEFAULT 0;

-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
    classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    title text NOT NULL,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create exam_grades table
CREATE TABLE IF NOT EXISTS public.exam_grades (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    score numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(exam_id, student_id)
);

-- Create homework table
CREATE TABLE IF NOT EXISTS public.homework (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
    classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create homework_submissions table
CREATE TABLE IF NOT EXISTS public.homework_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending', -- pending, completed, missing
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(homework_id, student_id)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    mosque_id uuid NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
    classroom_id uuid NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date date NOT NULL,
    status text NOT NULL DEFAULT 'present', -- present, absent, late
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(classroom_id, student_id, date)
);

-- RLS Policies for new tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Simple policies (same logic as other mosque-scoped tables)
CREATE POLICY "Users can access exams of their mosques" ON public.exams
    FOR ALL USING (mosque_id IN (SELECT mosque_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access exam_grades of their mosques" ON public.exam_grades
    FOR ALL USING (
        exam_id IN (
            SELECT id FROM public.exams WHERE mosque_id IN (
                SELECT mosque_id FROM user_roles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can access homework of their mosques" ON public.homework
    FOR ALL USING (mosque_id IN (SELECT mosque_id FROM user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access homework_submissions of their mosques" ON public.homework_submissions
    FOR ALL USING (
        homework_id IN (
            SELECT id FROM public.homework WHERE mosque_id IN (
                SELECT mosque_id FROM user_roles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can access attendance of their mosques" ON public.attendance
    FOR ALL USING (mosque_id IN (SELECT mosque_id FROM user_roles WHERE user_id = auth.uid()));

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Create policy for public access to avatars
CREATE POLICY "Public avatars access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Create policy for authenticated users to upload avatars
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to update their avatars
CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to delete avatars
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
