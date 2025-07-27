import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PatientManagementProps {
  onRegisterPatient: () => void;
  onScheduleAppointment: () => void;
  onPatientSelect: (patient: any) => void;
}

export const PatientManagement = ({ 
  onRegisterPatient, 
  onScheduleAppointment, 
  onPatientSelect 
}: PatientManagementProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Fetch all patients for search
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();

    // Set up real-time listener for patients list
    const patientsListChannel = supabase
      .channel('patients-list-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'patients' },
        (payload) => {
          setPatients(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(patientsListChannel);
    };
  }, []);

  // Filter patients based on search query (name or phone)
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients([]);
    } else {
      const filtered = patients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase();
        const phone = patient.phone?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || phone.includes(query);
      });
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const handlePatientSelect = (patient: any) => {
    setSelectedPatient(patient);
    onPatientSelect(patient);
  };

  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Patient Management</CardTitle>
        <CardDescription>Register new patients and search existing records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full justify-start" 
          size="lg"
          onClick={onRegisterPatient}
        >
          Register New Patient
        </Button>
        
        <div className="space-y-3">
          <div>
            <Input
              placeholder="Search patients by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          {filteredPatients.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2">
              {filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Phone: {patient.phone || 'N/A'} • DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {selectedPatient && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-semibold mb-3">{selectedPatient.first_name} {selectedPatient.last_name}</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> {selectedPatient.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {selectedPatient.phone || 'N/A'}</p>
                <p><span className="font-medium">Gender:</span> {selectedPatient.gender}</p>
                <p><span className="font-medium">Blood Group:</span> {selectedPatient.blood_group || 'N/A'}</p>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onScheduleAppointment}
                >
                  Schedule Appointment
                </Button>
                <Button size="sm" variant="outline">Print History</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};