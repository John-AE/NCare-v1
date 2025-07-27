import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Bill {
  id: string;
  amount: number;
  amount_paid: number;
  description: string;
  created_at: string;
  patient_name: string;
  patient_phone?: string;
}

interface EnhancedPendingBillsProps {
  pendingBills: Bill[];
  loading: boolean;
  onBillSelect: (bill: any) => void;
}

export const EnhancedPendingBills = ({ pendingBills, loading, onBillSelect }: EnhancedPendingBillsProps) => {
  const { toast } = useToast();

  const generatePendingBillsPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Pending Bills Report', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 35);

      // Summary
      const totalOutstanding = pendingBills.reduce((sum, bill) => sum + (bill.amount - bill.amount_paid), 0);
      const totalBills = pendingBills.length;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, 55);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Outstanding Amount: ₦${totalOutstanding.toLocaleString()}`, 20, 70);
      doc.text(`Total Pending Bills: ${totalBills}`, 20, 80);

      // Pending bills table
      if (pendingBills.length > 0) {
        const tableData = pendingBills.map(bill => {
          const outstandingAmount = bill.amount - bill.amount_paid;
          return [
            bill.patient_name,
            bill.patient_phone || 'N/A',
            bill.description || 'N/A',
            `₦${bill.amount.toLocaleString()}`,
            `₦${bill.amount_paid.toLocaleString()}`,
            `₦${outstandingAmount.toLocaleString()}`,
            format(new Date(bill.created_at), 'MMM dd, yyyy')
          ];
        });

        autoTable(doc, {
          head: [['Patient Name', 'Phone', 'Description', 'Total Amount', 'Paid', 'Outstanding', 'Date']],
          body: tableData,
          startY: 100,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [231, 76, 60] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 20 }
          }
        });
      } else {
        doc.text('No pending bills found.', 20, 110);
      }

      doc.save(`pending-bills-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "Pending bills report generated successfully",
      });
    } catch (error) {
      console.error('Error generating pending bills PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate pending bills report",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Bills</CardTitle>
          <CardDescription>Bills awaiting payment</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generatePendingBillsPDF}
          disabled={loading || pendingBills.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading pending bills...</div>
        ) : pendingBills.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No pending bills found
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {pendingBills.map((bill) => {
                const outstanding = bill.amount - bill.amount_paid;
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onBillSelect(bill)}
                  >
                    <div>
                      <p className="font-medium">{bill.patient_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(bill.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        ₦{outstanding.toLocaleString()} due
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        of ₦{bill.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};