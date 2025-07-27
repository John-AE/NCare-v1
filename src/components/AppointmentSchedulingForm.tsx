import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface AppointmentSchedulingFormProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedPatient?: any;
  onSuccess?: () => void;
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

const AppointmentSchedulingForm = ({ isOpen, onClose, preSelectedPatient, onSuccess }: AppointmentSchedulingFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
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

  // Fetch booked slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedDate]);

  const fetchBookedSlots = async () => {
    if (!selectedDate) return;

    try {
      const { data } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('scheduled_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('status', 'scheduled');

      if (data) {
        const bookedTimes = data.map(appointment => appointment.start_time);
        setBookedSlots(bookedTimes);
      }
    } catch (error) {
      console.error('Error fetching booked slots:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedPatient || !selectedTimeSlot || !profile) return;

    setLoading(true);
    try {
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // Add 15 minutes
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: selectedPatient,
          doctor_id: selectedDoctor || null,
          scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTimeSlot,
          end_time: endTime,
          created_by: profile.user_id,
          hospital_id: profile.hospital_id
        });

      if (error) {
        // Check if it's a unique constraint violation (double booking)
        if (error.code === '23505' && error.message.includes('appointments_unique_time_slot')) {
          toast({
            title: "Time Slot Unavailable",
            description: "This time slot has already been booked by another user. Please select a different time.",
            variant: "destructive",
          });
          // Refresh the booked slots to show current availability
          await fetchBookedSlots();
          setSelectedTimeSlot(""); // Clear the selected slot
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });

      // Reset form
      setSelectedDate(undefined);
      setSelectedPatient("");
      setSelectedDoctor("");
      setSelectedTimeSlot("");
      setPatientSearch("");
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient
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

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
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
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Set to start of today
                    return date < today;
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem
                      key={slot}
                      value={slot}
                      disabled={bookedSlots.includes(slot)}
                    >
                      {slot} {bookedSlots.includes(slot) ? "(Booked)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedDate || !selectedPatient || !selectedTimeSlot || loading}
            >
              {loading ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentSchedulingForm;