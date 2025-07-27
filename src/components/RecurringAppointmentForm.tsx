import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarIcon } from "lucide-react";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface RecurringAppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPatient?: any;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface Doctor {
  id: string;
  username: string;
  user_id: string;
}

const RecurringAppointmentForm = ({ isOpen, onClose, preSelectedPatient }: RecurringAppointmentFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate time slots from 8AM to 5PM in 15-minute blocks
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Fetch patients and doctors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patients
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, first_name, last_name')
          .order('first_name');
        
        if (patientsData) setPatients(patientsData);

        // Fetch doctors
        const { data: doctorsData } = await supabase
          .from('profiles')
          .select('id, username, user_id')
          .eq('role', 'doctor');
        
        if (doctorsData) setDoctors(doctorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
      
      // Pre-fill patient if provided
      if (preSelectedPatient) {
        setSelectedPatient(preSelectedPatient.id);
        setPatientSearch(`${preSelectedPatient.first_name} ${preSelectedPatient.last_name}`);
        setFilteredPatients([]);
      }
    }
  }, [isOpen, preSelectedPatient]);

  // Filter patients based on search
  useEffect(() => {
    if (patientSearch.trim() === "") {
      setFilteredPatients([]);
    } else {
      const filtered = patients.filter(patient =>
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [patientSearch, patients]);

  const generateRecurringDates = (start: Date, end: Date, freq: string): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      
      switch (freq) {
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'biweekly':
          currentDate = addWeeks(currentDate, 2);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        default:
          return dates;
      }
    }

    return dates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !selectedPatient || !selectedTimeSlot || !frequency || !profile) return;

    setLoading(true);
    try {
      const dates = generateRecurringDates(startDate, endDate, frequency);
      
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const endTimeDate = new Date();
      endTimeDate.setHours(hours, minutes + 15, 0, 0); // Add 15 minutes
      const endTime = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}`;

      const appointments = dates.map(date => ({
        patient_id: selectedPatient,
        doctor_id: selectedDoctor || null,
        scheduled_date: format(date, 'yyyy-MM-dd'),
        start_time: selectedTimeSlot,
        end_time: endTime,
        created_by: profile.user_id,
        hospital_id: profile.hospital_id,
        notes: `Recurring appointment - ${frequency}`
      }));

      const { error } = await supabase
        .from('appointments')
        .insert(appointments);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `${appointments.length} recurring appointments scheduled successfully`,
      });

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedPatient("");
      setSelectedDoctor("");
      setSelectedTimeSlot("");
      setFrequency("");
      setPatientSearch("");
      onClose();
    } catch (error) {
      console.error('Error scheduling recurring appointments:', error);
      toast({
        title: "Error",
        description: "Failed to schedule recurring appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Up Recurring Appointments</DialogTitle>
          <DialogDescription>
            Schedule recurring appointments for regular checkups
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            <Input
              id="patient"
              placeholder="Search patient by name..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              disabled={!!preSelectedPatient}
            />
            {filteredPatients.length > 0 && !preSelectedPatient && (
              <div className="max-h-32 overflow-y-auto border rounded-md">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setSelectedPatient(patient.id);
                      setPatientSearch(`${patient.first_name} ${patient.last_name}`);
                      setFilteredPatients([]);
                    }}
                  >
                    {patient.first_name} {patient.last_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2">
            <Label>Doctor (Optional)</Label>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Select a doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.user_id}>
                    Dr. {doctor.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Selection */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date Selection */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick end date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return startDate ? date < startDate : date < today;
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <Label>Time Slot</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!startDate || !endDate || !selectedPatient || !selectedTimeSlot || !frequency || loading}
            >
              {loading ? "Creating..." : "Create Recurring Appointments"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringAppointmentForm;