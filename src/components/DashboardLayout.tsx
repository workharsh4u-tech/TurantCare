import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { LogOut, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  nav?: { label: string; icon: ReactNode; active?: boolean; onClick?: () => void }[];
}

export default function DashboardLayout({ children, title, subtitle, nav }: DashboardLayoutProps) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<{ id: string; msg: string; time: Date }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const addNotif = (patientId: string, msg: string = "A new medical report was just uploaded.") => {
      if (profile?.role === "patient" || patientId === profile?.id || patientId === user?.id) {
        setNotifications((prev) => [
          { id: crypto.randomUUID(), msg, time: new Date() },
          ...prev,
        ]);
        setUnreadCount((c) => c + 1);
      }
    };

    const handleEvent = (type: string, patientId: string, action?: string) => {
      if (type === "report-uploaded") {
        addNotif(patientId, "A new medical report was just uploaded.");
      } else if (type === "visit-note") {
        addNotif(patientId, "A doctor has added a new consultation note.");
      } else if (type === "patient-action") {
        addNotif(patientId, `Your account was accessed by a ${action === "view" ? "doctor" : "user"}.`);
      }
    };

    const handleWindowEvent = (e: any) => handleEvent(e.detail?.type, e.detail?.patientId, e.detail?.action);

    const channel = new BroadcastChannel("turantcare_notifications");
    channel.onmessage = (e) => handleEvent(e.data.type, e.data.patientId, e.data.action);

    window.addEventListener("turantcare_sys_notify", handleWindowEvent);
    return () => {
      window.removeEventListener("turantcare_sys_notify", handleWindowEvent);
      channel.close();
    };
  }, [profile?.id, user?.id]);

  const handleClearNotifs = () => {
    setNotifications([]);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                <img src="/logo-mark.png" alt="TurantCare" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold hidden sm:inline">TurantCare</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{profile?.full_name || profile?.email}</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" onClick={() => setUnreadCount(0)}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border font-medium flex items-center justify-between">
                  Notifications
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleClearNotifs}>Clear</Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No new notifications.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 border-b border-border/50 text-sm hover:bg-muted/50">
                        <p>{n.msg}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.time.toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      {nav && nav.length > 0 && (
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto py-1">
            {nav.map((item, i) => (
              <Button
                key={i}
                variant={item.active ? "default" : "ghost"}
                size="sm"
                onClick={item.onClick}
                className="flex-shrink-0"
              >
                {item.icon}
                <span className="ml-1.5">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
