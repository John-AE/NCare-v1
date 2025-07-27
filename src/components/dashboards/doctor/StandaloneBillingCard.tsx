import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Eye, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { EnhancedServiceSelector } from "@/components/record-visit/EnhancedServiceSelector";
import { MedicationSelector } from "@/components/record-visit/MedicationSelector";
import { SimpleBillPreviewDialog } from "@/components/record-visit/SimpleBillPreviewDialog";

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

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export const StandaloneBillingCard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isFinalizingBill, setIsFinalizingBill] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();
  const { profile } = useAuth();

  const searchPatients = async (searchValue: string) => {
    if (searchValue.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email')
        .eq('hospital_id', profile?.hospital_id)
        .or(`first_name.ilike.%${searchValue}%,last_name.ilike.%${searchValue}%`)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

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
    if (!selectedPatient) {
      toast({
        title: "Error",
        description: "Please select a patient",
        variant: "destructive"
      });
      return;
    }

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
      const totalAmount = calculateTotal();
      
      // Create bill record
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          patient_id: selectedPatient.id,
          amount: totalAmount,
          discount_amount: calculateDiscountAmount(),
          discount_reason: discountReason || null,
          description: `Direct billing for ${selectedPatient.first_name} ${selectedPatient.last_name}`,
          created_by: profile?.user_id,
          hospital_id: profile?.hospital_id
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

      // Create bill items for medications
      if (medicationItems.length > 0) {
        const medicationBillItems = medicationItems.map(item => ({
          bill_id: billData.id,
          service_id: item.id, // medication ID
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: medicationItemsError } = await supabase
          .from('bill_items')
          .insert(medicationBillItems);

        if (medicationItemsError) throw medicationItemsError;
      }

      toast({
        title: "Success",
        description: `Bill finalized successfully! Bill ID: ${billData.id}`,
      });

      // Reset form
      setSelectedPatient(null);
      setServiceItems([]);
      setMedicationItems([]);
      setDiscount(0);
      setDiscountReason('');
      setSearchTerm('');
      setPatients([]);
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
            Direct Patient Billing
          </CardTitle>
          <CardDescription>
            Create bills for patients without appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Patient</label>
            <Select
              value={selectedPatient?.id || ''}
              onValueChange={(patientId) => {
                const patient = patients.find(p => p.id === patientId);
                setSelectedPatient(patient || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Search and select patient">
                  {selectedPatient ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </div>
                  ) : (
                    "Search and select patient"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Type patient name..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      searchPatients(e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
                {patients.map(patient => (
                  <SelectItem key={patient.id} value={patient.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {patient.first_name} {patient.last_name}
                      {patient.email && (
                        <span className="text-xs text-muted-foreground">({patient.email})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Bill Preview Dialog */}
      {showPreviewDialog && selectedPatient && (
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