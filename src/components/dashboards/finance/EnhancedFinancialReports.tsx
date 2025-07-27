import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const EnhancedFinancialReports = () => {
  const [revenueDate, setRevenueDate] = useState<Date>(new Date());
  const [isGeneratingDailyReport, setIsGeneratingDailyReport] = useState(false);
  const [isGeneratingOutstandingReport, setIsGeneratingOutstandingReport] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const generateDailyRevenueReport = async () => {
    if (!profile?.hospital_id) return;
    
    setIsGeneratingDailyReport(true);
    try {
      const selectedDate = format(revenueDate, 'yyyy-MM-dd');
      
      // Fetch revenue data for the selected date
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_history')
        .select(`
          id,
          payment_amount,
          payment_date,
          payment_method,
          notes,
          bills!inner(
            id,
            amount,
            description,
            patients!inner(first_name, last_name)
          )
        `)
        .eq('hospital_id', profile.hospital_id)
        .gte('payment_date', `${selectedDate}T00:00:00`)
        .lte('payment_date', `${selectedDate}T23:59:59`)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Generate PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Revenue Report', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${format(revenueDate, 'MMMM dd, yyyy')}`, 20, 35);
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 45);

      // Summary
      const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.payment_amount), 0) || 0;
      const totalTransactions = payments?.length || 0;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, 65);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 20, 80);
      doc.text(`Total Transactions: ${totalTransactions}`, 20, 90);

      // Payment details table
      if (payments && payments.length > 0) {
        const tableData = payments.map(payment => [
          payment.bills.patients.first_name + ' ' + payment.bills.patients.last_name,
          payment.bills.description || 'N/A',
          `₦${Number(payment.payment_amount).toLocaleString()}`,
          payment.payment_method || 'N/A',
          format(new Date(payment.payment_date), 'HH:mm')
        ]);

        autoTable(doc, {
          head: [['Patient Name', 'Description', 'Amount', 'Method', 'Time']],
          body: tableData,
          startY: 110,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      } else {
        doc.text('No revenue recorded for this date.', 20, 120);
      }

      // Save PDF
      doc.save(`daily-revenue-report-${selectedDate}.pdf`);
      
      toast({
        title: "Success",
        description: "Daily revenue report generated successfully",
      });
    } catch (error) {
      console.error('Error generating daily revenue report:', error);
      toast({
        title: "Error",
        description: "Failed to generate daily revenue report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDailyReport(false);
    }
  };

  const generateOutstandingBillsReport = async () => {
    if (!profile?.hospital_id) return;
    
    setIsGeneratingOutstandingReport(true);
    try {
      // Fetch outstanding bills
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select(`
          id,
          amount,
          amount_paid,
          description,
          created_at,
          patients!inner(first_name, last_name, phone, email)
        `)
        .eq('hospital_id', profile.hospital_id)
        .eq('is_paid', false)
        .gt('amount', 0)
        .order('created_at', { ascending: false });

      if (billsError) throw billsError;

      // Generate PDF
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Outstanding Bills Report', 20, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, 20, 35);

      // Summary
      const totalOutstanding = bills?.reduce((sum, bill) => sum + (Number(bill.amount) - Number(bill.amount_paid)), 0) || 0;
      const totalBills = bills?.length || 0;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, 55);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Outstanding Amount: ₦${totalOutstanding.toLocaleString()}`, 20, 70);
      doc.text(`Total Outstanding Bills: ${totalBills}`, 20, 80);

      // Outstanding bills table
      if (bills && bills.length > 0) {
        const tableData = bills.map(bill => {
          const outstandingAmount = Number(bill.amount) - Number(bill.amount_paid);
          return [
            bill.patients.first_name + ' ' + bill.patients.last_name,
            bill.patients.phone || 'N/A',
            bill.description || 'N/A',
            `₦${Number(bill.amount).toLocaleString()}`,
            `₦${Number(bill.amount_paid).toLocaleString()}`,
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
        doc.text('No outstanding bills found.', 20, 110);
      }

      // Save PDF
      doc.save(`outstanding-bills-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "Outstanding bills report generated successfully",
      });
    } catch (error) {
      console.error('Error generating outstanding bills report:', error);
      toast({
        title: "Error",
        description: "Failed to generate outstanding bills report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingOutstandingReport(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Reports</CardTitle>
        <CardDescription>Generate detailed financial reports and analytics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Revenue Report */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !revenueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {revenueDate ? format(revenueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={revenueDate}
                  onSelect={(date) => date && setRevenueDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button 
              onClick={generateDailyRevenueReport}
              disabled={isGeneratingDailyReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGeneratingDailyReport ? "Generating..." : "Daily Revenue Report"}
            </Button>
          </div>
        </div>

        {/* Outstanding Bills Report */}
        <Button 
          onClick={generateOutstandingBillsReport}
          disabled={isGeneratingOutstandingReport}
          variant="outline" 
          className="w-full justify-start gap-2" 
          size="lg"
        >
          <FileText className="h-4 w-4" />
          {isGeneratingOutstandingReport ? "Generating..." : "Outstanding Bills Report"}
        </Button>
      </CardContent>
    </Card>
  );
};