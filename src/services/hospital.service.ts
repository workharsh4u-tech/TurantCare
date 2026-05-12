import { supabase } from "@/integrations/supabase/client";

export async function getHospitalByAdmin(adminUserId: string) {
  const { data, error } = await supabase
    .from("hospitals")
    .select("*")
    .eq("admin_user_id", adminUserId)
    .single();

  if (error) throw error;
  return data;
}

export async function getHospitalDoctors(hospitalId: string) {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("hospital_id", hospitalId);

  if (error) throw error;
  return data || [];
}

export async function createHospitalDoctor(payload: {
  email: string;
  password: string;
  fullName: string;
  specialization: string;
  hospitalId: string;
}) {
  const { data, error } = await supabase.functions.invoke("create-hospital-doctor", {
    body: payload,
  });

  if (error) throw error;
  return data;
}
