import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface MedicationWithInventory {
  id: string;
  name: string;
  dosage: string;
  form: string;
  total_quantity: number;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface InventoryBatch {
  id: string;
  batch_number: string;
  quantity_on_hand: number;
  expiry_date: string;
}

interface DispenseMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: MedicationWithInventory[];
  onSuccess: () => void;
}

export const DispenseMedicationDialog = ({ open, onOpenChange, medications, onSuccess }: DispenseMedicationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableBatches, setAvailableBatches] = useState<InventoryBatch[]>([]);
  const [formData, setFormData] = useState({
    medication_id: "",
    patient_id: "",
    inventory_id: "",
    quantity_dispensed: "",
    notes: "",
  });

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .order('first_name');
      
      if (data) setPatients(data);
    };

    if (open) {
      fetchPatients();
    }
  }, [open]);

  // Fetch available batches when medication is selected
  useEffect(() => {
    const fetchBatches = async () => {
      if (!formData.medication_id) {
        setAvailableBatches([]);
        return;
      }

      const { data } = await supabase
        .from('medication_inventory')
        .select('id, batch_number, quantity_on_hand, expiry_date')
        .eq('medication_id', formData.medication_id)
        .gt('quantity_on_hand', 0)
        .order('expiry_date');

      if (data) setAvailableBatches(data);
    };

    fetchBatches();
  }, [formData.medication_id]);

  const selectedMedication = medications.find(m => m.id === formData.medication_id);
  const selectedBatch = availableBatches.find(b => b.id === formData.inventory_id);
  const requestedQuantity = parseInt(formData.quantity_dispensed || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if quantity is available
      if (!selectedBatch || requestedQuantity > selectedBatch.quantity_on_hand) {
        throw new Error('Insufficient stock for this batch');
      }

      // Get current user's hospital_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data: user } = await supabase.auth.getUser();

      // Record dispensing
      const { error: dispensingError } = await supabase
        .from('medication_dispensing')
        .insert({
          medication_id: formData.medication_id,
          patient_id: formData.patient_id,
          inventory_id: formData.inventory_id,
          quantity_dispensed: requestedQuantity,
          dispensed_by: user.user?.id,
          notes: formData.notes,
          hospital_id: profile?.hospital_id,
        });

      if (dispensingError) throw dispensingError;

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('medication_inventory')
        .update({
          quantity_on_hand: selectedBatch.quantity_on_hand - requestedQuantity
        })
        .eq('id', formData.inventory_id);

      if (updateError) throw updateError;

      const selectedPatient = patients.find(p => p.id === formData.patient_id);
      toast({
        title: "Medication Dispensed",
        description: `${requestedQuantity} units of ${selectedMedication?.name} dispensed to ${selectedPatient?.first_name} ${selectedPatient?.last_name}.`,
      });

      // Reset form
      setFormData({
        medication_id: "",
        patient_id: "",
        inventory_id: "",
        quantity_dispensed: "",
        notes: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dispense medication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = selectedMedication && selectedMedication.total_quantity === 0;
  const isInsufficientStock = selectedBatch && requestedQuantity > selectedBatch.quantity_on_hand;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dispense Medication</DialogTitle>
          <DialogDescription>
            Record medication dispensing to a patient
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medication_id">Medication *</Label>
              <Select 
                value={formData.medication_id} 
                onValueChange={(value) => setFormData({ ...formData, medication_id: value, inventory_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((medication) => (
                    <SelectItem key={medication.id} value={medication.id}>
                      <div className="flex items-center gap-2">
                        {medication.name} - {medication.dosage}
                        {medication.total_quantity === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOutOfStock && (
                <div className="flex items-center gap-1 mt-1 text-destructive text-sm">
                  <AlertTriangle className="h-3 w-3" />
                  This medication is out of stock
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="patient_id">Patient *</Label>
              <Select 
                value={formData.patient_id} 
                onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.medication_id && (
            <div>
              <Label htmlFor="inventory_id">Available Batches *</Label>
              <Select 
                value={formData.inventory_id} 
                onValueChange={(value) => setFormData({ ...formData, inventory_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {availableBatches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_number} - Qty: {batch.quantity_on_hand} - Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="quantity_dispensed">Quantity to Dispense *</Label>
            <Input
              id="quantity_dispensed"
              type="number"
              min="1"
              max={selectedBatch?.quantity_on_hand || 999}
              value={formData.quantity_dispensed}
              onChange={(e) => setFormData({ ...formData, quantity_dispensed: e.target.value })}
              placeholder="0"
              required
            />
            {selectedBatch && (
              <p className="text-sm text-muted-foreground mt-1">
                Available: {selectedBatch.quantity_on_hand} units
              </p>
            )}
            {isInsufficientStock && (
              <div className="flex items-center gap-1 mt-1 text-destructive text-sm">
                <AlertTriangle className="h-3 w-3" />
                Quantity exceeds available stock
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the dispensing..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                loading || 
                !formData.medication_id || 
                !formData.patient_id || 
                !formData.inventory_id || 
                isOutOfStock || 
                isInsufficientStock
              }
            >
              {loading ? "Dispensing..." : "Dispense Medication"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};