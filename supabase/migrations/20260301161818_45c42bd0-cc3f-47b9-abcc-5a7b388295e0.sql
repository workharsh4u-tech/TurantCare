
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'diagnostic_center', 'hospital_admin');

-- Create doctor sub-role enum
CREATE TYPE public.doctor_role_type AS ENUM ('doctor_self_clinic', 'hospital_admin', 'hospital_doctor');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  card_number TEXT NOT NULL UNIQUE DEFAULT 'TC-' || substr(gen_random_uuid()::text, 1, 8),
  chip_id TEXT UNIQUE,
  pin_hash TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  diabetes BOOLEAN DEFAULT false,
  photo_url TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own record" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can update own record" ON public.patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own record" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can lookup by card" ON public.patients FOR SELECT TO authenticated USING (true);

-- Hospitals table
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view hospitals" ON public.hospitals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage hospital" ON public.hospitals FOR ALL USING (auth.uid() = admin_user_id);

-- Doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role_type doctor_role_type NOT NULL DEFAULT 'doctor_self_clinic',
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  specialization TEXT,
  email TEXT,
  phone TEXT,
  doctor_code TEXT UNIQUE DEFAULT 'DR-' || substr(gen_random_uuid()::text, 1, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors can view own record" ON public.doctors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Doctors can update own record" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Doctors can insert own record" ON public.doctors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view doctors" ON public.doctors FOR SELECT TO authenticated USING (true);

-- Diagnostic centers table
CREATE TABLE public.diagnostic_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  address TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diagnostic_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DC can view own record" ON public.diagnostic_centers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "DC can update own record" ON public.diagnostic_centers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "DC can insert own record" ON public.diagnostic_centers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can view DCs" ON public.diagnostic_centers FOR SELECT TO authenticated USING (true);

-- Report files table
CREATE TABLE public.report_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date_group DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  report_type TEXT,
  uploaded_by_role TEXT NOT NULL,
  uploaded_by_id UUID NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.report_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own reports" ON public.report_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients WHERE patients.id = report_files.patient_id AND patients.user_id = auth.uid())
);
CREATE POLICY "Patient can update own reports" ON public.report_files FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.patients WHERE patients.id = report_files.patient_id AND patients.user_id = auth.uid())
);
CREATE POLICY "Authenticated can insert reports" ON public.report_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can view non-private reports" ON public.report_files FOR SELECT TO authenticated USING (is_private = false);

-- Access logs table
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  accessed_by_role TEXT NOT NULL,
  accessed_by_id UUID NOT NULL,
  accessed_by_name TEXT,
  action TEXT NOT NULL DEFAULT 'view',
  report_file_id UUID REFERENCES public.report_files(id) ON DELETE SET NULL,
  date_group DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patient can view own logs" ON public.access_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.patients WHERE patients.id = access_logs.patient_id AND patients.user_id = auth.uid())
);
CREATE POLICY "Authenticated can insert logs" ON public.access_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Accessor can view own logs" ON public.access_logs FOR SELECT TO authenticated USING (accessed_by_id = auth.uid());

-- AI summaries table
CREATE TABLE public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date_group DATE NOT NULL,
  summary_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, date_group)
);
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view summaries" ON public.ai_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can upsert summaries" ON public.ai_summaries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update summaries" ON public.ai_summaries FOR UPDATE TO authenticated USING (true);

-- Storage bucket for medical reports
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-reports', 'medical-reports', true);
CREATE POLICY "Authenticated can upload reports" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'medical-reports');
CREATE POLICY "Authenticated can view reports" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'medical-reports');
CREATE POLICY "Anyone can view reports" ON storage.objects FOR SELECT USING (bucket_id = 'medical-reports');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient')
  );
  
  -- If patient, create patient record
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'patient' THEN
    INSERT INTO public.patients (user_id, name, pin_hash)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '');
  END IF;
  
  -- If doctor, create doctor record
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'doctor' THEN
    INSERT INTO public.doctors (user_id, name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  END IF;
  
  -- If diagnostic_center, create DC record
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'diagnostic_center' THEN
    INSERT INTO public.diagnostic_centers (user_id, name, email)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  END IF;

  -- If hospital_admin, create hospital + doctor record
  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'hospital_admin' THEN
    INSERT INTO public.hospitals (name, admin_user_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'hospital_name', 'My Hospital'), NEW.id);
    
    INSERT INTO public.doctors (user_id, name, email, role_type)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'hospital_admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PIN verification function (security definer to access pin_hash)
CREATE OR REPLACE FUNCTION public.verify_patient_pin(p_patient_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT pin_hash INTO stored_hash FROM public.patients WHERE id = p_patient_id;
  IF stored_hash IS NULL OR stored_hash = '' THEN
    RETURN false;
  END IF;
  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$;

-- Enable pgcrypto for PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to set patient PIN
CREATE OR REPLACE FUNCTION public.set_patient_pin(p_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.patients 
  SET pin_hash = crypt(p_pin, gen_salt('bf'))
  WHERE user_id = auth.uid();
END;
$$;
