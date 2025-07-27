import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeVariant } from "@/lib/financeUtils";

interface PendingBillsProps {
  pendingBills: any[];
  loading: boolean;
  onBillSelect: (bill: any) => void;
}

export const PendingBills = ({ pendingBills, loading, onBillSelect }: PendingBillsProps) => {
  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Pending Bills</CardTitle>
        <CardDescription>Bills awaiting payment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground">Loading bills...</p>
          ) : pendingBills.length === 0 ? (
            <p className="text-muted-foreground">No pending bills found</p>
          ) : (
            pendingBills.slice(0, 5).map((bill) => (
              <div 
                key={bill.id} 
                className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                onClick={() => onBillSelect(bill)}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{bill.patient_name}</p>
                  <Badge variant={getStatusBadgeVariant(bill.payment_status)}>
                    ₦{bill.amount.toLocaleString()}
                  </Badge>
                </div>
                {bill.description && (
                  <p className="text-sm text-muted-foreground mb-1">{bill.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Generated: {new Date(bill.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};