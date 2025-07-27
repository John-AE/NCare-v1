import { useState, useRef } from "react";
import { useAuth } from "../AuthProvider";
import { useNurseDashboardStats } from "@/hooks/useNurseDashboardStats";
import { useAutoRefresh } from '@/hooks/useAutoRefresh'; // <-- Add this import
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NurseStatsCards } from "./nurse/NurseStatsCards";
import { PatientManagement } from "./nurse/PatientManagement";
import { AppointmentManagement } from "./nurse/AppointmentManagement";
import { DateAppointments } from "./doctor/DateAppointments";
import { ScheduledPatientsQueue } from "./nurse/ScheduledPatientsQueue";
import { RecentRegistrations } from "./nurse/RecentRegistrations";
import { TriageQueue } from "./nurse/TriageQueue";
import { CompletedConsultations } from "./nurse/CompletedConsultations";
import PatientRegistrationForm from "../PatientRegistrationForm";
import AppointmentSchedulingForm from "../AppointmentSchedulingForm";
import RecurringAppointmentForm from "../RecurringAppointmentForm";
import { DashboardToggle } from "../DashboardToggle";
import { PatientTimelineView } from "../PatientTimelineView";

const NurseDashboard = () => {
  const { profile } = useAuth();
  const { stats, loading, refetch } = useNurseDashboardStats();
  const [viewMode, setViewMode] = useState<'dashboard' | 'timeline'>('dashboard');

  
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  
  // Refs to trigger refreshes without re-mounting components
  const recentRegistrationsRefreshRef = useRef<() => void>(null);
  const triageQueueRefreshRef = useRef<() => void>(null);
  const dateAppointmentsRefreshRef = useRef<() => void>(null);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handlePatientRegistrationSuccess = () => {
    // Auto-refresh Recent Registrations when a patient is registered
    if (recentRegistrationsRefreshRef.current) {
      recentRegistrationsRefreshRef.current();
    }
    // Stats are automatically updated via real-time listeners in useNurseDashboardStats
  };

  const handleVitalsRecorded = () => {
    // Auto-refresh both Recent Registrations and Triage Queue when vitals are recorded
    // Add 2-second delay for triage queue refresh as requested
    if (recentRegistrationsRefreshRef.current) {
      recentRegistrationsRefreshRef.current();
    }
    setTimeout(() => {
      if (triageQueueRefreshRef.current) {
        triageQueueRefreshRef.current();
      }
    }, 2000);
  };

  const handlePatientArrived = () => {
    // Trigger refresh of components when a patient is marked as arrived
    if (dateAppointmentsRefreshRef.current) {
      dateAppointmentsRefreshRef.current();
    }
  };

  const handleAppointmentScheduled = () => {
    // Auto-refresh Appointments by Date when an appointment is scheduled
    if (dateAppointmentsRefreshRef.current) {
      dateAppointmentsRefreshRef.current();
    }
    // Stats are automatically updated via real-time listeners in useNurseDashboardStats
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
            <h1 className="text-3xl font-bold text-foreground">Nurse Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.username}</p>
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
      <NurseStatsCards stats={stats} />

      {/* Dashboard Toggle */}
      <DashboardToggle viewMode={viewMode} onToggle={setViewMode} />

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientManagement
          onRegisterPatient={() => setShowPatientForm(true)}
          onScheduleAppointment={() => setShowAppointmentForm(true)}
          onPatientSelect={setSelectedPatient}
        />

        <AppointmentManagement
          onScheduleAppointment={() => setShowAppointmentForm(true)}
          onSetupRecurring={() => setShowRecurringForm(true)}
        />
      </div>

      {/* Full Width Cards */}
      <div className="space-y-6">
        <DateAppointments 
          onPatientArrived={handlePatientArrived}
          refreshTrigger={dateAppointmentsRefreshRef}
        />
        <ScheduledPatientsQueue />
        <RecentRegistrations 
          refreshTrigger={recentRegistrationsRefreshRef}
          onVitalsRecorded={handleVitalsRecorded}
        />
        <TriageQueue refreshTrigger={triageQueueRefreshRef} />
        <CompletedConsultations />
      </div>

      <PatientRegistrationForm
        isOpen={showPatientForm}
        onClose={() => setShowPatientForm(false)}
        onSuccess={handlePatientRegistrationSuccess}
      />
      
      <AppointmentSchedulingForm
        isOpen={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setSelectedPatient(null);
        }}
        preSelectedPatient={selectedPatient}
        onSuccess={handleAppointmentScheduled}
      />
      
      <RecurringAppointmentForm
        isOpen={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
      />
    </div>
  );
};

export default NurseDashboard;