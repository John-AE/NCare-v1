import { useState } from "react";
import { format, differenceInYears } from "date-fns";
import { Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../../AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
}

interface VitalsRecordingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSuccess?: () => void;
}

export const VitalsRecordingDialog = ({ isOpen, onClose, patient, onSuccess }: VitalsRecordingDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vitals, setVitals] = useState({
    body_temperature: "",
    heart_rate: "",
    weight: "",
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    oxygen_saturation: "",
    complaints: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!patient || !profile?.user_id) {
      toast({
        title: "Error",
        description: "Patient or user information is missing",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('vital_signs')
        .insert({
          patient_id: patient.id,
          recorded_by: profile.user_id,
          hospital_id: profile.hospital_id,
          body_temperature: vitals.body_temperature ? parseFloat(vitals.body_temperature) : null,
          heart_rate: vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
          weight: vitals.weight ? parseFloat(vitals.weight) : null,
          blood_pressure_systolic: vitals.blood_pressure_systolic ? parseInt(vitals.blood_pressure_systolic) : null,
          blood_pressure_diastolic: vitals.blood_pressure_diastolic ? parseInt(vitals.blood_pressure_diastolic) : null,
          oxygen_saturation: vitals.oxygen_saturation ? parseFloat(vitals.oxygen_saturation) : null,
          complaints: vitals.complaints || null,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      });

      // Reset form and close dialog
      setVitals({
        body_temperature: "",
        heart_rate: "",
        weight: "",
        blood_pressure_systolic: "",
        blood_pressure_diastolic: "",
        oxygen_saturation: "",
        complaints: "",
      });
      
      // Trigger refresh immediately
        if (onSuccess) {
          onSuccess();
        }
      
      onClose();
    } catch (error) {
      console.error('Error recording vital signs:', error);
      toast({
        title: "Error",
        description: "Failed to record vital signs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patient) return null;

  const age = differenceInYears(new Date(), new Date(patient.date_of_birth));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Record Vital Signs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <div className="rounded-lg border border-border p-4 bg-muted/50">
            <h3 className="font-medium text-foreground mb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{patient.first_name} {patient.last_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Gender:</span>
                <span className="ml-2">{patient.gender}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Age:</span>
                <span className="ml-2">{age} years</span>
              </div>
              <div>
                <span className="text-muted-foreground">DOB:</span>
                <span className="ml-2">{format(new Date(patient.date_of_birth), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Vital Signs Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Body Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={vitals.body_temperature}
                  onChange={(e) => handleInputChange('body_temperature', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  type="number"
                  placeholder="72"
                  value={vitals.heart_rate}
                  onChange={(e) => handleInputChange('heart_rate', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  value={vitals.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
                <Input
                  id="oxygen"
                  type="number"
                  step="0.1"
                  placeholder="98.0"
                  value={vitals.oxygen_saturation}
                  onChange={(e) => handleInputChange('oxygen_saturation', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Blood Pressure (mmHg)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="120"
                  value={vitals.blood_pressure_systolic}
                  onChange={(e) => handleInputChange('blood_pressure_systolic', e.target.value)}
                />
                <span className="text-muted-foreground">/</span>
                <Input
                  type="number"
                  placeholder="80"
                  value={vitals.blood_pressure_diastolic}
                  onChange={(e) => handleInputChange('blood_pressure_diastolic', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaints">Patient Complaints</Label>
              <Textarea
                id="complaints"
                placeholder="Describe the patient's main complaints or symptoms..."
                value={vitals.complaints}
                onChange={(e) => handleInputChange('complaints', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Vitals"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};