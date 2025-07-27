import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BillItem {
  id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface BillDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  appointmentTime: string;
  billItems: BillItem[];
  totalAmount: number;
  isPaid: boolean;
  paymentMethod?: string;
  billId?: string;
  patientEmail?: string;
}

const BillDetailsDialog = ({
  open,
  onOpenChange,
  patientName,
  appointmentTime,
  billItems,
  totalAmount,
  isPaid,
  paymentMethod,
  billId,
  patientEmail,
}: BillDetailsDialogProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { toast } = useToast();

  const generatePDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      
      // Define colors
      const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
      const secondaryColor: [number, number, number] = [71, 85, 105]; // Gray
      const lightGray: [number, number, number] = [248, 250, 252]; // Light background
      
      // Page margins
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Header Background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      // Company Name/Logo
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Medical Center", margin, 25);
      
      // Header subtitle
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Professional Healthcare Services", margin, 35);
      
      // Invoice title
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("MEDICAL BILL", pageWidth - margin, 25, { align: 'right' });
      
      // Reset text color for content
      doc.setTextColor(0, 0, 0);
      
      // Patient Information Section
      let yPosition = 70;
      
      // Patient info background
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 35, 'F');
      
      // Patient info border
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 35);
      
      // Patient details
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("PATIENT INFORMATION", margin + 5, yPosition + 5);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Patient: ${patientName}`, margin + 5, yPosition + 15);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin + 5, yPosition + 25);
      
      // Bill info on the right
      doc.text(`Bill ID: ${billId || 'N/A'}`, pageWidth - margin - 5, yPosition + 15, { align: 'right' });
      doc.text(`Time: ${appointmentTime}`, pageWidth - margin - 5, yPosition + 25, { align: 'right' });
      
      yPosition += 50;
      
      // Services table
      const tableData = billItems.map(item => [
        item.service_name,
        item.quantity.toString(),
        `₦${item.unit_price.toLocaleString()}`,
        `₦${item.total_price.toLocaleString()}`
      ]);
      
      autoTable(doc, {
        head: [['Service Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        headStyles: { 
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 12,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 8
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: 6,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 70, halign: 'left' },   // Service name
          1: { cellWidth: 20, halign: 'center' }, // Quantity
          2: { cellWidth: 35, halign: 'right' },  // Unit price
          3: { cellWidth: 35, halign: 'right' }   // Total
        },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.5,
        margin: { left: margin, right: margin }
      });
      
      // Get position after table
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      
      // Total section background
      const totalSectionHeight = 60;
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(pageWidth - 120, finalY - 5, 100, totalSectionHeight, 'F');
      
      // Total section border
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(1);
      doc.rect(pageWidth - 120, finalY - 5, 100, totalSectionHeight);
      
      // Subtotal
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Subtotal:", pageWidth - 115, finalY + 8);
      doc.text(`₦${totalAmount.toLocaleString()}`, pageWidth - 25, finalY + 8, { align: 'right' });
      
      // Tax
      doc.text("Tax:", pageWidth - 115, finalY + 18);
      doc.text("₦0.00", pageWidth - 25, finalY + 18, { align: 'right' });
      
      // Line separator
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.line(pageWidth - 115, finalY + 25, pageWidth - 25, finalY + 25);
      
      // Grand Total
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TOTAL:", pageWidth - 115, finalY + 38);
      doc.text(`₦${totalAmount.toLocaleString()}`, pageWidth - 25, finalY + 38, { align: 'right' });
      
      // Payment status section
      const statusY = finalY + totalSectionHeight + 20;
      
      // Status background
      const statusColor = isPaid ? [34, 197, 94] : [249, 115, 22]; // Green for paid, orange for pending
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.rect(margin, statusY, pageWidth - (margin * 2), 25, 'F');
      
      // Status text
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      const statusText = isPaid ? `PAID - ${paymentMethod || 'Cash'}` : 'PAYMENT PENDING';
      doc.text(statusText, pageWidth / 2, statusY + 16, { align: 'center' });
      
      // Footer
      const footerY = pageHeight - 40;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Thank you for choosing our medical services.", pageWidth / 2, footerY, { align: 'center' });
      doc.text("For inquiries, contact: info@medicalcenter.com | +234-XXX-XXXX", pageWidth / 2, footerY + 10, { align: 'center' });
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      
      // Save PDF
      doc.save(`medical-bill-${patientName.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Styled medical bill PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const sendEmailWithBill = async () => {
  if (!patientEmail) {
    toast({
      title: "No Email Address",
      description: "Patient email address is not available.",
      variant: "destructive",
    });
    return;
  }

  setIsSendingEmail(true);
  try {
    const { error } = await supabase.functions.invoke('send-bill-email', {
      body: {
        email: patientEmail,
        patient_name: patientName,
        bill_id: billId,
        bill_amount: totalAmount,
        bill_items: billItems,
        appointment_time: appointmentTime,
        is_paid: isPaid
      }
    });

    if (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email Sent",
        description: `Bill sent to ${patientEmail}`,
      });
    }
  } catch (error) {
    console.error('Error invoking function:', error);
    toast({
      title: "Error",
      description: "An error occurred while sending the email.",
      variant: "destructive",
    });
  } finally {
    setIsSendingEmail(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bill Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appointment Time</p>
              <p className="font-medium">{appointmentTime}</p>
            </div>
          </div>

          {/* Bill Items */}
          <div>
            <h4 className="font-semibold mb-3">Bill Items</h4>
            <div className="space-y-2">
              {billItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ₦{item.unit_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₦{item.total_price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total and Payment Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Total Amount:</span>
              <span className="text-lg font-bold">₦{totalAmount.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Status:</span>
              <Badge variant={isPaid ? "default" : "secondary"}>
                {isPaid ? "Paid" : "Pending"}
              </Badge>
            </div>
            
            {isPaid && paymentMethod && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                <span className="text-sm">{paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={generatePDF}
              disabled={isGeneratingPdf}
              className="flex-1"
              variant="outline"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generate PDF
            </Button>
            
            <Button 
              onClick={sendEmailWithBill}
              disabled={isSendingEmail || !patientEmail}
              className="flex-1"
              variant="outline"
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Email Bill
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillDetailsDialog;