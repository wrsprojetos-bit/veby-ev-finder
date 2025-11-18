import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAdminRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking admin role:", error);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setRole(null);
        } else if (data) {
          console.log("User role found:", data.role, "User ID:", user.id);
          setRole(data.role);
          setIsAdmin(true);
          setIsSuperAdmin(data.role === "super_admin");
        } else {
          console.log("No role found for user:", user.id);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setRole(null);
        }
      } catch (error) {
        console.error("Error in checkAdminRole:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, isSuperAdmin, role, loading };
};
