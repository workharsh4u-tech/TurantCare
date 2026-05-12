-- Add RPC functions to allow approving and rejecting users securely
-- This bypasses RLS for profiles table but can be restricted if needed.

CREATE OR REPLACE FUNCTION public.approve_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = 'verified'
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reject_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET verification_status = 'rejected'
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
