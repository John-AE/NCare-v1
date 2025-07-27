import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PharmacyDashboardStats {
  totalMedications: number;
  lowStockAlerts: number;
  totalInventoryValue: number;
  dispensedToday: number;
}

export const usePharmacyDashboard = () => {
  const [stats, setStats] = useState<PharmacyDashboardStats>({
    totalMedications: 0,
    lowStockAlerts: 0,
    totalInventoryValue: 0,
    dispensedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total medications
        const { count: medicationsCount } = await supabase
          .from('medications')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get low stock alerts
        const { data: lowStockData } = await supabase
          .rpc('get_low_stock_medications');

        // Get total inventory value
        const { data: inventoryData } = await supabase
          .from('medication_inventory')
          .select('total_cost');

        const totalValue = inventoryData?.reduce((sum, item) => sum + (item.total_cost || 0), 0) || 0;

        // Get dispensed today
        const today = new Date().toISOString().split('T')[0];
        const { count: dispensedCount } = await supabase
          .from('medication_dispensing')
          .select('*', { count: 'exact', head: true })
          .gte('dispensed_at', today)
          .lt('dispensed_at', `${today}T23:59:59.999Z`);

        setStats({
          totalMedications: medicationsCount || 0,
          lowStockAlerts: lowStockData?.length || 0,
          totalInventoryValue: totalValue,
          dispensedToday: dispensedCount || 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};