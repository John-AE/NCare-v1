import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const TodaysSchedule = () => {
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodaysSchedule = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's schedule with patient details
        const { data: scheduleData } = await supabase
          .from('appointments')
          .select(`
            *,
            patients(first_name, last_name)
          `)
          .eq('scheduled_date', today)
          .in('status', ['scheduled', 'arrived'])
          .order('start_time');

        setTodaysSchedule(scheduleData || []);
      } catch (error) {
        console.error('Error fetching today\'s schedule:', error);
      }
    };

    fetchTodaysSchedule();

    // Set up real-time listener for appointment updates
    const channel = supabase
      .channel('todays-schedule-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchTodaysSchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Today&apos;s Schedule</CardTitle>
        <CardDescription>Scheduled appointments for today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {todaysSchedule.length > 0 ? (
            todaysSchedule.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">
                    {appointment.patients?.first_name} {appointment.patients?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.start_time} - {appointment.end_time}
                  </p>
                  {appointment.notes && (
                    <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={appointment.status === 'arrived' ? 'default' : 'outline'}>
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No appointments scheduled for today</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};