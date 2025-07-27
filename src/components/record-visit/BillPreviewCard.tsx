import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { Service, Prescription, CustomPrescription } from "@/types/recordVisit";
import { BillPreviewDialog } from "./BillPreviewDialog";
import { PrescriptionDialog } from "./PrescriptionDialog";
import { useState } from "react";

interface BillPreviewCardProps {
  prescriptions: Prescription[];
  customPrescriptions: CustomPrescription[];
  services: Service[];
  calculateTotal: () => number;
  showBillPreview: boolean;
  setShowBillPreview: (show: boolean) => void;
  appointment: any;
  handleSaveVisit: () => void;  
  saving: boolean;
  profile: any;
  addCustomPrescription: (prescription: Omit<CustomPrescription, 'id'>) => void;
  removeCustomPrescription: (id: string) => void;
}

export const BillPreviewCard = ({
  prescriptions,
  customPrescriptions,
  services,
  calculateTotal,
  showBillPreview,
  setShowBillPreview,
  appointment,
  handleSaveVisit,
  saving,
  profile,
  addCustomPrescription,
  removeCustomPrescription
}: BillPreviewCardProps) => {
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Patient Billing
        </CardTitle>
        <CardDescription>Review and generate bill for this visit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPrescriptionDialog(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Prescription
          </Button>
          
          <BillPreviewDialog
            showBillPreview={showBillPreview}
            setShowBillPreview={setShowBillPreview}
            prescriptions={prescriptions}
            customPrescriptions={customPrescriptions}
            appointment={appointment}
            services={services}
            calculateTotal={calculateTotal}
            handleSaveVisit={handleSaveVisit}
            saving={saving}
            profile={profile}
          />
        </div>
        
        {(prescriptions.length > 0 || customPrescriptions.length > 0) && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Current Bill Summary</h4>
            <div className="space-y-1">
              {prescriptions.filter(p => p.serviceId).map((prescription, index) => {
                const service = services.find(s => s.id === prescription.serviceId);
                if (!service) return null;
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{service.name} x{prescription.quantity}</span>
                    <span>₦{(service.price * prescription.quantity).toLocaleString()}</span>
                  </div>
                );
              })}
              
              {customPrescriptions.map((prescription) => (
                <div key={prescription.id} className="flex justify-between text-sm group">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{prescription.medicine}</span>
                      <div className="flex items-center gap-2">
                        <span>₦{prescription.price.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomPrescription(prescription.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {prescription.dosage && (
                      <div className="text-xs text-muted-foreground">
                        Dosage: {prescription.dosage}
                      </div>
                    )}
                    {prescription.frequency && (
                      <div className="text-xs text-muted-foreground">
                        Frequency: {prescription.frequency}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
        
        <PrescriptionDialog
          open={showPrescriptionDialog}
          onOpenChange={setShowPrescriptionDialog}
          onAddPrescription={addCustomPrescription}
        />
      </CardContent>
    </Card>
  );
};