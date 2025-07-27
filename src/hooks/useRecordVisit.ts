import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Appointment, Service, Prescription, VisitData, NewService, CustomPrescription } from "@/types/recordVisit";

export const useRecordVisit = (appointmentId: string | undefined) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [visitData, setVisitData] = useState<VisitData>({
    complaints: "",
    diagnosis: "",
    treatment_plan: ""
  });
  
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [customPrescriptions, setCustomPrescriptions] = useState<CustomPrescription[]>([]);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [newService, setNewService] = useState<NewService>({ 
    name: "", 
    description: "", 
    price: 0, 
    category: "" 
  });
  const [editingService, setEditingService] = useState<Service | null>(null);

  const fetchData = async () => {
    try {
      // Fetch appointment details
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(first_name, last_name)
        `)
        .eq('id', appointmentId)
        .single();

      setAppointment(appointmentData);

      // Fetch available services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load appointment details"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setServices(servicesData || []);
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { serviceId: "", quantity: 1, instructions: "" }]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const updatePrescription = (index: number, field: keyof Prescription, value: string | number) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const addCustomPrescription = (prescription: Omit<CustomPrescription, 'id'>) => {
    const newPrescription: CustomPrescription = {
      ...prescription,
      id: crypto.randomUUID(),
    };
    setCustomPrescriptions(prev => [...prev, newPrescription]);
  };

  const removeCustomPrescription = (id: string) => {
    setCustomPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const calculateTotal = () => {
    const servicesTotal = prescriptions.reduce((total, prescription) => {
      const service = services.find(s => s.id === prescription.serviceId);
      return total + (service ? service.price * prescription.quantity : 0);
    }, 0);
    
    const customPrescriptionsTotal = customPrescriptions.reduce((total, prescription) => {
      return total + prescription.price;
    }, 0);
    
    return servicesTotal + customPrescriptionsTotal;
  };

  const saveService = async () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(newService)
          .eq('id', editingService.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(newService);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Service ${editingService ? 'updated' : 'added'} successfully`,
      });

      setNewService({ name: "", description: "", price: 0, category: "" });
      setEditingService(null);
      setShowServiceDialog(false);
      fetchServices();

    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive"
      });
    }
  };

  const handleSaveVisit = async () => {
    if (!appointment || !profile) return;

    setSaving(true);
    try {
      // Create visit record
      const { data: visitRecord, error: visitError } = await supabase
        .from('visits')
        .insert({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: profile.user_id,
          visit_date: appointment.scheduled_date,
          visit_time: appointment.start_time,
          complaints: visitData.complaints,
          diagnosis: visitData.diagnosis,
          treatment_plan: visitData.treatment_plan,
          prescriptions: visitData.prescriptions,
          hospital_id: profile.hospital_id
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Create prescriptions
      if (prescriptions.length > 0) {
        const prescriptionInserts = prescriptions
          .filter(p => p.serviceId)
          .map(p => ({
            visit_id: visitRecord.id,
            service_id: p.serviceId,
            quantity: p.quantity,
            instructions: p.instructions
          }));

        if (prescriptionInserts.length > 0) {
          const { error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert(prescriptionInserts);

          if (prescriptionError) throw prescriptionError;

          // Create bill and bill items
          const totalAmount = prescriptions.reduce((sum, p) => {
            const service = services.find(s => s.id === p.serviceId);
            return sum + (service ? service.price * p.quantity : 0);
          }, 0);

          const { data: billData, error: billError } = await supabase
            .from('bills')
            .insert({
              patient_id: appointment.patient_id,
              amount: totalAmount,
              description: `Visit on ${appointment.scheduled_date}`,
              created_by: profile.user_id,
              hospital_id: profile.hospital_id
            })
            .select()
            .single();

          if (billError) throw billError;

          // Create bill items
          const billItems = prescriptions
            .filter(p => p.serviceId)
            .map(p => {
              const service = services.find(s => s.id === p.serviceId);
              return {
                bill_id: billData.id,
                service_id: p.serviceId,
                quantity: p.quantity,
                unit_price: service?.price || 0,
                total_price: (service?.price || 0) * p.quantity
              };
            });

          const { error: billItemsError } = await supabase
            .from('bill_items')
            .insert(billItems);

          if (billItemsError) throw billItemsError;
        }
      }

      // Update appointment status to completed
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointment.id);

      toast({
        title: "Success",
        description: "Visit recorded successfully and bill generated"
      });

      navigate('/doctor-dashboard');
    } catch (error) {
      console.error('Error saving visit:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save visit record"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchData();
    }
  }, [appointmentId]);

  return {
    // State
    appointment,
    services,
    loading,
    saving,
    visitData,
    setVisitData,
    prescriptions,
    setPrescriptions,
    customPrescriptions,
    showBillPreview,
    setShowBillPreview,
    showServiceDialog,
    setShowServiceDialog,
    newService,
    setNewService,
    editingService,
    setEditingService,
    // Functions
    addPrescription,
    removePrescription,
    updatePrescription,
    addCustomPrescription,
    removeCustomPrescription,
    calculateTotal,
    saveService,
    handleSaveVisit,
    navigate,
    profile
  };
};