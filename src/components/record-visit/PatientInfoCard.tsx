import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Appointment } from "@/types/recordVisit";

interface VitalSigns {
  id: string;
  body_temperature: number | null;
  heart_rate: number | null;
  weight: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  oxygen_saturation: number | null;
  complaints: string | null;
  recorded_at: string;
}

interface PatientInfoCardProps {
  appointment: Appointment;
}

export const PatientInfoCard = ({ appointment }: PatientInfoCardProps) => {
  const [latestVitals, setLatestVitals] = useState<VitalSigns | null>(null);
  const [isLoadingVitals, setIsLoadingVitals] = useState(true);

  useEffect(() => {
    const fetchLatestVitals = async () => {
      try {
        const { data, error } = await supabase
          .from('vital_signs')
          .select('*')
          .eq('patient_id', appointment.patient_id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching vital signs:', error);
        } else if (data) {
          setLatestVitals(data);
        }
      } catch (error) {
        console.error('Error fetching vital signs:', error);
      } finally {
        setIsLoadingVitals(false);
      }
    };

    if (appointment.patient_id) {
      fetchLatestVitals();
    } else {
      setIsLoadingVitals(false);
    }
  }, [appointment.patient_id]);

  const formatBloodPressure = (systolic: number | null, diastolic: number | null) => {
    if (systolic && diastolic) {
      return `${systolic}/${diastolic} mmHg`;
    }
    return "Not recorded";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
        <CardDescription>Patient details for this visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="patient-name">Patient Name</Label>
          <Input
            id="patient-name"
            value={`${appointment.patients.first_name} ${appointment.patients.last_name}`}
            disabled
            className="bg-muted"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input value={appointment.scheduled_date} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Time</Label>
            <Input value={`${appointment.start_time} - ${appointment.end_time}`} disabled className="bg-muted" />
          </div>
        </div>

        <Separator className="my-4" />

        {/* Latest Vital Signs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Latest Vital Signs</h4>
            {latestVitals && (
              <span className="text-xs text-muted-foreground">
                Recorded: {new Date(latestVitals.recorded_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {isLoadingVitals ? (
            <div className="text-sm text-muted-foreground">Loading vitals...</div>
          ) : latestVitals ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Temperature</Label>
                  <Input
                    value={latestVitals.body_temperature ? `${latestVitals.body_temperature}°C` : "Not recorded"}
                    disabled
                    className="bg-muted text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Heart Rate</Label>
                  <Input
                    value={latestVitals.heart_rate ? `${latestVitals.heart_rate} bpm` : "Not recorded"}
                    disabled
                    className="bg-muted text-sm h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Weight</Label>
                  <Input
                    value={latestVitals.weight ? `${latestVitals.weight} kg` : "Not recorded"}
                    disabled
                    className="bg-muted text-sm h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Oxygen Saturation</Label>
                  <Input
                    value={latestVitals.oxygen_saturation ? `${latestVitals.oxygen_saturation}%` : "Not recorded"}
                    disabled
                    className="bg-muted text-sm h-8"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Blood Pressure</Label>
                <Input
                  value={formatBloodPressure(latestVitals.blood_pressure_systolic, latestVitals.blood_pressure_diastolic)}
                  disabled
                  className="bg-muted text-sm h-8"
                />
              </div>

              {latestVitals.complaints && (
                <div>
                  <Label className="text-xs">Latest Complaints</Label>
                  <Input
                    value={latestVitals.complaints}
                    disabled
                    className="bg-muted text-sm h-8"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No vital signs recorded yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};