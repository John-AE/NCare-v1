import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedServiceSelector } from "./EnhancedServiceSelector";
import { MedicationSelector } from "./MedicationSelector";
import { SimpleBillPreviewDialog } from "./SimpleBillPreviewDialog";

interface ServiceItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface MedicationItem {
  id: string;
  medication_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface PatientBillingSystemProps {
  appointment: any;
  profile: any;
  onBillFinalized: () => void;
}

export const PatientBillingSystem = ({ appointment, profile, onBillFinalized }: PatientBillingSystemProps) => {
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isFinalizingBill, setIsFinalizingBill] = useState(false);

  const { toast } = useToast();

  const calculateSubtotal = () => {
    const servicesTotal = serviceItems.reduce((total, item) => total + item.total_price, 0);
    const medicationsTotal = medicationItems.reduce((total, item) => total + item.total_price, 0);
    return servicesTotal + medicationsTotal;
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const finalizeBill = async () => {
    if (serviceItems.length === 0 && medicationItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one service or medication to the bill",
        variant: "destructive"
      });
      return;
    }

    if (isFinalizingBill) return; // Prevent double-clicking

    setIsFinalizingBill(true);

    try {
      // Check if a bill already exists for this appointment to prevent duplicates
      const { data: existingBills } = await supabase
        .from('bills')
        .select('id')
        .eq('patient_id', appointment.patient_id)
        .eq('description', `Consultation visit on ${appointment.scheduled_date}`)
        .limit(1);

      if (existingBills && existingBills.length > 0) {
        toast({
          title: "Error",
          description: "A bill already exists for this consultation",
          variant: "destructive"
        });
        return;
      }

      const totalAmount = calculateTotal();
      
      // Create bill record
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          patient_id: appointment.patient_id,
          amount: totalAmount,
          discount_amount: calculateDiscountAmount(),
          discount_reason: discountReason || null,
          description: `Consultation visit on ${appointment.scheduled_date}`,
          created_by: profile.user_id,
          hospital_id: profile.hospital_id
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items for services
      if (serviceItems.length > 0) {
        const serviceBillItems = serviceItems.map(item => ({
          bill_id: billData.id,
          service_id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: serviceItemsError } = await supabase
          .from('bill_items')
          .insert(serviceBillItems);

        if (serviceItemsError) throw serviceItemsError;
      }

      // Create bill items for medications (using medication_id as service_id)
      if (medicationItems.length > 0) {
        const medicationBillItems = medicationItems.map(item => ({
          bill_id: billData.id,
          medication_id: item.id,
          service_id: null, // Add this line
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: medicationItemsError } = await supabase
          .from('bill_items')
          .insert(medicationBillItems);

        if (medicationItemsError) throw medicationItemsError;
      }

      // Update appointment status to completed
        const { error: appointmentError } = await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', appointment.id);

        if (appointmentError) {
          console.error('Error updating appointment status:', appointmentError);
          // Don't throw error, just log it for now
        }

      toast({
        title: "Success",
        description: `Bill finalized successfully! Bill ID: ${billData.id}`,
      });

      onBillFinalized();
    } catch (error) {
      console.error('Error finalizing bill:', error);
      toast({
        title: "Error",
        description: "Failed to finalize bill",
        variant: "destructive"
      });
    } finally {
      setIsFinalizingBill(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Patient Billing System
          </CardTitle>
          <CardDescription>
            Real-time bill generation for {appointment?.patients?.first_name} {appointment?.patients?.last_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Service Selector */}
          <EnhancedServiceSelector
            serviceItems={serviceItems}
            setServiceItems={setServiceItems}
            discount={discount}
            setDiscount={setDiscount}
            discountReason={discountReason}
            setDiscountReason={setDiscountReason}
          />

          {/* Medication Selector */}
          <MedicationSelector
            medicationItems={medicationItems}
            setMedicationItems={setMedicationItems}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setShowPreviewDialog(true)} 
              variant="outline" 
              className="flex-1"
              disabled={serviceItems.length === 0 && medicationItems.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Bill
            </Button>
            <Button 
              onClick={finalizeBill} 
              className="flex-1"
              disabled={(serviceItems.length === 0 && medicationItems.length === 0) || isFinalizingBill}
            >
              {isFinalizingBill ? "Finalizing..." : "Finalize Bill"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Bill Preview Dialog */}
      {showPreviewDialog && (
        <SimpleBillPreviewDialog
          open={showPreviewDialog}
          onOpenChange={setShowPreviewDialog}
          serviceItems={serviceItems}
          medicationItems={medicationItems}
          subtotal={calculateSubtotal()}
          discount={discount}
          discountAmount={calculateDiscountAmount()}
          total={calculateTotal()}
          onFinalize={() => {
            setShowPreviewDialog(false);
            finalizeBill();
          }}
        />
      )}
    </>
  );
};
