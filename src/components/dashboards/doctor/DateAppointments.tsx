import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, UserCheck, Calendar as CalendarClock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateAppointmentsProps {
  onPatientArrived?: () => void;
  refreshTrigger?: React.MutableRefObject<(() => void) | null>;
}

export const DateAppointments = ({ onPatientArrived, refreshTrigger }: DateAppointmentsProps) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<any[]>([]);
  const [selectedDateCount, setSelectedDateCount] = useState(0);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const fetchSelectedDateAppointments = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      const { data: appointmentsData, count } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(first_name, last_name, date_of_birth, gender)
        `, { count: 'exact' })
        .eq('scheduled_date', dateString)
        .in('status', ['scheduled', 'arrived'])
        .order('start_time');

      setSelectedDateAppointments(appointmentsData || []);
      setSelectedDateCount(count || 0);
    } catch (error) {
      console.error('Error fetching selected date appointments:', error);
    }
  };

  // Expose refresh function via refreshTrigger ref
  useEffect(() => {
    if (refreshTrigger) {
      refreshTrigger.current = fetchSelectedDateAppointments;
    }
  }, [refreshTrigger, fetchSelectedDateAppointments]);

  // Fetch appointments for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchSelectedDateAppointments();
    }
  }, [selectedDate, fetchSelectedDateAppointments]);

  // Set up real-time listener for appointment updates
  useEffect(() => {
    const channel = supabase
      .channel('appointment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        () => {
          fetchSelectedDateAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, fetchSelectedDateAppointments]);

  const markAsArrived = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient marked as arrived",
      });

      // Refresh the appointments list immediately
      fetchSelectedDateAppointments();
      
      // Wait 2 seconds then trigger callback to refresh other components (Scheduled Patients Queue)
      setTimeout(() => {
        if (onPatientArrived) {
          onPatientArrived();
        }
      }, 2000);
    } catch (error) {
      console.error('Error marking patient as arrived:', error);
      toast({
        title: "Error",
        description: "Failed to mark patient as arrived. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });

      fetchSelectedDateAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !newDate || !newStartTime || !newEndTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields for rescheduling.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          scheduled_date: format(newDate, 'yyyy-MM-dd'),
          start_time: newStartTime,
          end_time: newEndTime
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });

      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      setNewDate(undefined);
      setNewStartTime('');
      setNewEndTime('');
      fetchSelectedDateAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openRescheduleDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setNewDate(new Date(appointment.scheduled_date));
    setNewStartTime(appointment.start_time);
    setNewEndTime(appointment.end_time);
    setRescheduleDialogOpen(true);
  };

  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Appointments by Date</CardTitle>
        <CardDescription>Select a date to view appointments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Appointments</h4>
            <Badge variant="secondary">{selectedDateCount} appointments</Badge>
          </div>
          
          <div 
            className="space-y-2 overflow-y-auto" 
            style={{ 
              maxHeight: selectedDateAppointments.length > 3 ? '280px' : 'auto',
              height: selectedDateAppointments.length > 0 ? 'auto' : '120px'
            }}
          >
            {selectedDateAppointments.length > 0 ? (
              selectedDateAppointments.map((appointment) => (
                 <div key={appointment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 flex-wrap">
                       <p className="font-medium">
                         {appointment.patients?.first_name} {appointment.patients?.last_name}
                       </p>
                       {appointment.patients?.date_of_birth && (
                         <span className="text-sm text-muted-foreground">
                           Age {differenceInYears(new Date(), new Date(appointment.patients.date_of_birth))}
                         </span>
                       )}
                       {appointment.patients?.gender && (
                         <span className="text-sm text-muted-foreground">• {appointment.patients.gender}</span>
                       )}
                     </div>
                     <p className="text-sm text-muted-foreground">
                       {format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${appointment.end_time}`), 'h:mm a')}
                     </p>
                     {appointment.notes && (
                       <p className="text-xs text-muted-foreground">{appointment.notes}</p>
                     )}
                   </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={appointment.status === 'arrived' ? 'default' : 'outline'}>
                        {appointment.status}
                      </Badge>
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsArrived(appointment.id)}
                            className="text-xs"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            Mark Arrived
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRescheduleDialog(appointment)}
                            className="text-xs"
                          >
                            <CalendarClock className="h-3 w-3 mr-1" />
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No appointments for {format(selectedDate, "PPP")}
              </p>
            )}
          </div>
        </div>
      </CardContent>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Reschedule appointment for {selectedAppointment?.patients?.first_name} {selectedAppointment?.patients?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={rescheduleAppointment}>
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};