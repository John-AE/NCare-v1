import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/financeUtils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBill: any;
  paymentAmount: string;
  paymentMethod: string;
  onPaymentAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onPayment: () => void;
}

export const PaymentDialog = ({
  isOpen,
  onOpenChange,
  selectedBill,
  paymentAmount,
  paymentMethod,
  onPaymentAmountChange,
  onPaymentMethodChange,
  onPayment
}: PaymentDialogProps) => {
  const [paidByProfile, setPaidByProfile] = useState<any>(null);

  useEffect(() => {
    const fetchPaidByProfile = async () => {
      if (selectedBill?.paid_by) {
        console.log('Fetching profile for paid_by:', selectedBill.paid_by);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', selectedBill.paid_by)
            .single();
          
          if (error) throw error;
          console.log('Found profile:', data);
          setPaidByProfile(data);
        } catch (error) {
          console.error('Error fetching paid by profile:', error);
          setPaidByProfile(null);
        }
      } else {
        console.log('No paid_by field set on bill');
        setPaidByProfile(null);
      }
    };

    if (isOpen && selectedBill) {
      fetchPaidByProfile();
    }
  }, [selectedBill, isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
         <DialogHeader>
           <DialogTitle>
             {selectedBill?.is_paid || selectedBill?.payment_status === 'fully_paid' 
               ? 'Bill Details' 
               : 'Record Payment'
             }
           </DialogTitle>
           <DialogDescription>
             {selectedBill?.is_paid || selectedBill?.payment_status === 'fully_paid'
               ? `Bill details for ${selectedBill?.patient_name}`
               : `Record a payment for ${selectedBill?.patient_name}`
             }
           </DialogDescription>
         </DialogHeader>
        
        {selectedBill && (
          <div className="space-y-4">
            {/* Bill Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bill ID:</span>
                <span className="text-sm font-mono">{selectedBill.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Patient:</span>
                <span className="text-sm">{selectedBill.patient_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Description:</span>
                <span className="text-sm">{selectedBill.description || 'N/A'}</span>
              </div>
            </div>

            <Separator />

            {/* Payment Status and Audit Information */}
            {selectedBill.is_paid && selectedBill.paid_at && (
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-muted-foreground">Payment Audit Information</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Paid by:</span>
                    <span className="text-sm font-medium">{paidByProfile?.username || 'Loading...'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment date:</span>
                    <span className="text-sm">{new Date(selectedBill.paid_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment time:</span>
                    <span className="text-sm">{new Date(selectedBill.paid_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Payment method:</span>
                    <span className="text-sm">{selectedBill.payment_method || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Amount:</p>
                <p>₦{selectedBill.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Amount Paid:</p>
                <p>₦{(selectedBill.amount_paid || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Outstanding:</p>
                <p>₦{(selectedBill.amount - (selectedBill.amount_paid || 0)).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Status:</p>
                <Badge variant={getStatusBadgeVariant(selectedBill.payment_status)}>
                  {getStatusLabel(selectedBill.payment_status)}
                </Badge>
              </div>
            </div>
            
            {/* Payment Form - Only show if bill is not fully paid */}
            {!selectedBill.is_paid && selectedBill.payment_status !== 'fully_paid' && (
              <>
                <Separator />
                <div>
                  <label htmlFor="payment-amount" className="block text-sm font-medium mb-2">
                    Payment Amount (₦)
                  </label>
                  <Input
                    id="payment-amount"
                    type="number"
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => onPaymentAmountChange(e.target.value)}
                    min="0"
                    max={selectedBill.amount - (selectedBill.amount_paid || 0)}
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label htmlFor="payment-method" className="block text-sm font-medium mb-2">
                    Payment Method
                  </label>
                  <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {selectedBill?.is_paid || selectedBill?.payment_status === 'fully_paid' ? 'Close' : 'Cancel'}
          </Button>
          {(!selectedBill?.is_paid && selectedBill?.payment_status !== 'fully_paid') && (
            <Button onClick={onPayment}>
              Record Payment
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};