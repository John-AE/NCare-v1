import { PharmacyDashboardStats } from "@/hooks/usePharmacyDashboard";

interface PharmacyStatsCardsProps {
  stats: PharmacyDashboardStats;
}

export const PharmacyStatsCards = ({ stats }: PharmacyStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Total Medications", 
      value: stats.totalMedications.toString(), 
      borderColor: "border-l-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-900"
    },
    { 
      label: "Low Stock Alerts", 
      value: stats.lowStockAlerts.toString(), 
      borderColor: "border-l-rose-500",
      bgColor: "bg-rose-50",
      textColor: "text-rose-900"
    },
    { 
      label: "Inventory Value", 
      value: `₦${stats.totalInventoryValue.toLocaleString()}`, 
      borderColor: "border-l-primary",
      bgColor: "bg-primary/5",
      textColor: "text-primary"
    },
    { 
      label: "Dispensed Today", 
      value: stats.dispensedToday.toString(), 
      borderColor: "border-l-teal-600",
      bgColor: "bg-teal-600/5",
      textColor: "text-teal-600"
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