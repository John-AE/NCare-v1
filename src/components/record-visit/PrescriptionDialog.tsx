import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPrescription: (prescription: {
    medicine: string;
    dosage: string;
    frequency: string;
    otherDetails: string;
    price: number;
  }) => void;
}

export const PrescriptionDialog = ({
  open,
  onOpenChange,
  onAddPrescription
}: PrescriptionDialogProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const prescription = {
      medicine: formData.get('medicine') as string,
      dosage: formData.get('dosage') as string,
      frequency: formData.get('frequency') as string,
      otherDetails: formData.get('otherDetails') as string,
      price: parseFloat(formData.get('price') as string) || 0,
    };

    if (prescription.medicine && prescription.price > 0) {
      onAddPrescription(prescription);
      onOpenChange(false);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Prescription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medicine">Medicine/Prescription *</Label>
            <Input
              id="medicine"
              name="medicine"
              placeholder="Enter medicine name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage</Label>
            <Input
              id="dosage"
              name="dosage"
              placeholder="e.g., 500mg, 2 tablets"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Input
              id="frequency"
              name="frequency"
              placeholder="e.g., Twice daily, Every 8 hours"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="otherDetails">Other Details</Label>
            <Textarea
              id="otherDetails"
              name="otherDetails"
              placeholder="Additional instructions or notes"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="price">Price (₦) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add to Bill
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};