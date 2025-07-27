import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useFinanceDashboard = () => {
  const { toast } = useToast();
  
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentPayments, setRecentPayments] = useState([]);

  // Fetch bills with patient information
  const fetchBills = async () => {
    try {
      const { data: billsData, error } = await supabase
        .from('bills')
        .select(`
          *,
          patients(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const billsWithStatus = billsData.map(bill => ({
        ...bill,
        patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
        payment_status: getPaymentStatus(bill.amount, bill.amount_paid || 0)
      }));

      setBills(billsWithStatus);
      setFilteredBills(billsWithStatus);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent payments
  const fetchRecentPayments = async () => {
    try {
      const { data: paymentsData, error } = await supabase
        .from('bills')
        .select(`
          *,
          patients(first_name, last_name)
        `)
        .not('amount_paid', 'is', null)
        .gt('amount_paid', 0)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const paymentsWithDetails = paymentsData.map(bill => ({
        ...bill,
        patient_name: `${bill.patients.first_name} ${bill.patients.last_name}`,
        payment_status: getPaymentStatus(bill.amount, bill.amount_paid || 0),
        percentage: Math.round((bill.amount_paid / bill.amount) * 100)
      }));

      setRecentPayments(paymentsWithDetails);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  // Calculate payment status
  const getPaymentStatus = (amount, amountPaid) => {
    if (amountPaid === 0) return 'unpaid';
    if (amountPaid >= amount) return 'fully_paid';
    return 'partially_paid';
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredBills(bills);
      return;
    }

    const filtered = bills.filter(bill => 
      bill.patient_name.toLowerCase().includes(value.toLowerCase()) ||
      bill.id.toLowerCase().includes(value.toLowerCase()) ||
      bill.description?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredBills(filtered);
  };

  // Handle payment
  const handlePayment = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log('Current user from localStorage:', user);
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    const newAmountPaid = (selectedBill.amount_paid || 0) + parseFloat(paymentAmount);
    const isFullyPaid = newAmountPaid >= selectedBill.amount;

    try {
      console.log('Recording payment with paid_by:', user.id);
      const { error } = await supabase
        .from('bills')
        .update({
          amount_paid: newAmountPaid,
          is_paid: isFullyPaid,
          paid_at: isFullyPaid ? new Date().toISOString() : null,
          paid_by: user.id,
          payment_method: paymentMethod,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBill.id);

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: isFullyPaid ? "Bill has been fully paid!" : "Partial payment recorded successfully",
      });

      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setSelectedBill(null);
      fetchBills();
      fetchRecentPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBills();
    fetchRecentPayments();
  }, []);

  // Calculate stats
  const pendingBillsCount = bills.filter(bill => bill.payment_status !== 'fully_paid').length;
  const partialPaymentsCount = bills.filter(bill => bill.payment_status === 'partially_paid').length;
  const outstandingAmount = bills
    .filter(bill => bill.payment_status !== 'fully_paid')
    .reduce((total, bill) => total + (bill.amount - (bill.amount_paid || 0)), 0);
  
  // Calculate today's revenue
  const today = new Date().toDateString();
  const todaysRevenue = bills
    .filter(bill => {
      if (!bill.paid_at && !bill.updated_at) return false;
      const paymentDate = bill.paid_at ? new Date(bill.paid_at) : new Date(bill.updated_at);
      return paymentDate.toDateString() === today && (bill.amount_paid || 0) > 0;
    })
    .reduce((total, bill) => total + (bill.amount_paid || 0), 0);

  const pendingBills = bills.filter(bill => bill.payment_status !== 'fully_paid');

  return {
    // State
    bills,
    filteredBills,
    searchTerm,
    selectedBill,
    paymentAmount,
    paymentMethod,
    isPaymentDialogOpen,
    loading,
    recentPayments,
    
    // Computed values
    pendingBillsCount,
    partialPaymentsCount,
    outstandingAmount,
    todaysRevenue,
    pendingBills,
    
    // Actions
    setSearchTerm,
    setSelectedBill,
    setPaymentAmount,
    setPaymentMethod,
    setIsPaymentDialogOpen,
    handleSearch,
    handlePayment,
    getPaymentStatus,
  };
};