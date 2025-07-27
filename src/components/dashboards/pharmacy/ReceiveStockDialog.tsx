import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MedicationWithInventory {
  id: string;
  name: string;
  dosage: string;
  form: string;
}

interface ReceiveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: MedicationWithInventory[];
  onSuccess: () => void;
}

export const ReceiveStockDialog = ({ open, onOpenChange, medications, onSuccess }: ReceiveStockDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_id: "",
    batch_number: "",
    quantity_received: "",
    unit_cost: "",
    expiry_date: "",
    supplier: "",
    reorder_point: "10",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const quantityReceived = parseInt(formData.quantity_received);
      const unitCost = parseFloat(formData.unit_cost);
      const totalCost = quantityReceived * unitCost;

      // Get current user's hospital_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('medication_inventory')
        .insert({
          medication_id: formData.medication_id,
          batch_number: formData.batch_number,
          quantity_on_hand: quantityReceived,
          quantity_received: quantityReceived,
          unit_cost: unitCost,
          total_cost: totalCost,
          expiry_date: formData.expiry_date,
          supplier: formData.supplier,
          reorder_point: parseInt(formData.reorder_point),
          hospital_id: profile?.hospital_id,
        });

      if (error) throw error;

      const selectedMedication = medications.find(m => m.id === formData.medication_id);
      toast({
        title: "Stock Received",
        description: `${quantityReceived} units of ${selectedMedication?.name} have been added to inventory.`,
      });

      // Reset form
      setFormData({
        medication_id: "",
        batch_number: "",
        quantity_received: "",
        unit_cost: "",
        expiry_date: "",
        supplier: "",
        reorder_point: "10",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to receive stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive Stock</DialogTitle>
          <DialogDescription>
            Record incoming medication shipment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="medication_id">Medication *</Label>
            <Select 
              value={formData.medication_id} 
              onValueChange={(value) => setFormData({ ...formData, medication_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select medication" />
              </SelectTrigger>
              <SelectContent>
                {medications.map((medication) => (
                  <SelectItem key={medication.id} value={medication.id}>
                    {medication.name} - {medication.dosage} ({medication.form})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="batch_number">Batch Number *</Label>
              <Input
                id="batch_number"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="e.g., BT001234"
                required
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g., MedSupply Co."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity_received">Quantity Received *</Label>
              <Input
                id="quantity_received"
                type="number"
                min="1"
                value={formData.quantity_received}
                onChange={(e) => setFormData({ ...formData, quantity_received: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="unit_cost">Unit Cost (₦) *</Label>
              <Input
                id="unit_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry_date">Expiry Date *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="reorder_point">Reorder Point</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                value={formData.reorder_point}
                onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          {formData.quantity_received && formData.unit_cost && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Total Cost: ₦{(parseInt(formData.quantity_received || '0') * parseFloat(formData.unit_cost || '0')).toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.medication_id}>
              {loading ? "Receiving..." : "Receive Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};