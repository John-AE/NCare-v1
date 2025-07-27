import { Card, CardContent } from "@/components/ui/card";
import { DashboardStats } from "@/hooks/useDoctorDashboardStats";
interface QuickStatsCardsProps {
  stats: DashboardStats;
}
export const QuickStatsCards = ({ stats }: QuickStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Total Appointments Today", 
      value: stats.totalAppointmentsToday.toString(), 
      borderColor: "border-l-primary",
      bgColor: "bg-primary/5",
      textColor: "text-primary"
    },
    { 
      label: "Scheduled", 
      value: stats.scheduledAppointments.toString(), 
      borderColor: "border-l-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-900"
    },
    { 
      label: "Arrived", 
      value: stats.arrivedPatients.toString(), 
      borderColor: "border-l-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-900"
    },
    { 
      label: "Completed", 
      value: stats.completedAppointments.toString(), 
      borderColor: "border-l-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-900"
    },
    { 
      label: "Total Patients", 
      value: stats.totalPatients.toString(), 
      borderColor: "border-l-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-900"
    },
    { 
      label: "Pending Bills", 
      value: stats.pendingBills.toString(), 
      borderColor: "border-l-rose-500",
      bgColor: "bg-rose-50",
      textColor: "text-rose-900"
    },
    { 
      label: "Today's Revenue", 
      value: `₦${stats.todaysRevenue.toFixed(2)}`, 
      borderColor: "border-l-red-600",
      bgColor: "bg-red-600/5",
      textColor: "text-red-600"
    }
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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