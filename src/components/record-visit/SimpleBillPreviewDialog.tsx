import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

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

interface SimpleBillPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceItems: ServiceItem[];
  medicationItems?: MedicationItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  total: number;
  onFinalize: () => void;
}

export const SimpleBillPreviewDialog = ({
  open,
  onOpenChange,
  serviceItems,
  medicationItems = [],
  subtotal,
  discount,
  discountAmount,
  total,
  onFinalize
}: SimpleBillPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Bill Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h5 className="font-medium mb-3">Bill Summary</h5>
            <div className="space-y-2">
              {serviceItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.service_name} ({item.quantity}x)</span>
                  <span>₦{item.total_price.toLocaleString()}</span>
                </div>
              ))}
              {medicationItems?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.medication_name} ({item.quantity}x)</span>
                  <span>₦{item.total_price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t mt-3 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Discount ({discount}%):</span>
                  <span>-₦{discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
              Close
            </Button>
            <Button onClick={onFinalize} className="flex-1">
              Finalize Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};