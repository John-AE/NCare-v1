export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'fully_paid': return 'default';
    case 'partially_paid': return 'secondary';
    case 'unpaid': return 'destructive';
    default: return 'outline';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'fully_paid': return 'Fully Paid';
    case 'partially_paid': return 'Partially Paid';
    case 'unpaid': return 'Unpaid';
    default: return 'Unknown';
  }
};

export const getPaymentMethodDisplay = (method: string) => {
  switch (method) {
    case 'cash': return 'Cash';
    case 'debit_card': return 'Debit Card';
    case 'bank_transfer': return 'Bank Transfer';
    default: return method || 'N/A';
  }
};