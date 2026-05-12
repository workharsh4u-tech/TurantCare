import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getPatientByCard, getPatientByChip } from "@/lib/auth";
import { CreditCard, QrCode, Cpu, Search } from "lucide-react";
import QRScanner from "./QRScanner";

interface CardInputProps {
  onPatientFound: (patient: any) => void;
}

export default function CardInput({ onPatientFound }: CardInputProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [chipId, setChipId] = useState("");
  const [mode, setMode] = useState<"card" | "qr" | "chip">("card");
  const [showScanner, setShowScanner] = useState(false);
  const [searching, setSearching] = useState(false);
  const { toast } = useToast();

  const searchByCard = async (cn: string) => {
    setSearching(true);
    const { data, error } = await getPatientByCard(cn.trim());
    if (data) {
      onPatientFound(data);
    } else {
      toast({ title: "Patient not found", description: "No patient with that card number.", variant: "destructive" });
    }
    setSearching(false);
  };

  const searchByChip = async () => {
    setSearching(true);
    const { data } = await getPatientByChip(chipId.trim());
    if (data) {
      onPatientFound(data);
    } else {
      toast({ title: "Patient not found", variant: "destructive" });
    }
    setSearching(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { key: "card" as const, icon: CreditCard, label: "Card Number" },
          { key: "qr" as const, icon: QrCode, label: "QR Scan" },
          { key: "chip" as const, icon: Cpu, label: "Chip/NFC" },
        ].map((m) => (
          <Button
            key={m.key}
            variant={mode === m.key ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode(m.key);
              if (m.key === "qr") setShowScanner(true);
            }}
            className="flex-1"
          >
            <m.icon className="w-4 h-4 mr-1.5" />
            {m.label}
          </Button>
        ))}
      </div>

      {mode === "card" && (
        <div className="flex gap-2">
          <Input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Enter card number (e.g. TC-a1b2c3d4)"
          />
          <Button onClick={() => searchByCard(cardNumber)} disabled={!cardNumber || searching}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      )}

      {mode === "chip" && (
        <div className="flex gap-2">
          <Input
            value={chipId}
            onChange={(e) => setChipId(e.target.value)}
            placeholder="Enter chip/NFC ID"
          />
          <Button onClick={searchByChip} disabled={!chipId || searching}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
      )}

      {showScanner && (
        <QRScanner
          onScan={(val) => {
            setShowScanner(false);
            setCardNumber(val);
            searchByCard(val);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
