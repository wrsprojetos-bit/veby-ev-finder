import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface StorageLog {
  id: string;
  user_id: string;
  listing_id: string | null;
  video_id: string | null;
  size_mb: number | null;
  duration_seconds: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface StorageStats {
  totalUploads: number;
  totalSizeMB: number;
  successfulUploads: number;
  failedUploads: number;
  averageSizeMB: number;
}

export const useStorageLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<StorageLog[]>([]);
  const [stats, setStats] = useState<StorageStats>({
    totalUploads: 0,
    totalSizeMB: 0,
    successfulUploads: 0,
    failedUploads: 0,
    averageSizeMB: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("storage_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setLogs(data);
        
        // Calcular estatísticas
        const totalUploads = data.length;
        const totalSizeMB = data.reduce((sum, log) => sum + (log.size_mb || 0), 0);
        const successfulUploads = data.filter(log => log.status === "completed").length;
        const failedUploads = data.filter(log => log.status === "failed").length;
        const averageSizeMB = totalUploads > 0 ? totalSizeMB / totalUploads : 0;

        setStats({
          totalUploads,
          totalSizeMB,
          successfulUploads,
          failedUploads,
          averageSizeMB,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  return {
    logs,
    stats,
    loading,
    refetch: fetchLogs,
  };
};
