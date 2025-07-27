import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPaymentMethodDisplay } from "@/lib/financeUtils";

interface PaymentTrackingProps {
  recentPayments: any[];
  loading: boolean;
}

export const PaymentTracking = ({ recentPayments, loading }: PaymentTrackingProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Tracking</CardTitle>
        <CardDescription>Recent payments and partial payments</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-4 pr-4">
            {loading ? (
              <p className="text-muted-foreground">Loading recent payments...</p>
            ) : recentPayments.length === 0 ? (
              <p className="text-muted-foreground">No recent payments found</p>
            ) : (
              recentPayments.map((payment, index) => (
                <div key={index} className="p-3 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{payment.patient_name}</p>
                    <Badge variant={payment.percentage === 100 ? "default" : "secondary"}>
                      {getPaymentMethodDisplay(payment.payment_method)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      ₦{(payment.amount_paid || 0).toLocaleString()} of ₦{payment.amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(payment.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Progress value={payment.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {payment.percentage}% paid
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};