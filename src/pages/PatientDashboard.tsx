import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { generateTemporaryPin } from "@/lib/auth";
import { getPatientReports } from "@/services/report.service";
import DashboardLayout from "@/components/DashboardLayout";
import ReportViewer from "@/components/ReportViewer";
import ReportUploader from "@/components/ReportUploader";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FileText, User, Shield, Clock, QrCode,
  CreditCard, Lock, Eye, Folder, MessageSquare,
  Upload, Mic, Send, Paperclip, X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"profile" | "reports" | "logs" | "vault" | "chat" | "visits">("profile");
  const [patient, setPatient] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [tempPin, setTempPin] = useState("");
  const [tempPinExpiresAt, setTempPinExpiresAt] = useState("");
  const [generatingPin, setGeneratingPin] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [vaultShared, setVaultShared] = useState(false);
  const [vaultTimer, setVaultTimer] = useState(0);
  const [vaultTimerId, setVaultTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [sharedReportIds, setSharedReportIds] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const chatFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadData();

    const handleEvent = (type: string, patientId: string, action?: string) => {
      if (patientId === patient?.id || patientId === user?.id) {
        if (type === "report-uploaded") {
          toast({ title: "New Report Uploaded!", description: "A new medical report was added." });
        } else if (type === "visit-note") {
          toast({ title: "New Doctor Note!", description: "A doctor has added a new consultation note." });
        } else if (type === "patient-action") {
          toast({ title: "Account Accessed", description: `Your account was accessed by a ${action === "view" ? "doctor" : "user"}.` });
        }
        loadData();
      }
    };

    const handleWindowEvent = (e: any) => handleEvent(e.detail?.type, e.detail?.patientId, e.detail?.action);
    
    const channel = new BroadcastChannel("turantcare_notifications");
    channel.onmessage = (e) => handleEvent(e.data.type, e.data.patientId, e.data.action);

    window.addEventListener("turantcare_sys_notify", handleWindowEvent);
    return () => {
      window.removeEventListener("turantcare_sys_notify", handleWindowEvent);
      channel.close();
    };
  }, [user, patient?.id]);

  useEffect(() => {
    if (patient && !tempPin) {
      handleGenerateTempPin(false);
    }
  }, [patient]);

  const loadData = async () => {
    const { data: p } = await supabase.from("patients").select("*").eq("user_id", user!.id).single();
    if (p) {
      setPatient(p);
      setForm(p);
      const { data: r } = await supabase.from("report_files").select("*").eq("patient_id", p.id).order("created_at", { ascending: false });
      setReports(r || []);
      const { data: l } = await supabase.from("access_logs").select("*").eq("patient_id", p.id).order("created_at", { ascending: false }).limit(50);
      setLogs(l || []);
      const { data: v } = await supabase.from("visits" as never).select("*").eq("patient_id", p.id).order("created_at", { ascending: false });
      setVisits(v || []);
    }
  };

  const handleGenerateTempPin = async (showToast = true) => {
    setGeneratingPin(true);
    const { pin, expiresAt, error } = await generateTemporaryPin(15);
    if (error || !pin || !expiresAt) {
      toast({ title: "Unable to generate temporary PIN", variant: "destructive" });
    } else {
      setTempPin(pin);
      setTempPinExpiresAt(expiresAt);
      if (showToast) {
        toast({ title: "Temporary PIN refreshed", description: "Share it only during the consultation." });
      }
    }
    setGeneratingPin(false);
  };

  const handleSaveProfile = async () => {
    const { error } = await supabase.from("patients").update({
      name: form.name, age: form.age ? parseInt(form.age) : null, gender: form.gender,
      blood_group: form.blood_group, diabetes: form.diabetes,
      allergies: form.allergies, chronic_conditions: form.chronic_conditions,
      emergency_contact: form.emergency_contact,
    }).eq("id", patient.id);
    if (error) toast({ title: "Error saving", variant: "destructive" });
    else { toast({ title: "Profile saved!" }); setEditing(false); loadData(); }
  };

  // Cleanup vault timer on unmount
  useEffect(() => {
    return () => { if (vaultTimerId) clearInterval(vaultTimerId); };
  }, [vaultTimerId]);

  const startVaultShare = async () => {
    const duration = 15 * 60;
    const privateReports = reports.filter((r) => r.is_private);
    const ids = privateReports.map((r) => r.id);
    setSharedReportIds(ids);
    setVaultShared(true);
    setVaultTimer(duration);

    // Make all private reports temporarily visible
    for (const rid of ids) {
      await supabase.from("report_files").update({ is_private: false }).eq("id", rid);
    }
    
    loadData();
    toast({ title: "Vault shared for 15 minutes", description: "Private reports are now temporarily visible." });

    const id = setInterval(() => {
      setVaultTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          lockVaultWithIds(ids);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setVaultTimerId(id);
  };

  const lockVaultWithIds = async (ids: string[]) => {
    setVaultShared(false);
    setVaultTimer(0);
    setVaultTimerId((prev) => { if (prev) clearInterval(prev); return null; });
    
    // Re-lock all previously private reports
    for (const rid of ids) {
      await supabase.from("report_files").update({ is_private: true }).eq("id", rid);
    }
    
    setSharedReportIds([]);
    toast({ title: "Vault locked", description: "Private reports are hidden again." });
    loadData();
  };

  const lockVault = () => lockVaultWithIds(sharedReportIds);

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePrivate = async (reportId: string, isPrivate: boolean) => {
    await supabase.from("report_files").update({ is_private: isPrivate }).eq("id", reportId);
    loadData();
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;

    const uploadChatFiles = async () => {
      if (chatFiles.length === 0) return [];

      const uploaded: { name: string; url: string; type: string }[] = [];
      for (const file of chatFiles) {
        const path = `${patient?.id || "unknown"}/health-doc/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("medical-reports").upload(path, file);
        if (uploadError) throw uploadError;
        const { data } = await supabase.storage.from("medical-reports").createSignedUrl(path, 15 * 60);
        uploaded.push({ name: file.name, url: data?.signedUrl || path, type: file.type });
      }
      return uploaded;
    };

    let attachments: { name: string; url: string; type: string }[] = [];
    try {
      attachments = await uploadChatFiles();
    } catch {
      toast({ title: "Upload failed", description: "Unable to attach file(s) to Health Doc.", variant: "destructive" });
      return;
    }

    const attachmentText = attachments.length
      ? `\n\nAttached files:\n${attachments.map((a) => `- ${a.name}`).join("\n")}`
      : "";

    const newMsg = { role: "user", content: chatInput + attachmentText };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setChatFiles([]);
    setChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("patient-chat", {
        body: { messages: [...chatMessages, newMsg], patientId: patient?.id, attachments },
      });
      if (error) throw error;
      if (data?.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again." }]);
    }
    setChatLoading(false);
  };

  const toggleVoiceToText = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Not Supported", description: "Your browser does not support Voice to Text.", variant: "destructive" });
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const navItems = [
    { label: "Profile", icon: <User className="w-4 h-4" />, active: tab === "profile", onClick: () => setTab("profile") },
    { label: "Reports", icon: <FileText className="w-4 h-4" />, active: tab === "reports", onClick: () => setTab("reports") },
    { label: "Consultations", icon: <FileText className="w-4 h-4" />, active: tab === "visits", onClick: () => setTab("visits") },
    { label: "Access Logs", icon: <Clock className="w-4 h-4" />, active: tab === "logs", onClick: () => setTab("logs") },
    { label: "Privacy Vault", icon: <Shield className="w-4 h-4" />, active: tab === "vault", onClick: () => setTab("vault") },
    { label: "Health Doc", icon: <MessageSquare className="w-4 h-4" />, active: tab === "chat", onClick: () => setTab("chat") },
  ];

  const dateGroups = [...new Set(reports.map((r) => r.date_group))].sort().reverse();

  if (!patient) return <DashboardLayout title="Loading..."><div /></DashboardLayout>;

  return (
    <DashboardLayout title="Patient Dashboard" subtitle={`Welcome, ${patient.name || "Patient"}`} nav={navItems}>
      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Your TurantCare Card
            </h3>
            <div className="p-6 rounded-xl gradient-primary text-primary-foreground">
              <div className="flex items-center justify-between mb-6">
                <FileText className="w-8 h-8" />
                <span className="text-sm opacity-80">TurantCare</span>
              </div>
              <p className="text-2xl font-mono tracking-wider mb-4">{patient.card_number}</p>
              <p className="text-sm opacity-80">{patient.name}</p>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={patient.card_number} size={120} bgColor="#ffffff" fgColor="#000000" />
              </div>
              <div>
                <p className="text-sm font-medium">Your QR Code</p>
                <p className="text-xs text-muted-foreground">Show this to your doctor or diagnostic center for quick lookup</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Profile
              </h3>
              <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit"}
              </Button>
            </div>
            <div className="grid gap-3">
              {[
                { label: "Name", key: "name" },
                { label: "Age", key: "age", type: "number" },
                { label: "Gender", key: "gender" },
                { label: "Blood Group", key: "blood_group" },
                { label: "Allergies", key: "allergies" },
                { label: "Chronic Conditions", key: "chronic_conditions" },
                { label: "Emergency Contact", key: "emergency_contact" },
              ].map((field) => (
                <div key={field.key}>
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  {editing ? (
                    <Input
                      value={form[field.key] || ""}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      type={field.type || "text"}
                    />
                  ) : (
                    <p className="text-sm font-medium">{patient[field.key] || "—"}</p>
                  )}
                </div>
              ))}
              <div>
                <Label className="text-xs text-muted-foreground">Diabetes</Label>
                {editing ? (
                  <Switch checked={form.diabetes} onCheckedChange={(v) => setForm({ ...form, diabetes: v })} />
                ) : (
                  <p className="text-sm font-medium">{patient.diabetes ? "Yes" : "No"}</p>
                )}
              </div>
              {editing && <Button onClick={handleSaveProfile} className="mt-2">Save Profile</Button>}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Temporary Access PIN
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This PIN expires after 15 minutes. Share it only with the doctor or diagnostic center in front of you.
            </p>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Current PIN</p>
                  <p className="font-mono text-3xl font-bold tracking-widest">{tempPin || "------"}</p>
                </div>
                <Button onClick={() => handleGenerateTempPin()} disabled={generatingPin} variant="outline">
                  {generatingPin ? "Generating..." : "Regenerate"}
                </Button>
              </div>
              {tempPinExpiresAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Expires at {new Date(tempPinExpiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-semibold text-lg">Your Reports</h3>
            <Button onClick={() => setShowUploader(true)} size="sm">
              <Upload className="w-4 h-4 mr-2" /> Upload Report
            </Button>
          </div>
          {dateGroups.length === 0 && <p className="text-muted-foreground text-center py-12">No reports yet.</p>}
          {dateGroups.map((d) => {
            const group = reports.filter((r) => r.date_group === d && !r.is_private);
            if (group.length === 0) return null;
            return (
              <div key={d} className="bg-card rounded-xl border border-border p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold">{d}</p>
                    <p className="text-sm text-muted-foreground">{group.length} file(s)</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2 pl-8">
                  {group.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1">{r.file_name}</span>
                      <a href={r.file_url} target="_blank" rel="noopener"><Button variant="ghost" size="sm"><Eye className="w-3 h-3" /></Button></a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Access Logs Tab */}
      {tab === "logs" && (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Who</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No access logs.</td></tr>}
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-3">{l.accessed_by_name || l.accessed_by_id.slice(0, 8)}</td>
                    <td className="p-3 capitalize">{l.accessed_by_role}</td>
                    <td className="p-3 capitalize">{l.action}</td>
                    <td className="p-3 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consultations Tab */}
      {tab === "visits" && (
        <div className="space-y-4">
          {visits.length === 0 && <p className="text-muted-foreground text-center py-12">No consultation notes yet.</p>}
          {visits.map((v) => (
            <div key={v.id} className="bg-card rounded-xl border border-border p-5 shadow-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">Diagnosis: {v.diagnosis}</h3>
                  <p className="text-sm text-muted-foreground">Doctor ID: {v.doctor_id.slice(0,8)}</p>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded-md">{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
              
              {v.medicines && v.medicines.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Medicines Prescribed:</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {v.medicines.map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
              
              {v.notes && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Doctor's Notes:</p>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{v.notes}</p>
                </div>
              )}
              
              {v.follow_up && (
                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Follow-up:</p>
                  <p className="text-sm text-primary">{v.follow_up}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Privacy Vault */}
      {tab === "vault" && (
        <div className="space-y-4">
          <div className="bg-accent/30 rounded-lg p-4 text-sm">
            <p className="font-medium flex items-center gap-2"><Shield className="w-4 h-4" /> Privacy Vault</p>
            <p className="text-muted-foreground mt-1">Reports in your vault are hidden from doctors and diagnostic centers, even with your PIN.</p>
          </div>

          {/* Timed Share Toggle */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Temporary Vault Share
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {vaultShared
                    ? `Vault is open — auto-locks in ${formatTimer(vaultTimer)}`
                    : "Share all private reports for 15 minutes, then auto-lock"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {vaultShared && (
                  <Button variant="destructive" size="sm" onClick={lockVault}>
                    <Lock className="w-3 h-3 mr-1" /> Lock Now
                  </Button>
                )}
                <Switch
                  checked={vaultShared}
                  onCheckedChange={(v) => { if (v) startVaultShare(); else lockVault(); }}
                />
              </div>
            </div>
            {vaultShared && (
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(vaultTimer / (15 * 60)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Report list */}
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{r.file_name}</p>
                <p className="text-xs text-muted-foreground">{r.date_group}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{r.is_private ? "Private" : "Visible"}</span>
                <Switch
                  checked={r.is_private}
                  onCheckedChange={(v) => togglePrivate(r.id, v)}
                  disabled={vaultShared}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Health Doc */}
      {tab === "chat" && (
        <div className="bg-card rounded-xl border border-border shadow-card max-w-4xl mx-auto flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <div>
              <h3 className="font-display font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Health Doc
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Your personal health assistant</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowUploader(true)} className="gap-2">
              <Upload className="w-4 h-4" /> Upload Report
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <MessageSquare className="w-16 h-16" />
                <p className="text-sm">Upload a report or ask a health question.</p>
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md" : "bg-muted rounded-tl-sm shadow-sm"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0 animate-pulse">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted p-4 rounded-2xl rounded-tl-sm text-sm animate-pulse text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border bg-card">
            <input
              ref={chatFileRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => setChatFiles(Array.from(e.target.files || []))}
            />

            {chatFiles.length > 0 && (
              <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                {chatFiles.map((f) => (
                  <div key={f.name} className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
                    <Paperclip className="w-3 h-3" />
                    <span className="max-w-[220px] truncate">{f.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setChatFiles((prev) => prev.filter((x) => x.name !== f.name))}
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 max-w-3xl mx-auto relative">
              <Input 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="Message Health Doc..."
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                className="rounded-full pl-6 pr-24 py-6 bg-muted/30 border border-border shadow-sm focus-visible:ring-primary/50 text-base"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-primary"
                  title="Attach files"
                  onClick={() => chatFileRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`rounded-full ${isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-muted-foreground hover:text-primary"}`}
                  title="Voice to Text"
                  onClick={toggleVoiceToText}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button className="rounded-full shadow-md w-10 h-10 p-0 flex items-center justify-center" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                  <Send className="w-4 h-4 ml-0.5" />
                </Button>
              </div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3">Health guidance can be incomplete. Always consult your doctor for medical advice.</p>
          </div>
        </div>
      )}

      {showUploader && (
        <ReportUploader
          patientId={patient.id}
          uploadedByRole="patient"
          onClose={() => setShowUploader(false)}
          onSuccess={loadData}
        />
      )}
    </DashboardLayout>
  );
}
