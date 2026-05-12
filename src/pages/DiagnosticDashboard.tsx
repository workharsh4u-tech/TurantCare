import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import CardInput from "@/components/CardInput";
import PatientAccessPanel from "@/components/PatientAccessPanel";
import ReportViewer from "@/components/ReportViewer";
import ReportUploader from "@/components/ReportUploader";
import { Building2, Upload, BarChart3, Users, CreditCard } from "lucide-react";

export default function DiagnosticDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"access" | "analytics">("access");
  const [patient, setPatient] = useState<any>(null);
  const [showReports, setShowReports] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [todayUploads, setTodayUploads] = useState(0);
  const [todayPatients, setTodayPatients] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, count } = await supabase
      .from("report_files")
      .select("*", { count: "exact" })
      .eq("uploaded_by_id", user!.id)
      .gte("created_at", today);
    setTodayUploads(count || 0);

    // Unique patients today
    const { data: logs } = await supabase
      .from("access_logs")
      .select("*")
      .eq("accessed_by_id", user!.id)
      .gte("created_at", today);
    setTodayPatients(logs || []);
  };

  const navItems = [
    { label: "Access Patient", icon: <CreditCard className="w-4 h-4" />, active: tab === "access", onClick: () => setTab("access") },
    { label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, active: tab === "analytics", onClick: () => setTab("analytics") },
  ];

  return (
    <DashboardLayout title="Diagnostic Center" subtitle="Upload and manage patient reports" nav={navItems}>
      {tab === "access" && (
        <div className="max-w-lg">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Access Patient
            </h3>
            <CardInput onPatientFound={setPatient} />
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold mb-1">Today's Uploads</h3>
            <p className="text-4xl font-bold text-primary">{todayUploads}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Patients Served Today
            </h3>
            <p className="text-2xl font-bold">{todayPatients.length}</p>
          </div>
        </div>
      )}

      {patient && !showReports && !showUploader && (
        <PatientAccessPanel
          patient={patient}
          allowUploadWithoutPin={true}
          onUpload={() => setShowUploader(true)}
          onViewReports={() => setShowReports(true)}
          onClose={() => setPatient(null)}
        />
      )}

      {showReports && patient && (
        <ReportViewer
          patientId={patient.id}
          accessedByRole="diagnostic_center"
          onClose={() => { setShowReports(false); setPatient(null); }}
        />
      )}

      {showUploader && patient && (
        <ReportUploader
          patientId={patient.id}
          uploadedByRole="diagnostic_center"
          onClose={() => { setShowUploader(false); setPatient(null); }}
          onSuccess={() => { loadAnalytics(); }}
        />
      )}
    </DashboardLayout>
  );
}
