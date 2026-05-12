import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

export default function PlatformAdmin() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.rpc("approve_user", { p_user_id: userId });
      if (error) throw error;
      
      toast({ title: "Success", description: "User has been approved." });
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { error } = await supabase.rpc("reject_user", { p_user_id: userId });
      if (error) throw error;

      toast({ title: "Success", description: "User has been rejected." });
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-8">Platform Admin - Pending Approvals</h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : pendingUsers.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-lg shadow-sm">
            <p className="text-muted-foreground">No pending users found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-card border border-border rounded-lg p-6 flex justify-between items-center shadow-sm">
                <div>
                  <h3 className="font-semibold text-lg">{user.full_name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    <p>Role: <span className="font-medium capitalize text-foreground">{user.role.replace('_', ' ')}</span></p>
                    <p>Email: {user.email}</p>
                    {user.phone && <p>Phone: {user.phone}</p>}
                    {user.organization_name && <p>Organization: {user.organization_name}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleApprove(user.id)} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Check className="w-4 h-4" /> Approve
                  </Button>
                  <Button onClick={() => handleReject(user.id)} variant="destructive" className="gap-2">
                    <X className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
