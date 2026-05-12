import { Link, useNavigate } from "react-router-dom";
import { Clock, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";

export default function VerificationPending() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo-mark.png" alt="TurantCare" className="w-full h-full object-contain" />
            </div>
            <img src="/logo-wordmark.png" alt="TurantCare" className="h-7 w-auto max-w-[180px] object-contain" />
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-accent">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Verification pending</h1>
          <p className="mt-3 text-muted-foreground">
            Your {String(profile?.role || "professional").replace("_", " ")} account has been created, but it cannot access patient records until an admin verifies your identity and organization.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> Why this is locked
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Doctor, diagnostic, and hospital access exposes medical data. TurantCare requires manual approval before those dashboards open.
            </p>
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{profile?.email || profile?.full_name}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
