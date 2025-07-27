import { useState, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { useDoctorDashboardStats } from "@/hooks/useDoctorDashboardStats";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickStatsCards } from "./doctor/QuickStatsCards";
import { DateAppointments } from "./doctor/DateAppointments";
import { TodaysSchedule } from "./doctor/TodaysSchedule";
import { TriageQueue } from "./nurse/TriageQueue";
import { CompletedAppointmentsBills } from "./doctor/CompletedAppointmentsBills";
import { StandaloneBillingCard } from "./doctor/StandaloneBillingCard";
import { DashboardToggle } from "../DashboardToggle";
import { PatientTimelineView } from "../PatientTimelineView";


const DoctorDashboard = () => {
  const { profile } = useAuth();
  const stats = useDoctorDashboardStats();
  const [viewMode, setViewMode] = useState<'dashboard' | 'timeline'>('dashboard');
  
  // Refs to trigger refreshes without re-mounting components
  const triageQueueRefreshRef = useRef<() => void>(null);
  const dateAppointmentsRefreshRef = useRef<() => void>(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Handle vitals recording to refresh triage queue after 2 seconds
  const handleVitalsRecorded = () => {
    setTimeout(() => {
      if (triageQueueRefreshRef.current) {
        triageQueueRefreshRef.current();
      }
    }, 2000);
  };

  if (viewMode === 'timeline') {
    return <PatientTimelineView onBack={() => setViewMode('dashboard')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Doctor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Dr. {profile?.username}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStatsCards stats={stats} />

      {/* Dashboard Toggle */}
      <DashboardToggle viewMode={viewMode} onToggle={setViewMode} />

      {/* Appointments by Date - Full Width */}
      <DateAppointments 
        refreshTrigger={dateAppointmentsRefreshRef}
      />

      {/* Today's Schedule - Full Width */}
      <TodaysSchedule />

      {/* Triage Assessment / Queue */}
      <TriageQueue 
        showRecordVisitButton={true} 
        showVitalSigns={true} 
        refreshTrigger={triageQueueRefreshRef}
      />

      {/* Standalone Billing Card */}
      <StandaloneBillingCard />

      {/* Completed Appointments and Bills */}
      <CompletedAppointmentsBills />

    </div>
  );
};

export default DoctorDashboard;