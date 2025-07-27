import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt } from "lucide-react";
import { Appointment, Service, Prescription, CustomPrescription } from "@/types/recordVisit";

interface BillPreviewDialogProps {
  showBillPreview: boolean;
  setShowBillPreview: (show: boolean) => void;
  prescriptions: Prescription[];
  customPrescriptions: CustomPrescription[];
  appointment: Appointment | null;
  services: Service[];
  calculateTotal: () => number;
  handleSaveVisit: () => void;
  saving: boolean;
  profile: any;
}

export const BillPreviewDialog = ({
  showBillPreview,
  setShowBillPreview,
  prescriptions,
  customPrescriptions,
  appointment,
  services,
  calculateTotal,
  handleSaveVisit,
  saving,
  profile
}: BillPreviewDialogProps) => {
  return (
    <Dialog open={showBillPreview} onOpenChange={setShowBillPreview}>
      <DialogTrigger asChild>
        <Button disabled={prescriptions.length === 0 && customPrescriptions.length === 0}>
          <Receipt className="h-4 w-4 mr-2" />
          Preview Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bill Preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold">Patient: {appointment?.patients.first_name} {appointment?.patients.last_name}</h3>
            <p className="text-sm text-muted-foreground">Visit Date: {appointment?.scheduled_date}</p>
            <p className="text-sm text-muted-foreground">Doctor: Dr. {profile?.username}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Services & Medications</h4>
            <div className="space-y-2">
              {prescriptions.filter(p => p.serviceId).map((prescription, index) => {
                const service = services.find(s => s.id === prescription.serviceId);
                if (!service) return null;
                return (
                  <div key={index} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {prescription.quantity}</p>
                      {prescription.instructions && (
                        <p className="text-xs text-muted-foreground">{prescription.instructions}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₦{(service.price * prescription.quantity).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">₦{service.price.toLocaleString()} each</p>
                    </div>
                  </div>
                );
              })}
              
              {customPrescriptions.map((prescription) => (
                <div key={prescription.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <p className="font-medium">{prescription.medicine}</p>
                    <p className="text-sm text-muted-foreground">{prescription.dosage} • {prescription.frequency}</p>
                    {prescription.otherDetails && (
                      <p className="text-xs text-muted-foreground">{prescription.otherDetails}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{prescription.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Custom prescription</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Grand Total:</span>
              <span>₦{calculateTotal().toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveVisit} disabled={saving} className="flex-1">
              {saving ? "Generating..." : "Generate Final Bill"}
            </Button>
            <Button variant="outline" onClick={() => setShowBillPreview(false)}>
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};