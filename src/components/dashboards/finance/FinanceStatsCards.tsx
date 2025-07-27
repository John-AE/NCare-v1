import { Card, CardContent } from "@/components/ui/card";

interface FinanceStatsCardsProps {
  todaysRevenue: number;
  pendingBillsCount: number;
  partialPaymentsCount: number;
  outstandingAmount: number;
}

export const FinanceStatsCards = ({
  todaysRevenue,
  pendingBillsCount,
  partialPaymentsCount,
  outstandingAmount
}: FinanceStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Today's Revenue", 
      value: `₦${todaysRevenue.toLocaleString()}`, 
      borderColor: "border-l-secondary",
      bgColor: "bg-secondary/5",
      textColor: "text-secondary-foreground"
    },
    { 
      label: "Pending Bills", 
      value: pendingBillsCount.toString(), 
      borderColor: "border-l-rose-500",
      bgColor: "bg-rose-50",
      textColor: "text-rose-900"
    },
    { 
      label: "Partial Payments", 
      value: partialPaymentsCount.toString(), 
      borderColor: "border-l-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-900"
    },
    { 
      label: "Total Outstanding Amount", 
      value: `₦${outstandingAmount.toLocaleString()}`, 
      borderColor: "border-l-primary",
      bgColor: "bg-primary/5",
      textColor: "text-primary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickStats.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.borderColor} ${stat.bgColor} ${stat.textColor} border-l-8 rounded-lg px-6 py-4 shadow-sm hover:shadow-md transition-all duration-200`}
        >
          <div className="flex flex-col">
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm font-medium opacity-80">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};