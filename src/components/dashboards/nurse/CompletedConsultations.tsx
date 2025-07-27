import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Eye } from "lucide-react";

interface CompletedVisit {
  id: string;
  patient_name: string;
  complaints: string;
  diagnosis: string;
  treatment_plan: string;
  prescriptions: string;
  visit_date: string;
  visit_time: string;
}

export const CompletedConsultations = () => {
  const [completedVisits, setCompletedVisits] = useState<CompletedVisit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<CompletedVisit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedVisits = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('visits')
          .select(`
            id,
            complaints,
            diagnosis,
            treatment_plan,
            prescriptions,
            visit_date,
            visit_time,
            patients!inner(first_name, last_name)
          `)
          .eq('visit_date', today)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedVisits = data.map(visit => ({
          id: visit.id,
          patient_name: `${visit.patients.first_name} ${visit.patients.last_name}`,
          complaints: visit.complaints || '',
          diagnosis: visit.diagnosis || '',
          treatment_plan: visit.treatment_plan || '',
          prescriptions: visit.prescriptions || '', // Remove reference to non-existent field
          visit_date: visit.visit_date,
          visit_time: visit.visit_time,
        }));

        setCompletedVisits(formattedVisits);
      } catch (error) {
        console.error('Error fetching completed visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedVisits();

    // Set up real-time listener for new visits
    const channel = supabase
      .channel('completed-visits')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'visits' },
        () => {
          fetchCompletedVisits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-l-8 border-l-[#65A30D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Doctor Consultation Completed
            <Badge variant="outline" className="ml-auto">
              {completedVisits.length} patients
            </Badge>
          </CardTitle>
          <CardDescription>Recently completed patient consultations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-8 border-l-[#65A30D]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Doctor Consultation Completed
            <Badge variant="outline" className="ml-auto">
              {completedVisits.length} patients
            </Badge>
          </CardTitle>
          <CardDescription>Recently completed patient consultations</CardDescription>
        </CardHeader>
        <CardContent>
          {completedVisits.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No completed consultations today
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {completedVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedVisit(visit)}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-foreground">{visit.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {visit.visit_time} - {visit.visit_date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Completed</Badge>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedVisit} onOpenChange={() => setSelectedVisit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visit Details - {selectedVisit?.patient_name}</DialogTitle>
            <DialogDescription>
              Consultation completed on {selectedVisit?.visit_date} at {selectedVisit?.visit_time}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-4">
              <div>
                <Label>Patient Complaints</Label>
                <Textarea
                  value={selectedVisit.complaints}
                  readOnly
                  rows={1}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No complaints recorded"
                />
              </div>
              
              <div>
                <Label>Diagnosis</Label>
                <Textarea
                  value={selectedVisit.diagnosis}
                  readOnly
                  rows={1}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No diagnosis recorded"
                />
              </div>
              
              <div>
                <Label>Lab work Requisition</Label>
                <Textarea
                  value={selectedVisit.treatment_plan}
                  readOnly
                  rows={1}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No lab work requisition recorded"
                />
              </div>

              <div>
                <Label>Prescriptions (Pharmacy)</Label>
                <Textarea
                  value={selectedVisit.prescriptions}
                  readOnly
                  rows={1}
                  className="mt-1 bg-muted resize-none"
                  placeholder="No prescriptions recorded"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};