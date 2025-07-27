import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Receipt, FileDown, Plus, Edit } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_active: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
}

interface BillItem {
  service: Service;
  quantity: number;
  total: number;
}

export const BillingCard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<BillItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", price: 0, category: "" });
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
    fetchPatients();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch services",
        variant: "destructive"
      });
    } else {
      setServices(data || []);
    }
  };

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .order('first_name', { ascending: true });
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients",
        variant: "destructive"
      });
    } else {
      setPatients(data || []);
    }
  };

  const handleServiceToggle = (service: Service, quantity: number) => {
    if (quantity === 0) {
      setSelectedServices(prev => prev.filter(item => item.service.id !== service.id));
    } else {
      setSelectedServices(prev => {
        const existing = prev.find(item => item.service.id === service.id);
        if (existing) {
          return prev.map(item => 
            item.service.id === service.id 
              ? { ...item, quantity, total: service.price * quantity }
              : item
          );
        } else {
          return [...prev, { service, quantity, total: service.price * quantity }];
        }
      });
    }
  };

  const calculateTotal = () => {
    return selectedServices.reduce((total, item) => total + item.total, 0);
  };

  const generateBill = async () => {
    if (!selectedPatient || selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please select a patient and at least one service",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const total = calculateTotal();
      const selectedPatientData = patients.find(p => p.id === selectedPatient);
      
      // Create bill
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          patient_id: selectedPatient,
          amount: total,
          created_by: profile?.user_id,
          description: `Medical services for ${selectedPatientData?.first_name} ${selectedPatientData?.last_name}`,
          hospital_id: profile?.hospital_id
        })
        .select()
        .single();

      if (billError) throw billError;

      // Create bill items
      const billItems = selectedServices.map(item => ({
        bill_id: billData.id,
        service_id: item.service.id,
        quantity: item.quantity,
        unit_price: item.service.price,
        total_price: item.total
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Bill generated successfully",
      });

      // Reset form
      setSelectedPatient("");
      setSelectedServices([]);
      setShowBillDialog(false);

    } catch (error) {
      console.error('Error generating bill:', error);
      toast({
        title: "Error",
        description: "Failed to generate bill",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (!selectedPatient || selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please select a patient and services first",
        variant: "destructive"
      });
      return;
    }

    const selectedPatientData = patients.find(p => p.id === selectedPatient);
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Medical Bill', 20, 30);
    
    // Patient info
    doc.setFontSize(12);
    doc.text(`Patient: ${selectedPatientData?.first_name} ${selectedPatientData?.last_name}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    doc.text(`Doctor: Dr. ${profile?.username}`, 20, 70);

    // Services table
    const tableData = selectedServices.map(item => [
      item.service.name,
      item.service.description || '',
      item.quantity.toString(),
      `₦${item.service.price.toLocaleString()}`,
      `₦${item.total.toLocaleString()}`
    ]);

    autoTable(doc, {
      head: [['Service', 'Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
      startY: 80,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(14);
    doc.text(`Grand Total: ₦${calculateTotal().toLocaleString()}`, 20, finalY + 20);

    // Save PDF
    doc.save(`medical-bill-${selectedPatientData?.first_name}-${selectedPatientData?.last_name}-${new Date().toDateString()}.pdf`);
  };

  const saveService = async () => {
    if (!newService.name || !newService.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(newService)
          .eq('id', editingService.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(newService);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Service ${editingService ? 'updated' : 'added'} successfully`,
      });

      setNewService({ name: "", description: "", price: 0, category: "" });
      setEditingService(null);
      setShowServiceDialog(false);
      fetchServices();

    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Error",
        description: "Failed to save service",
        variant: "destructive"
      });
    }
  };

  const groupedServices = services.reduce((groups, service) => {
    const category = service.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(service);
    return groups;
  }, {} as Record<string, Service[]>);

  return (
    <Card className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Patient Billing
        </CardTitle>
        <CardDescription>Generate bills for patient services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Receipt className="h-4 w-4 mr-2" />
                Generate Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generate Patient Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patient">Select Patient</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Select Services</Label>
                  <div className="max-h-60 overflow-y-auto space-y-3 mt-2">
                    {Object.entries(groupedServices).map(([category, categoryServices]) => (
                      <div key={category}>
                        <h4 className="font-semibold text-sm mb-2">{category}</h4>
                        <div className="space-y-2 pl-4">
                          {categoryServices.map(service => {
                            const selectedItem = selectedServices.find(item => item.service.id === service.id);
                            return (
                              <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={!!selectedItem}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleServiceToggle(service, 1);
                                      } else {
                                        handleServiceToggle(service, 0);
                                      }
                                    }}
                                  />
                                  <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-sm text-muted-foreground">{service.description}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">₦{service.price.toLocaleString()}</Badge>
                                  {selectedItem && (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={selectedItem.quantity}
                                      onChange={(e) => handleServiceToggle(service, parseInt(e.target.value) || 1)}
                                      className="w-16"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedServices.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Bill Summary</h4>
                      {selectedServices.map(item => (
                        <div key={item.service.id} className="flex justify-between">
                          <span>{item.service.name} x{item.quantity}</span>
                          <span>₦{item.total.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span>₦{calculateTotal().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={generateBill} disabled={isGenerating} className="flex-1">
                    {isGenerating ? "Generating..." : "Generate Bill"}
                  </Button>
                  <Button onClick={generatePDF} variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </CardContent>
    </Card>
  );
};