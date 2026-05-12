
CREATE OR REPLACE FUNCTION public.set_pin_admin(p_user_id uuid, p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.patients 
  SET pin_hash = crypt(p_pin, gen_salt('bf'))
  WHERE user_id = p_user_id;
END;
$$;
