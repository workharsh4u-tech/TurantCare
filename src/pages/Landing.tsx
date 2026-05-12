import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CreditCard, Stethoscope, Building2, Lock, ClipboardList, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: CreditCard, title: "Smart Card Access", desc: "Each patient gets a unique TurantCare card with QR code for instant medical record access" },
  { icon: Shield, title: "PIN-Protected Privacy", desc: "Reports are PIN-protected. Only the patient decides who sees their medical data" },
  { icon: Stethoscope, title: "Doctor Portal", desc: "Scan patient card, enter PIN, and view organized medical reports instantly" },
  { icon: Building2, title: "Diagnostic Center", desc: "Upload reports seamlessly using card number, QR scan, or chip ID" },
  { icon: ClipboardList, title: "Clinical Summary", desc: "Structured report summaries help doctors quickly understand patient history" },
  { icon: Lock, title: "Privacy Vault", desc: "Patients can hide sensitive reports in a private vault, invisible even with PIN" },
];

const steps = [
  { num: "01", title: "Get Your Card", desc: "Sign up and receive your unique TurantCare card number and QR code" },
  { num: "02", title: "Visit a Center", desc: "Diagnostic center scans your card and uploads reports to your account" },
  { num: "03", title: "Doctor Views Reports", desc: "Share your PIN with your doctor for instant, organized access to all reports" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo-mark.png" alt="TurantCare" className="w-full h-full object-contain" />
            </div>
            <span className="font-display text-xl font-bold">TurantCare</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <QrCode className="w-4 h-4" />
              Card-based medical record access
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              Your Medical Records,{" "}
              <span className="text-gradient">One Card Away</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              TurantCare connects patients, doctors, and diagnostic centers through a smart card system. 
              Secure, instant access to medical reports — like a debit card for your health data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-primary text-primary-foreground px-8 shadow-elevated">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-accent/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-display font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            Built for Everyone in Healthcare
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl bg-card shadow-card border border-border hover:shadow-elevated transition-shadow"
              >
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="p-12 rounded-2xl gradient-primary text-primary-foreground">
            <h2 className="text-3xl font-display font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 mb-8">Join TurantCare today and take control of your medical records.</p>
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="secondary" className="px-8 font-semibold">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground text-sm">
          © 2026 TurantCare. All rights reserved. Your health data, your control.
        </div>
      </footer>
    </div>
  );
}
