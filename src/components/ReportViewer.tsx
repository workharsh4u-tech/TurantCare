import type { ReportFile, Visit } from "@/types/models";
import { useState, useEffect } from "react";
import {
  getPatientReports,
  logReportAccess,
  getExistingSummary,
  generateClinicalSummary,
  storeClinicalSummary,
  getPatientVisits,
} from "@/services/report.service";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Folder,
  FileText,
  ArrowLeft,
  ClipboardList,
  X,
  Eye,
  RefreshCw,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TrendGraph from "@/components/TrendGraph";
import EmbeddedReportViewer from "@/components/EmbeddedReportViewer";

interface ReportViewerProps {
  patientId: string;
  accessedByRole: string;
  onClose: () => void;
  showPrivate?: boolean;
  initialView?: "reports" | "summary";
}

export default function ReportViewer({
  patientId,
  accessedByRole,
  onClose,
  showPrivate = false,
  initialView = "reports",
}: ReportViewerProps) {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [dateGroups, setDateGroups] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [fullSummaries, setFullSummaries] = useState<Record<string, string>>({});
  const [view, setView] = useState<"reports" | "summary">(initialView);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [viewerFile, setViewerFile] = useState<ReportFile | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportFile | null>(null);

  const { user, profile } = useAuth();

  useEffect(() => {
    loadReports();
  }, [patientId]);

  // ==============================
  // Load all patient reports
  // ==============================
  const loadReports = async () => {
    try {
      const data = await getPatientReports(patientId, showPrivate);
      setReports(data);
      setVisits(await getPatientVisits(patientId));

      const groups = [...new Set(data.map((r) => r.date_group))]
        .sort()
        .reverse();

      setDateGroups(groups);

      if (user) {
        await logReportAccess(patientId, accessedByRole, user.id);
      }
    } catch (err) {
      console.error("Report loading failed:", err);
    }
  };

  // ==============================
  // Load / generate clinical summary
  // ==============================
  const loadSummary = async (
    dateGroup: string,
    forceRegenerate = false,
    reportFile?: ReportFile
  ) => {
    setLoadingSummary(true);
    setSummary(null);

    if (!forceRegenerate) {
      const existing = await getExistingSummary(patientId, dateGroup);

      if (existing) {
        setSummary(existing.summary_text);
        setLoadingSummary(false);
        return;
      }
    }

    try {
      const data = await generateClinicalSummary(
        patientId,
        dateGroup,
        [reportFile?.file_name || ""],
        reportFile?.file_url
      );

      if (data?.summary) {
        setSummary(data.summary);

        const summaryToStore = data.parameters?.length
          ? `${data.summary}\n\n\`\`\`json\n${JSON.stringify(
              { parameters: data.parameters },
              null,
              2
            )}\n\`\`\``
          : data.summary;

        await storeClinicalSummary(patientId, dateGroup, summaryToStore);
      }
    } catch (error) {
      console.error("Clinical summary generation failed:", error);
      setSummary("Clinical summary unavailable at this time.");
    }

    setLoadingSummary(false);
  };

  const loadFullSummary = async () => {
    const next: Record<string, string> = {};
    for (const dateGroup of dateGroups) {
      const existing = await getExistingSummary(patientId, dateGroup);
      if (existing?.summary_text) {
        next[dateGroup] = existing.summary_text;
      } else {
        const names = reports
          .filter((report) => report.date_group === dateGroup)
          .map((report) => report.file_name);
        const generated = await generateClinicalSummary(patientId, dateGroup, names);
        next[dateGroup] = generated?.summary || "Summary unavailable.";
        await storeClinicalSummary(patientId, dateGroup, next[dateGroup]);
      }
      setFullSummaries({ ...next });
    }
  };

  useEffect(() => {
    if (view === "summary" && dateGroups.length > 0) {
      loadFullSummary();
    }
  }, [view, dateGroups.length]);

  const dateReports = selectedDate
    ? reports.filter((r) => r.date_group === selectedDate)
    : [];

  const isDoctorView = accessedByRole === "doctor";

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-elevated max-w-[95vw] w-full h-[95vh] overflow-hidden border border-border flex flex-col">

          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(selectedDate || view === "summary") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedDate(null);
                    setSummary(null);
                    setView("reports");
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}

              <h3 className="font-display text-xl font-bold">
                {view === "summary" ? "Patient Summary" : selectedDate ? `Reports - ${selectedDate}` : "Medical Reports"}
              </h3>
            </div>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {view === "summary" ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-border bg-accent/30 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    <ClipboardList className="h-4 w-4" /> Full History Summary
                  </h4>
                  {dateGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reports available for summary.</p>
                  ) : (
                    <div className="space-y-4">
                      {dateGroups.map((dateGroup, index) => (
                        <div key={dateGroup} className="rounded-lg border border-border bg-background p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{index === 0 ? "Latest Report" : "Previous Report"}: {dateGroup}</p>
                              <p className="text-xs text-muted-foreground">
                                {reports.filter((report) => report.date_group === dateGroup).length} file(s)
                              </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => { setView("reports"); setSelectedDate(dateGroup); }}>
                              View Reports
                            </Button>
                          </div>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            {fullSummaries[dateGroup] ? (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fullSummaries[dateGroup]}</ReactMarkdown>
                            ) : (
                              <p className="text-muted-foreground">Generating summary...</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Visit Notes</h4>
                  {visits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No visit notes yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {visits.map((visit) => (
                        <div key={visit.id} className="rounded-md bg-muted/50 p-3 text-sm">
                          <p className="font-medium">{visit.diagnosis}</p>
                          {visit.medicines?.length > 0 && <p className="text-muted-foreground">Medicines: {visit.medicines.join(", ")}</p>}
                          {visit.notes && <p className="text-muted-foreground">{visit.notes}</p>}
                          {visit.follow_up && <p className="text-muted-foreground">Follow-up: {visit.follow_up}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">{new Date(visit.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : !selectedDate ? (
              <div className="space-y-6">

                {/* Trend Graph only for doctor */}
                {isDoctorView && <TrendGraph patientId={patientId} />}

                {/* Date Group List */}
                <div className="grid gap-3">
                  {dateGroups.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No reports found.
                    </p>
                  )}

                  {dateGroups.map((d) => {
                    const count = reports.filter((r) => r.date_group === d).length;

                    const types = [
                      ...new Set(
                        reports
                          .filter((r) => r.date_group === d)
                          .map((r) => r.report_type)
                          .filter(Boolean)
                      ),
                    ];

                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDate(d);
                          setSummary(null);
                          setSelectedReport(null);
                        }}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-left"
                      >
                        <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                          <Folder className="w-6 h-6 text-accent-foreground" />
                        </div>

                        <div className="flex-1">
                          <p className="font-semibold">{d}</p>
                          <p className="text-sm text-muted-foreground">
                            {count} file(s)
                            {types.length > 0 && ` • ${types.join(", ")}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 h-full">

                {/* Files Panel */}
                <div className="space-y-3 lg:col-span-1 lg:border-r lg:border-border/50 lg:pr-6">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Files
                  </h4>

                  {dateReports.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{r.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.report_type || r.file_type} • {r.uploaded_by_role}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Open report in viewer"
                        onClick={() => {
                          setViewerFile(r);
                          setSelectedReport(r);
                          loadSummary(selectedDate, false, r);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Clinical Summary Panel */}
                <div className="bg-accent/30 rounded-xl p-6 lg:col-span-2 overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Clinical Summary
                    </h4>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loadingSummary}
                      onClick={() =>
                        loadSummary(selectedDate, true, selectedReport || undefined)
                      }
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          loadingSummary ? "animate-spin" : ""
                        }`}
                      />
                      <span className="ml-1.5 text-xs">Regenerate</span>
                    </Button>
                  </div>

                  {loadingSummary ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  ) : summary ? (
                    <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-table:text-xs prose-th:px-2 prose-td:px-2 prose-th:py-1 prose-td:py-1 prose-table:border prose-th:border prose-td:border prose-th:border-border prose-td:border-border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summary}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No summary available.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-4 italic">
                    Computer-generated summary. Not medical advice.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded PDF/Image Viewer */}
      {viewerFile && (
        <EmbeddedReportViewer
          fileUrl={viewerFile.file_url}
          fileName={viewerFile.file_name}
          fileType={viewerFile.file_type}
          watermark={`TurantCare\n${
            profile?.full_name || accessedByRole
          }\n${new Date().toLocaleString()}`}
          onClose={() => setViewerFile(null)}
        />
      )}
    </>
  );
}
