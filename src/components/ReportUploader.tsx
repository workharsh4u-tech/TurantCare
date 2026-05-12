import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { REPORT_FILE_SIGNED_URL_TTL_SECONDS } from "@/lib/reportRetention";
import { Check, FileUp, Upload, X } from "lucide-react";

interface ReportUploaderProps {
  patientId: string;
  uploadedByRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportUploader({ patientId, uploadedByRole, onClose, onSuccess }: ReportUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [reportType, setReportType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const maxFileSize = 10 * 1024 * 1024;
  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

  const optimizeImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/") || file.size <= 2 * 1024 * 1024) return file;

    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const scale = file.size > 5 * 1024 * 1024 ? 0.5 : 0.8;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file);
        }, "image/jpeg", 0.75);
      };
      img.onerror = () => resolve(file);
    });
  };

  const handleUpload = async () => {
    if (!files.length || !user) return;

    const invalidFile = files.find((file) => !allowedTypes.has(file.type) || file.size > maxFileSize);
    if (invalidFile) {
      toast({
        title: "File rejected",
        description: "Use PDF, JPG, PNG, or WEBP files up to 10 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const optimizedFiles = await Promise.all(files.map(optimizeImage));
      const dateGroup = new Date().toISOString().split("T")[0];

      for (const file of optimizedFiles) {
        const filePath = `${patientId}/${dateGroup}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("medical-reports").upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: signedData, error: signedError } = await supabase.storage
          .from("medical-reports")
          .createSignedUrl(filePath, REPORT_FILE_SIGNED_URL_TTL_SECONDS);
        if (signedError) throw signedError;

        const { error: dbError } = await supabase.from("report_files").insert({
          patient_id: patientId,
          date_group: dateGroup,
          file_url: signedData?.signedUrl || filePath,
          file_name: file.name,
          file_type: file.type,
          report_type: reportType || null,
          storage_path: filePath,
          file_size_bytes: file.size,
          uploaded_by_role: uploadedByRole,
          uploaded_by_id: user.id,
        } as never);
        if (dbError) throw dbError;
      }

      window.dispatchEvent(new CustomEvent("turantcare-report-uploaded", { detail: { patientId } }));
      setDone(true);
      toast({ title: "Reports uploaded successfully!" });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "The report upload failed.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-elevated p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Upload Complete</h3>
          <p className="text-muted-foreground">{files.length} file(s) uploaded successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-elevated p-8 max-w-md w-full border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5" /> Upload Reports
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Report Type</Label>
            <Input value={reportType} onChange={(e) => setReportType(e.target.value)} placeholder="Blood Test, X-Ray, MRI" />
          </div>

          <div>
            <Label>Files</Label>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                const valid = selected.filter((file) => allowedTypes.has(file.type) && file.size <= maxFileSize);
                if (valid.length !== selected.length) {
                  toast({
                    title: "Some files were skipped",
                    description: "Only PDF, JPG, PNG, or WEBP files up to 10 MB are accepted.",
                    variant: "destructive",
                  });
                }
                setFiles(valid);
              }}
            />
            <Button variant="outline" className="w-full mt-1.5 h-20 border-dashed" onClick={() => fileRef.current?.click()}>
              <div className="text-center">
                <FileUp className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {files.length ? `${files.length} file(s) selected` : "Click to choose files"}
                </span>
              </div>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">PDF, JPG, PNG, or WEBP. Max 10 MB per file.</p>
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((file) => (
                <div key={file.name} className="text-sm text-muted-foreground flex items-center gap-2 p-2 bg-muted rounded">
                  <FileUp className="w-3 h-3" /> {file.name}
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleUpload} disabled={!files.length || uploading} className="w-full gradient-primary text-primary-foreground">
            {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
