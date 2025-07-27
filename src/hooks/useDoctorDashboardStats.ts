import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalAppointmentsToday: number;
  scheduledAppointments: number;
  arrivedPatients: number;
  completedAppointments: number;
  totalPatients: number;
  pendingBills: number;
  todaysRevenue: number;
}

export const useDoctorDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointmentsToday: 0,
    scheduledAppointments: 0,
    arrivedPatients: 0,
    completedAppointments: 0,
    totalPatients: 0,
    pendingBills: 0,
    todaysRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get current user's hospital_id
        const { data: profileData } = await supabase
          .from('profiles')
          .select('hospital_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        const hospitalId = profileData?.hospital_id;
        
        // Get today's appointments by status (filtered by hospital)
        const { data: appointmentsData } = await supabase
          .from('appointments')
          .select('status')
          .eq('scheduled_date', today)
          .eq('hospital_id', hospitalId);

        const appointmentCounts = {
          total: appointmentsData?.length || 0,
          scheduled: appointmentsData?.filter(apt => apt.status === 'scheduled').length || 0,
          arrived: appointmentsData?.filter(apt => apt.status === 'arrived').length || 0,
          completed: appointmentsData?.filter(apt => apt.status === 'completed').length || 0,
        };
        
        // Get total patients count (filtered by hospital)
        const { count: patientsCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('hospital_id', hospitalId);
        
        // Get pending bills count (filtered by hospital)
        const { count: billsCount } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true })
          .eq('is_paid', false)
          .eq('hospital_id', hospitalId);
        
        // Get today's revenue (sum of paid bills created today, filtered by hospital)
        const { data: revenueData } = await supabase
          .from('bills')
          .select('amount_paid')
          .eq('is_paid', true)
          .eq('hospital_id', hospitalId)
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        setStats({
          totalAppointmentsToday: appointmentCounts.total,
          scheduledAppointments: appointmentCounts.scheduled,
          arrivedPatients: appointmentCounts.arrived,
          completedAppointments: appointmentCounts.completed,
          totalPatients: patientsCount || 0,
          pendingBills: billsCount || 0,
          todaysRevenue: revenueData?.reduce((sum, bill) => sum + Number(bill.amount_paid), 0) || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();

    // Set up real-time listeners
    const patientsChannel = supabase
      .channel('patients-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'patients' },
        () => setStats(prev => ({ ...prev, totalPatients: prev.totalPatients + 1 }))
      )
      .subscribe();

    const billsChannel = supabase
      .channel('bills-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bills' },
        (payload) => {
          if (!payload.new.is_paid) {
            setStats(prev => ({ ...prev, pendingBills: prev.pendingBills + 1 }));
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bills' },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          setStats(prev => {
            let newStats = { ...prev };
            
            const today = new Date().toISOString().split('T')[0];
            const billDate = new Date(newRecord.created_at).toISOString().split('T')[0];
            const isTodaysBill = billDate === today;
            
            // If bill status changed from unpaid to paid
            if (!oldRecord.is_paid && newRecord.is_paid) {
              newStats.pendingBills = prev.pendingBills - 1;
              if (isTodaysBill) {
                newStats.todaysRevenue = prev.todaysRevenue + Number(newRecord.amount_paid);
              }
            }
            // If bill status changed from paid to unpaid
            else if (oldRecord.is_paid && !newRecord.is_paid) {
              newStats.pendingBills = prev.pendingBills + 1;
              if (isTodaysBill) {
                newStats.todaysRevenue = prev.todaysRevenue - Number(oldRecord.amount_paid);
              }
            }
            
            return newStats;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientsChannel);
      supabase.removeChannel(billsChannel);
    };
  }, []);

  return stats;
};