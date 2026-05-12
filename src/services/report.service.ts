import { supabase } from "@/integrations/supabase/client";
import { REPORT_FILE_SIGNED_URL_TTL_SECONDS } from "@/lib/reportRetention";

export async function getPatientReports(patientId: string, showPrivate: boolean) {
  let query = supabase
    .from("report_files")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (!showPrivate) {
    query = query.eq("is_private", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  return Promise.all(
    (data || []).map(async (report) => {
      if (!("storage_path" in report) || !report.storage_path) return report;
      const { data: signed } = await supabase.storage
        .from("medical-reports")
        .createSignedUrl(report.storage_path as string, REPORT_FILE_SIGNED_URL_TTL_SECONDS);
      return signed?.signedUrl ? { ...report, file_url: signed.signedUrl } : report;
    })
  );
}

export async function logPatientAction(patientId: string, accessedByRole: string, accessedById: string, action: string) {
  await supabase.from("access_logs").insert({
    patient_id: patientId,
    accessed_by_role: accessedByRole,
    accessed_by_id: accessedById,
    action,
  });
}

export async function logReportAccess(patientId: string, accessedByRole: string, accessedById: string) {
  return logPatientAction(patientId, accessedByRole, accessedById, "view");
}

export async function getPatientVisits(patientId: string) {
  const { data, error } = await supabase
    .from("visits" as never)
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addVisitNote(input: {
  patientId: string;
  doctorId: string;
  diagnosis: string;
  medicines: string[];
  notes?: string;
  followUp?: string;
}) {
  const { error } = await supabase.from("visits" as never).insert({
    patient_id: input.patientId,
    doctor_id: input.doctorId,
    diagnosis: input.diagnosis,
    medicines: input.medicines,
    notes: input.notes || null,
    follow_up: input.followUp || null,
  } as never);

  if (error) throw error;
}

export async function getExistingSummary(patientId: string, dateGroup: string) {
  const { data } = await supabase
    .from("ai_summaries")
    .select("*")
    .eq("patient_id", patientId)
    .eq("date_group", dateGroup)
    .maybeSingle();

  return data;
}

export async function generateClinicalSummary(patientId: string, dateGroup: string, reportNames: string[], reportUrl?: string) {
  const { data, error } = await supabase.functions.invoke("ai-summary", {
    body: { patientId, dateGroup, reportNames, reportUrl },
  });

  if (error) throw error;
  return data;
}

export async function storeClinicalSummary(patientId: string, dateGroup: string, summaryText: string) {
  await supabase.from("ai_summaries").upsert(
    {
      patient_id: patientId,
      date_group: dateGroup,
      summary_text: summaryText,
    },
    { onConflict: "patient_id,date_group" }
  );
}
