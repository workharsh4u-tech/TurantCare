import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10 },
        (decodedText) => {
          if (isRunningRef.current) {
            isRunningRef.current = false;
            scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
          }
        },
        () => { }
      );
      isRunningRef.current = true;
      setStarted(true);
    } catch (err) {
      setError("Camera access denied or unavailable.");
      console.error(err);
    }
  };

  const handleManualCapture = async () => {
    const video = document.querySelector("#qr-reader video") as HTMLVideoElement;
    if (!video) {
      setError("No active camera feed to capture.");
      return;
    }
    
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        try {
          const tempScanner = new Html5Qrcode("qr-reader-hidden");
          const decodedText = await tempScanner.scanFile(file, true);
          onScan(decodedText);
        } catch (err) {
          setError("Manual scan failed: No clear QR code detected in frame.");
        }
      }, "image/jpeg");
    } catch (err) {
      console.error("Capture error", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0];
        const html5QrCode = new Html5Qrcode("qr-reader");
        const decodedText = await html5QrCode.scanFile(file, true);
        onScan(decodedText);
      } catch (err) {
        setError("Could not find a valid QR code in that image.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (isRunningRef.current && scannerRef.current) {
        isRunningRef.current = false;
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-elevated p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" /> Scan QR Code
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div id="qr-reader" className="rounded-lg overflow-hidden" />
        <div id="qr-reader-hidden" style={{ display: "none" }} />
        
        {started && !error && (
          <Button onClick={handleManualCapture} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white">
            <Camera className="w-4 h-4 mr-2" /> Force Scan Current Frame
          </Button>
        )}
        
        {!started && !error && (
          <Button onClick={startScanner} className="w-full mt-3">
            <Camera className="w-4 h-4 mr-2" /> Start Camera
          </Button>
        )}
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            Camera struggling to focus? Upload a photo instead.
          </p>
          <div className="relative">
            <Input 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="secondary" className="w-full text-xs pointer-events-none">
              Take Photo to Scan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
