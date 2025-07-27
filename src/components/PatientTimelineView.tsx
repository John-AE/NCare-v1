import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Search, Calendar, FileText, Download, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  gender: string;
}

interface VisitRecord {
  id: string;
  visit_date: string;
  visit_time: string;
  complaints: string;
  diagnosis: string;
  treatment_plan: string;
  prescriptions: string;
  doctor_name: string;
  vital_signs?: {
    body_temperature?: number;
    heart_rate?: number;
    blood_pressure_systolic?: number;
    blood_pressure_diastolic?: number;
    oxygen_saturation?: number;
    weight?: number;
    complaints?: string;
  };
  bills?: {
    id: string;
    amount: number;
    is_paid: boolean;
    created_at: string;
  }[];
}

interface PatientTimelineViewProps {
  onBack: () => void;
}

export const PatientTimelineView = ({ onBack }: PatientTimelineViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .eq('hospital_id', profile?.hospital_id)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      toast({
        title: "Error",
        description: "Failed to search patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientVisits = async (patientId: string) => {
    setLoading(true);
    try {
      // Fetch visits 
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('*')
        .eq('patient_id', patientId)
        .eq('hospital_id', profile?.hospital_id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      // Fetch vital signs for each visit
      const visitRecords: VisitRecord[] = [];
      
      for (const visit of visits || []) {
        // Fetch doctor information
        const { data: doctor } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', visit.doctor_id)
          .single();

        const { data: vitals } = await supabase
          .from('vital_signs')
          .select('*')
          .eq('patient_id', patientId)
          .gte('recorded_at', `${visit.visit_date}T00:00:00`)
          .lte('recorded_at', `${visit.visit_date}T23:59:59`)
          .order('recorded_at', { ascending: false })
          .limit(1);

        // Fetch bills for this visit
        const { data: bills } = await supabase
          .from('bills')
          .select('id, amount, is_paid, created_at')
          .eq('patient_id', patientId)
          .gte('created_at', `${visit.visit_date}T00:00:00`)
          .lte('created_at', `${visit.visit_date}T23:59:59`);

        visitRecords.push({
          id: visit.id,
          visit_date: visit.visit_date,
          visit_time: visit.visit_time,
          complaints: visit.complaints || '',
          diagnosis: visit.diagnosis || '',
          treatment_plan: visit.treatment_plan || '',
          prescriptions: visit.prescriptions || '',
          doctor_name: doctor?.username || 'Unknown Doctor',
          vital_signs: vitals?.[0] || undefined,
          bills: bills || []
        });
      }

      setVisitRecords(visitRecords);
    } catch (error) {
      console.error('Error fetching patient visits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patient visit history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!selectedPatient || !visitRecords.length) return;

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NCare Nigeria - Patient Visit History', 20, yPosition);
    yPosition += 10;

    // Patient Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient: ${selectedPatient.first_name} ${selectedPatient.last_name}`, 20, yPosition);
    yPosition += 6;
    doc.text(`DOB: ${selectedPatient.date_of_birth} | Gender: ${selectedPatient.gender}`, 20, yPosition);
    yPosition += 6;
    if (selectedPatient.phone) {
      doc.text(`Phone: ${selectedPatient.phone}`, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 6;

    // Visit Records
    visitRecords.forEach((visit, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Visit header
      doc.setFont('helvetica', 'bold');
      doc.text(`Visit ${index + 1} - ${visit.visit_date} at ${visit.visit_time}`, 20, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Doctor: ${visit.doctor_name}`, 20, yPosition);
      yPosition += 10;

      // Visit details
      if (visit.complaints) {
        doc.setFont('helvetica', 'bold');
        doc.text('Complaints:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 4;
        const complaintsLines = doc.splitTextToSize(visit.complaints, 170);
        doc.text(complaintsLines, 25, yPosition);
        yPosition += complaintsLines.length * 4 + 4;
      }

      if (visit.diagnosis) {
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnosis:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 4;
        const diagnosisLines = doc.splitTextToSize(visit.diagnosis, 170);
        doc.text(diagnosisLines, 25, yPosition);
        yPosition += diagnosisLines.length * 4 + 4;
      }

      if (visit.treatment_plan) {
        doc.setFont('helvetica', 'bold');
        doc.text('Lab Work Requisition:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 4;
        const treatmentLines = doc.splitTextToSize(visit.treatment_plan, 170);
        doc.text(treatmentLines, 25, yPosition);
        yPosition += treatmentLines.length * 4 + 4;
      }

      if (visit.prescriptions) {
        doc.setFont('helvetica', 'bold');
        doc.text('Prescriptions:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 4;
        const prescriptionLines = doc.splitTextToSize(visit.prescriptions, 170);
        doc.text(prescriptionLines, 25, yPosition);
        yPosition += prescriptionLines.length * 4 + 4;
      }

      // Vital Signs
      if (visit.vital_signs) {
        doc.setFont('helvetica', 'bold');
        doc.text('Vital Signs:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        yPosition += 4;
        const vitals = visit.vital_signs;
        if (vitals.body_temperature) doc.text(`Temperature: ${vitals.body_temperature}°C`, 25, yPosition), yPosition += 4;
        if (vitals.heart_rate) doc.text(`Heart Rate: ${vitals.heart_rate} bpm`, 25, yPosition), yPosition += 4;
        if (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
          doc.text(`Blood Pressure: ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg`, 25, yPosition);
          yPosition += 4;
        }
        if (vitals.oxygen_saturation) doc.text(`Oxygen Saturation: ${vitals.oxygen_saturation}%`, 25, yPosition), yPosition += 4;
        if (vitals.weight) doc.text(`Weight: ${vitals.weight} kg`, 25, yPosition), yPosition += 4;
        yPosition += 4;
      }

      yPosition += 6;
    });

    // Save the PDF
    doc.save(`${selectedPatient.first_name}_${selectedPatient.last_name}_visit_history.pdf`);
    
    toast({
      title: "Success",
      description: "Patient visit history PDF generated successfully",
    });
  };

  const viewPatientBills = async (patientId: string) => {
    try {
      const { data: bills, error } = await supabase
        .from('bills')
        .select(`
          id,
          amount,
          amount_paid,
          is_paid,
          description,
          created_at,
          payment_method,
          bill_items(
            id,
            quantity,
            unit_price,
            total_price,
            services(name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (bills && bills.length > 0) {
        // Generate a PDF report of all bills for this patient
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Patient Bill History', 20, 20);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Patient: ${selectedPatient?.first_name} ${selectedPatient?.last_name}`, 20, 35);
        doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 45);

        // Bills table
        const tableData = bills.map(bill => [
          format(new Date(bill.created_at), 'MMM dd, yyyy'),
          bill.description || 'N/A',
          `₦${Number(bill.amount).toLocaleString()}`,
          `₦${Number(bill.amount_paid).toLocaleString()}`,
          bill.is_paid ? 'Paid' : 'Pending',
          bill.payment_method || 'N/A'
        ]);

        autoTable(doc, {
          head: [['Date', 'Description', 'Amount', 'Paid', 'Status', 'Method']],
          body: tableData,
          startY: 65,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`${selectedPatient?.first_name}_${selectedPatient?.last_name}_bills_history.pdf`);
        
        toast({
          title: "Success",
          description: `Found ${bills.length} bills. PDF downloaded successfully.`,
        });
      } else {
        toast({
          title: "Info",
          description: "No bills found for this patient",
        });
      }
    } catch (error) {
      console.error('Error fetching patient bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch patient bills",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Patient Visit Timeline</h1>
          <p className="text-muted-foreground">Search and view complete patient visit history</p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by patient name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
              className="flex-1"
            />
            <Button onClick={searchPatients} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {patients.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Search Results:</h3>
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedPatient(patient);
                    fetchPatientVisits(patient.id);
                  }}
                >
                  <div>
                    <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.phone} • DOB: {patient.date_of_birth}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Timeline
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Timeline */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Timeline - {selectedPatient.first_name} {selectedPatient.last_name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  DOB: {selectedPatient.date_of_birth} • Gender: {selectedPatient.gender}
                  {selectedPatient.phone && ` • Phone: ${selectedPatient.phone}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewPatientBills(selectedPatient.id)}
                  className="flex items-center gap-2"
                >
                  <Receipt className="h-4 w-4" />
                  View Bills
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePDF}
                  className="flex items-center gap-2"
                  disabled={!visitRecords.length}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading visit history...</div>
            ) : visitRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No visit records found for this patient
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {visitRecords.map((visit, index) => (
                    <div key={visit.id} className="relative">
                      {index < visitRecords.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-full bg-border"></div>
                      )}
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">
                                {visit.visit_date} at {visit.visit_time}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Doctor: {visit.doctor_name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {visit.bills?.map(bill => (
                                <Badge
                                  key={bill.id}
                                  variant={bill.is_paid ? "default" : "secondary"}
                                >
                                  ₦{bill.amount.toLocaleString()} {bill.is_paid ? 'Paid' : 'Pending'}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Visit Details */}
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Visit Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-2">
                                {visit.complaints && (
                                  <div>
                                    <span className="font-medium">Complaints:</span>
                                    <p className="text-muted-foreground">{visit.complaints}</p>
                                  </div>
                                )}
                                {visit.diagnosis && (
                                  <div>
                                    <span className="font-medium">Diagnosis:</span>
                                    <p className="text-muted-foreground">{visit.diagnosis}</p>
                                  </div>
                                )}
                                {visit.treatment_plan && (
                                  <div>
                                    <span className="font-medium">Lab Work:</span>
                                    <p className="text-muted-foreground">{visit.treatment_plan}</p>
                                  </div>
                                )}
                                {visit.prescriptions && (
                                  <div>
                                    <span className="font-medium">Prescriptions:</span>
                                    <p className="text-muted-foreground">{visit.prescriptions}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Vital Signs */}
                            {visit.vital_signs && (
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Vital Signs</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                  {visit.vital_signs.body_temperature && (
                                    <div className="flex justify-between">
                                      <span>Temperature:</span>
                                      <span>{visit.vital_signs.body_temperature}°C</span>
                                    </div>
                                  )}
                                  {visit.vital_signs.heart_rate && (
                                    <div className="flex justify-between">
                                      <span>Heart Rate:</span>
                                      <span>{visit.vital_signs.heart_rate} bpm</span>
                                    </div>
                                  )}
                                  {visit.vital_signs.blood_pressure_systolic && (
                                    <div className="flex justify-between">
                                      <span>Blood Pressure:</span>
                                      <span>
                                        {visit.vital_signs.blood_pressure_systolic}/
                                        {visit.vital_signs.blood_pressure_diastolic} mmHg
                                      </span>
                                    </div>
                                  )}
                                  {visit.vital_signs.oxygen_saturation && (
                                    <div className="flex justify-between">
                                      <span>Oxygen Saturation:</span>
                                      <span>{visit.vital_signs.oxygen_saturation}%</span>
                                    </div>
                                  )}
                                  {visit.vital_signs.weight && (
                                    <div className="flex justify-between">
                                      <span>Weight:</span>
                                      <span>{visit.vital_signs.weight} kg</span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {index < visitRecords.length - 1 && (
                        <Separator className="mt-6" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};