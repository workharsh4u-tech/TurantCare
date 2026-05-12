import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { signIn, signUp, type AppRole } from "@/lib/auth";

const roles: { value: AppRole; label: string; desc: string }[] = [
  { value: "patient", label: "Patient", desc: "Access your medical reports" },
  { value: "doctor", label: "Doctor (Self Clinic)", desc: "View patient reports" },
  { value: "diagnostic_center", label: "Diagnostic Center", desc: "Upload patient reports" },
  { value: "hospital_admin", label: "Hospital Admin", desc: "Manage hospital & doctors" },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("patient");
  const [loginRole, setLoginRole] = useState<AppRole>("patient");
  const [hospitalName, setHospitalName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
      const r = profile.role as string;
      if (r === "patient") navigate("/patient/dashboard");
      else if (profile.verification_status === "pending") navigate("/verification-pending");
      else if (r === "doctor" || r === "hospital_admin") navigate("/doctor/dashboard");
      else if (r === "diagnostic_center") navigate("/diagnostic/dashboard");
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPhone = phone.trim();
      const phonePattern = /^[+]?[\d\s-]{10,16}$/;

      if (isSignup) {
        if (!fullName.trim()) throw new Error("Full name is required.");
        if (!phonePattern.test(trimmedPhone)) throw new Error("Enter a valid phone number.");
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (!consent) throw new Error("Consent is required for healthcare data access.");

        const extra: Record<string, string> = { phone: trimmedPhone };
        if (role === "hospital_admin") extra.hospital_name = hospitalName;
        const { error } = await signUp(trimmedEmail, password, role, fullName.trim(), extra);
        if (error) throw error;
        toast({ title: "Account created!", description: "You're now signed in." });
      } else {
        const { error } = await signIn(trimmedEmail, password, loginRole);
        if (error) throw error;
        toast({ title: "Welcome back!" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-8">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-display font-bold mb-4">Your Medical Records, Simplified</h2>
          <p className="text-primary-foreground/80 text-lg">
            One card. All your reports. Secure access for doctors and diagnostic centers.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2">
            {isSignup ? "Create an account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isSignup ? "Choose your role and get started" : "Sign in to your account"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isSignup && (
              <div>
                <Label>Signing in as</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setLoginRole(r.value)}
                      className={`p-3 rounded-lg border text-left transition-all text-sm ${
                        loginRole === r.value
                          ? "border-primary bg-accent shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{r.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSignup && (
              <>
                <div>
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
                </div>

                <div>
                  <Label>Role</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`p-3 rounded-lg border text-left transition-all text-sm ${
                          role === r.value
                            ? "border-primary bg-accent shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-medium">{r.label}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {role === "hospital_admin" && (
                  <div>
                    <Label>Hospital Name</Label>
                    <Input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="City General Hospital" required />
                  </div>
                )}
              </>
            )}

            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>

            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={isSignup ? 8 : 6} />
            </div>

            {isSignup && (
              <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <Checkbox checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" />
                <span className="text-muted-foreground">
                  I consent to TurantCare storing and processing my healthcare profile for secure record access.
                </span>
              </label>
            )}

            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-accent/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            Patient accounts open immediately. Doctor, diagnostic, and hospital accounts stay pending until admin verification.
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsSignup(!isSignup)} className="text-primary font-medium hover:underline">
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
