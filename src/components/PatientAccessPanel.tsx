import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, X, Lock, User, ClipboardList, ClipboardPlus } from "lucide-react";
import { verifyPin } from "@/lib/auth";

interface PatientAccessPanelProps {
  patient: any;
  onUpload: () => void;
  onViewReports: () => void;
  onViewSummary?: () => void;
  onAddVisitNote?: () => void;
  onClose: () => void;
  allowUploadWithoutPin?: boolean;
}

export default function PatientAccessPanel({
  patient,
  onUpload,
  onViewReports,
  onViewSummary,
  onAddVisitNote,
  onClose,
  allowUploadWithoutPin = true,
}: PatientAccessPanelProps) {
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const { toast } = useToast();

  const handleVerifyPin = async () => {
    setVerifying(true);
    try {
      const { valid } = await verifyPin(patient.id, pin);
      if (valid) {
        setPinVerified(true);
        toast({ title: "PIN verified!" });
      } else {
        toast({ title: "Invalid PIN", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error verifying PIN", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-elevated p-8 max-w-md w-full border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold">Patient Access</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{patient.name || "Patient"}</p>
            <p className="text-sm text-muted-foreground">Card: {patient.card_number}</p>
          </div>
        </div>

        <div className="space-y-3">
          {allowUploadWithoutPin && (
            <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={onUpload}>
              <Upload className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Upload Reports</div>
                <div className="text-xs text-muted-foreground">No PIN required</div>
              </div>
            </Button>
          )}

          {!showPinInput && !pinVerified && (
            <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={() => setShowPinInput(true)}>
              <Eye className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">View Reports</div>
                <div className="text-xs text-muted-foreground">Requires patient PIN</div>
              </div>
            </Button>
          )}

          {showPinInput && !pinVerified && (
            <div className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="w-4 h-4" /> Enter Patient PIN
              </div>
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={6}
              />
              <Button onClick={handleVerifyPin} disabled={verifying || pin.length < 4} className="w-full">
                {verifying ? "Verifying..." : "Verify PIN"}
              </Button>
            </div>
          )}

          {pinVerified && (
            <>
              <Button className="w-full justify-start gap-3 h-14 border-success/50 bg-success/5" variant="outline" onClick={onViewReports}>
                <Eye className="w-5 h-5 text-success" />
                <div className="text-left">
                  <div className="font-medium text-success">View Reports, PIN Verified</div>
                  <div className="text-xs text-muted-foreground">Access granted</div>
                </div>
              </Button>

              {onViewSummary && (
                <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={onViewSummary}>
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">View Summary</div>
                    <div className="text-xs text-muted-foreground">Latest report plus earlier history</div>
                  </div>
                </Button>
              )}

              {onAddVisitNote && (
                <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={onAddVisitNote}>
                  <ClipboardPlus className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">Add Visit Note</div>
                    <div className="text-xs text-muted-foreground">Diagnosis, medicines, follow-up</div>
                  </div>
                </Button>
              )}
            </>
          )}

          {!allowUploadWithoutPin && pinVerified && (
            <Button className="w-full justify-start gap-3 h-14" variant="outline" onClick={onUpload}>
              <Upload className="w-5 h-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Upload Prescription/Notes</div>
                <div className="text-xs text-muted-foreground">Add doctor notes</div>
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
