-- CTO MVP hardening: temporary PINs, private storage paths, visit notes, and contact capture.

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS temp_pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS temp_pin_expires_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

UPDATE public.profiles
SET verification_status = 'verified'
WHERE role = 'patient' AND verification_status = 'pending';

ALTER TABLE public.report_files
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  medicines TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  follow_up TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patient can view own visits" ON public.visits;
CREATE POLICY "Patient can view own visits" ON public.visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = visits.patient_id
      AND patients.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated doctors can add visits" ON public.visits;
CREATE POLICY "Authenticated doctors can add visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'doctor')
    OR public.has_role(auth.uid(), 'hospital_admin')
  );

DROP POLICY IF EXISTS "Authenticated doctors can view visits" ON public.visits;
CREATE POLICY "Authenticated doctors can view visits" ON public.visits
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'doctor')
    OR public.has_role(auth.uid(), 'hospital_admin')
  );

CREATE OR REPLACE FUNCTION public.generate_patient_temp_pin(p_minutes integer DEFAULT 15)
RETURNS TABLE(pin text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  generated_pin TEXT;
  generated_expiry TIMESTAMPTZ;
BEGIN
  generated_pin := lpad(floor(random() * 1000000)::text, 6, '0');
  generated_expiry := now() + make_interval(mins => greatest(1, least(coalesce(p_minutes, 15), 30)));

  UPDATE public.patients
  SET temp_pin_hash = crypt(generated_pin, gen_salt('bf')),
      temp_pin_expires_at = generated_expiry
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient profile not found for current user';
  END IF;

  RETURN QUERY SELECT generated_pin, generated_expiry;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_patient_pin(p_patient_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  stored_hash TEXT;
  expiry TIMESTAMPTZ;
BEGIN
  SELECT temp_pin_hash, temp_pin_expires_at
  INTO stored_hash, expiry
  FROM public.patients
  WHERE id = p_patient_id;

  IF stored_hash IS NULL OR stored_hash = '' OR expiry IS NULL OR expiry <= now() THEN
    RETURN false;
  END IF;

  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, phone, verification_status, organization_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    CASE
      WHEN COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'patient'
      THEN 'verified'
      ELSE 'pending'
    END,
    COALESCE(NEW.raw_user_meta_data->>'hospital_name', NEW.raw_user_meta_data->>'organization_name')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient')
  );

  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'patient' THEN
    INSERT INTO public.patients (user_id, name, email, phone, pin_hash)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      ''
    );
  END IF;

  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'doctor' THEN
    INSERT INTO public.doctors (user_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;

  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'diagnostic_center' THEN
    INSERT INTO public.diagnostic_centers (user_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;

  IF COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient') = 'hospital_admin' THEN
    INSERT INTO public.hospitals (name, admin_user_id)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'hospital_name', 'My Hospital'), NEW.id);

    INSERT INTO public.doctors (user_id, name, email, phone, role_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      'hospital_admin'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

UPDATE storage.buckets
SET public = false
WHERE id = 'medical-reports';

DROP POLICY IF EXISTS "Anyone can view reports" ON storage.objects;

GRANT EXECUTE ON FUNCTION public.generate_patient_temp_pin(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_patient_pin(uuid, text) TO authenticated;
