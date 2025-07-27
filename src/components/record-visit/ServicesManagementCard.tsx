import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Service, Prescription, NewService, CustomPrescription } from "@/types/recordVisit";
import { ServiceManagementDialog } from "./ServiceManagementDialog";
import { PrescriptionDialog } from "./PrescriptionDialog";
import { useState } from "react";

interface ServicesManagementCardProps {
  services: Service[];
  prescriptions: Prescription[];
  customPrescriptions: CustomPrescription[];
  addPrescription: () => void;
  removePrescription: (index: number) => void;
  updatePrescription: (index: number, field: keyof Prescription, value: string | number) => void;
  showServiceDialog: boolean;
  setShowServiceDialog: (show: boolean) => void;
  newService: NewService;
  setNewService: (service: NewService) => void;
  editingService: Service | null;
  setEditingService: (service: Service | null) => void;
  saveService: () => void;
  addCustomPrescription: (prescription: Omit<CustomPrescription, 'id'>) => void;
  removeCustomPrescription: (id: string) => void;
}

export const ServicesManagementCard = ({
  services,
  prescriptions,
  customPrescriptions,
  addPrescription,
  removePrescription,
  updatePrescription,
  showServiceDialog,
  setShowServiceDialog,
  newService,
  setNewService,
  editingService,
  setEditingService,
  saveService,
  addCustomPrescription,
  removeCustomPrescription
}: ServicesManagementCardProps) => {
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Prescription and Services</CardTitle>
            <CardDescription>Add medications and services for this visit</CardDescription>
          </div>
          <div className="flex gap-2">
            <ServiceManagementDialog />
            <Button
              onClick={() => setShowPrescriptionDialog(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
            <Button onClick={addPrescription} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {prescriptions.map((prescription, index) => (
          <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
            <div className="flex-1">
              <Label>Service/Medication</Label>
              <Select
                value={prescription.serviceId}
                onValueChange={(value) => updatePrescription(index, 'serviceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ₦{service.price}
                      {service.category && (
                        <Badge variant="secondary" className="ml-2">{service.category}</Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={prescription.quantity}
                onChange={(e) => updatePrescription(index, 'quantity', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex-1">
              <Label>Instructions</Label>
              <Input
                placeholder="Usage instructions..."
                value={prescription.instructions}
                onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removePrescription(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {customPrescriptions.map((prescription) => (
          <div key={prescription.id} className="flex gap-4 items-end p-4 border rounded-lg bg-blue-50">
            <div className="flex-1">
              <Label>Custom Prescription</Label>
              <div className="p-2 bg-white rounded border">
                <strong>{prescription.medicine}</strong>
                <div className="text-sm text-muted-foreground">
                  {prescription.dosage} • {prescription.frequency}
                </div>
              </div>
            </div>
            <div className="w-24">
              <Label>Price</Label>
              <div className="p-2 bg-white rounded border">
                ₦{prescription.price}
              </div>
            </div>
            <div className="flex-1">
              <Label>Details</Label>
              <div className="p-2 bg-white rounded border text-sm">
                {prescription.otherDetails || "No additional details"}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeCustomPrescription(prescription.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {prescriptions.length === 0 && customPrescriptions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No services added yet. Click "Add Service" to get started.
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