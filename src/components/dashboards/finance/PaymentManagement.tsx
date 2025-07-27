import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/financeUtils";

interface PaymentManagementProps {
  searchTerm: string;
  filteredBills: any[];
  loading: boolean;
  onSearch: (value: string) => void;
  onBillSelect: (bill: any) => void;
}

export const PaymentManagement = ({
  searchTerm,
  filteredBills,
  loading,
  onSearch,
  onBillSelect
}: PaymentManagementProps) => {
  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle>Payment Management</CardTitle>
        <CardDescription>Search and manage bill payments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, bill ID, or description..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-muted-foreground">Loading bills...</p>
          ) : filteredBills.length === 0 ? (
            <p className="text-muted-foreground">No bills found</p>
          ) : (
            filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onBillSelect(bill)}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{bill.patient_name}</p>
                  <Badge variant={getStatusBadgeVariant(bill.payment_status)}>
                    {getStatusLabel(bill.payment_status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">
                    Amount: ₦{bill.amount.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Paid: ₦{(bill.amount_paid || 0).toLocaleString()}
                  </span>
                </div>
                {bill.description && (
                  <p className="text-sm text-muted-foreground mb-1">{bill.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Bill ID: {bill.id.slice(0, 8)}...
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};