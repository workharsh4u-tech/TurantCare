import { useState } from "react";
import { ClipboardPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { addVisitNote, logPatientAction } from "@/services/report.service";

interface VisitNoteFormProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VisitNoteForm({ patientId, onClose, onSuccess }: VisitNoteFormProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    if (!diagnosis.trim()) {
      toast({ title: "Diagnosis is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await addVisitNote({
        patientId,
        doctorId: user.id,
        diagnosis: diagnosis.trim(),
        medicines: medicines.split(",").map((item) => item.trim()).filter(Boolean),
        notes: notes.trim(),
        followUp: followUp.trim(),
      });
      await logPatientAction(patientId, profile?.role || "doctor", user.id, "visit_note_added");
      toast({ title: "Visit note saved" });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "The visit note could not be saved.";
      toast({ title: "Unable to save visit note", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevated">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5" /> Add Visit Note
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Diagnosis</Label>
            <Textarea value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} placeholder="Primary diagnosis" />
          </div>
          <div>
            <Label>Medicines</Label>
            <Input value={medicines} onChange={(event) => setMedicines(event.target.value)} placeholder="Medicine A, Medicine B" />
          </div>
          <div>
            <Label>Clinical Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Symptoms, observations, prescription context" />
          </div>
          <div>
            <Label>Follow-up</Label>
            <Input value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Review after 7 days" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full gradient-primary text-primary-foreground">
            {saving ? "Saving..." : "Save Visit Note"}
          </Button>
        </div>
      </div>
    </div>
  );
}
