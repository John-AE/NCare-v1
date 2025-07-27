import { NurseDashboardStats } from "@/hooks/useNurseDashboardStats";

interface NurseStatsCardsProps {
  stats: NurseDashboardStats;
}

export const NurseStatsCards = ({ stats }: NurseStatsCardsProps) => {
  const quickStats = [
    { 
      label: "Total Patients", 
      value: stats.totalPatients.toString(), 
      borderColor: "border-l-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-900"
    },
    { 
      label: "New Patients Today", 
      value: stats.newPatientsToday.toString(), 
      borderColor: "border-l-rose-500",
      bgColor: "bg-rose-50",
      textColor: "text-rose-900"
    },
    { 
      label: "Today's Appointments", 
      value: stats.todaysAppointments.toString(), 
      borderColor: "border-l-primary",
      bgColor: "bg-primary/5",
      textColor: "text-primary"
    },
    { 
      label: "Total Pending Bills", 
      value: stats.totalPendingBills.toString(), 
      borderColor: "border-l-cyan-700",
      bgColor: "bg-cyan-700/5",
      textColor: "text-cyan-700"
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