import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VisitData } from "@/types/recordVisit";

interface VisitDetailsCardProps {
  visitData: VisitData;
  setVisitData: (data: VisitData) => void;
}

export const VisitDetailsCard = ({ visitData, setVisitData }: VisitDetailsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit Details</CardTitle>
        <CardDescription>Record the details of this patient visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="complaints">Patient Complaints</Label>
          <Textarea
            id="complaints"
            placeholder="Enter patient complaints..."
            value={visitData.complaints}
            onChange={(e) => setVisitData({...visitData, complaints: e.target.value})}
            rows={1}
            className="resize-none"
          />
        </div>
        <div>
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Textarea
            id="diagnosis"
            placeholder="Enter diagnosis..."
            value={visitData.diagnosis}
            onChange={(e) => setVisitData({...visitData, diagnosis: e.target.value})}
            rows={1}
            className="resize-none"
          />
        </div>
        <div>
          <Label htmlFor="lab-work">Lab work Requisition</Label>
          <Textarea
            id="lab-work"
            placeholder="Enter lab work requisition..."
            value={visitData.treatment_plan}
            onChange={(e) => setVisitData({...visitData, treatment_plan: e.target.value})}
            rows={1}
            className="resize-none"
          />
        </div>
        <div>
          <Label htmlFor="prescriptions">Prescriptions (Pharmacy)</Label>
          <Textarea
            id="prescriptions"
            placeholder="Enter prescriptions..."
            value={visitData.prescriptions || ''}
            onChange={(e) => setVisitData({...visitData, prescriptions: e.target.value})}
            rows={2}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
};