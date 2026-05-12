import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DiagnosticDashboard from "./pages/DiagnosticDashboard";
import HospitalAdmin from "./pages/HospitalAdmin";
import VerificationPending from "./pages/VerificationPending";
import NotFound from "./pages/NotFound";
import PlatformAdmin from "./pages/PlatformAdmin";
import { LanguageModal } from "@/components/LanguageModal";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (profile && !allowedRoles.includes(profile.role)) return <Navigate to="/auth" />;
  if (profile?.role !== "patient" && profile?.verification_status !== "verified") return <Navigate to="/verification-pending" />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <LanguageModal />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verification-pending" element={<VerificationPending />} />
            <Route path="/patient/dashboard" element={
              <ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>
            } />
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute allowedRoles={["doctor", "hospital_admin"]}><DoctorDashboard /></ProtectedRoute>
            } />
            <Route path="/diagnostic/dashboard" element={
              <ProtectedRoute allowedRoles={["diagnostic_center"]}><DiagnosticDashboard /></ProtectedRoute>
            } />
            <Route path="/hospital/admin" element={
              <ProtectedRoute allowedRoles={["hospital_admin"]}><HospitalAdmin /></ProtectedRoute>
            } />
            <Route path="/platform-admin" element={<PlatformAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
