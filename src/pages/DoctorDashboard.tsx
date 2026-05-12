import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import CardInput from "@/components/CardInput";
import PatientAccessPanel from "@/components/PatientAccessPanel";
import ReportViewer from "@/components/ReportViewer";
import ReportUploader from "@/components/ReportUploader";
import VisitNoteForm from "@/components/VisitNoteForm";
import { Stethoscope, Users, BarChart3, CreditCard } from "lucide-react";

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"scan" | "analytics">("scan");
  const [patient, setPatient] = useState<any>(null);
  const [showReports, setShowReports] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showVisitNote, setShowVisitNote] = useState(false);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("access_logs")
      .select("*")
      .eq("accessed_by_id", user!.id)
      .gte("created_at", today);
    setTodayLogs(data || []);
  };

  const navItems = [
    { label: "Scan Card", icon: <CreditCard className="w-4 h-4" />, active: tab === "scan", onClick: () => setTab("scan") },
    { label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, active: tab === "analytics", onClick: () => setTab("analytics") },
  ];

  return (
    <DashboardLayout title="Doctor Portal" subtitle="Scan patient card to access reports" nav={navItems}>
      {tab === "scan" && (
        <div className="max-w-lg">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" /> Access Patient Records
            </h3>
            <CardInput onPatientFound={setPatient} />
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold mb-1">Today's Visits</h3>
            <p className="text-4xl font-bold text-primary">{todayLogs.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Patients Accessed Today
            </h3>
            {todayLogs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No patients accessed today.</p>
            ) : (
              <div className="space-y-2">
                {todayLogs.map((l) => (
                  <div key={l.id} className="text-sm flex justify-between p-2 bg-muted rounded">
                    <span>{l.accessed_by_name || l.patient_id.slice(0, 8)}</span>
                    <span className="text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {patient && !showReports && !showSummary && !showUploader && !showVisitNote && (
        <PatientAccessPanel
          patient={patient}
          allowUploadWithoutPin={true}
          onUpload={() => { setShowUploader(true); }}
          onViewReports={() => { setShowReports(true); }}
          onViewSummary={() => { setShowSummary(true); }}
          onAddVisitNote={() => { setShowVisitNote(true); }}
          onClose={() => setPatient(null)}
        />
      )}

      {showReports && patient && (
        <ReportViewer
          patientId={patient.id}
          accessedByRole="doctor"
          onClose={() => { setShowReports(false); setPatient(null); }}
        />
      )}

      {showSummary && patient && (
        <ReportViewer
          patientId={patient.id}
          accessedByRole="doctor"
          initialView="summary"
          onClose={() => { setShowSummary(false); setPatient(null); }}
        />
      )}

      {showUploader && patient && (
        <ReportUploader
          patientId={patient.id}
          uploadedByRole="doctor"
          onClose={() => { setShowUploader(false); setPatient(null); }}
          onSuccess={loadAnalytics}
        />
      )}

      {showVisitNote && patient && (
        <VisitNoteForm
          patientId={patient.id}
          onClose={() => { setShowVisitNote(false); setPatient(null); }}
          onSuccess={loadAnalytics}
        />
      )}
    </DashboardLayout>
  );
}
