import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';


const patientSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female'], {
    required_error: 'Please select a gender',
  }),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  blood_group: z.string().optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationFormProps {
  isOpen: boolean;
  onClose: () => void;
  patientData?: any;
  readOnly?: boolean;
  onSuccess?: () => void;
}

const PatientRegistrationForm = ({ isOpen, onClose, patientData, readOnly = false, onSuccess }: PatientRegistrationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: undefined,
      phone: '',
      email: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      blood_group: '',
      allergies: '',
      medical_history: '',
    },
  });

  useEffect(() => {
    if (patientData) {
      form.reset({
        first_name: patientData.first_name || '',
        last_name: patientData.last_name || '',
        date_of_birth: patientData.date_of_birth || '',
        gender: patientData.gender || undefined,
        phone: patientData.phone || '',
        email: patientData.email || '',
        address: patientData.address || '',
        emergency_contact_name: patientData.emergency_contact_name || '',
        emergency_contact_phone: patientData.emergency_contact_phone || '',
        blood_group: patientData.blood_group || '',
        allergies: patientData.allergies || '',
        medical_history: patientData.medical_history || '',
      });
    } else {
      form.reset({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: undefined,
        phone: '',
        email: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        blood_group: '',
        allergies: '',
        medical_history: '',
      });
    }
  }, [patientData, form]);

  const createAutomaticAppointment = async (patientId: string, hospitalId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAppointments, error: fetchError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('hospital_id', hospitalId)
        .eq('scheduled_date', today)
        .order('start_time', { ascending: true });

      if (fetchError) throw fetchError;

      const generateTimeSlots = () => {
        const slots = [];
        const startHour = 8;
        const endHour = 17;
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
            slots.push(timeString);
          }
        }
        return slots;
      };

      const timeSlots = generateTimeSlots();

      let availableSlot = null;
      let availableEndTime = null;

      for (const slot of timeSlots) {
        const [hours, minutes] = slot.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + 15 * 60000);
        const endTimeString = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`;

        const hasConflict = existingAppointments?.some(apt => {
          const existingStart = apt.start_time;
          const existingEnd = apt.end_time;
          return (slot < existingEnd && endTimeString > existingStart);
        });

        if (!hasConflict) {
          availableSlot = slot;
          availableEndTime = endTimeString;
          break;
        }
      }

      if (!availableSlot) {
        return {
          success: false,
          error: 'No available slots for today. Please schedule manually.'
        };
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: patientId,
            hospital_id: hospitalId,
            scheduled_date: today,
            start_time: availableSlot,
            end_time: availableEndTime,
            status: 'scheduled',
            created_by: user.id,
          }
        ]);

      if (appointmentError) throw appointmentError;

      return {
        success: true,
        appointmentTime: `${today} from ${availableSlot.substring(0, 5)} to ${availableEndTime.substring(0, 5)}`
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const onSubmit = async (data: PatientFormData) => {
    if (readOnly) return;

    if (!user || !profile) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to register patients',
        variant: 'destructive',
      });
      return;
    }

    if (!profile.hospital_id) {
      toast({
        title: 'Hospital Assignment Error',
        description: 'You must be assigned to a hospital to register patients',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            emergency_contact_name: data.emergency_contact_name || null,
            emergency_contact_phone: data.emergency_contact_phone || null,
            blood_group: data.blood_group || null,
            allergies: data.allergies || null,
            medical_history: data.medical_history || null,
            registered_by: user.id,
            hospital_id: profile.hospital_id,
          },
        ])
        .select('id')
        .single();

      if (patientError) throw patientError;

      const appointmentResult = await createAutomaticAppointment(
        patientData.id, 
        profile.hospital_id
      );

      if (!appointmentResult.success) {
        toast({
          title: 'Patient Registered',
          description: `Patient registered successfully, but couldn't create automatic appointment: ${appointmentResult.error}`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Success',
          description: `Patient registered and appointment scheduled for ${appointmentResult.appointmentTime}`,
          variant: 'default',
        });
      }


      setShowSuccess(true);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register patient',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {readOnly ? 'Patient Information' : 'Patient Registration'}
            </DialogTitle>
            <DialogDescription>
              {readOnly 
                ? 'View patient information' 
                : 'Register a new patient in the hospital system'
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date_of_birth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={readOnly}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter address" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter blood group (e.g., A+, B-, O+)" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Known Allergies</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter any known allergies" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medical_history"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter relevant medical history" {...field} disabled={readOnly} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact name" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact phone" {...field} disabled={readOnly} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!readOnly && (
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register Patient'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={handleCloseSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registration Successful!</DialogTitle>
            <DialogDescription>
              The patient has been successfully registered in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleCloseSuccess}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientRegistrationForm;