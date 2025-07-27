import React, { createContext, useContext, useRef } from 'react';

interface DashboardRefreshTriggers {
  refreshStats: (() => void) | null;
  refreshPatients: (() => void) | null;
  refreshTriageQueue: (() => void) | null;
  refreshAppointments: (() => void) | null;
  refreshAll: () => void;
}

interface DashboardContextType {
  triggers: React.MutableRefObject<DashboardRefreshTriggers>;
  registerStatsRefresh: (callback: () => void) => void;
  registerPatientsRefresh: (callback: () => void) => void;
  registerTriageQueueRefresh: (callback: () => void) => void;
  registerAppointmentsRefresh: (callback: () => void) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const triggers = useRef<DashboardRefreshTriggers>({
    refreshStats: null,
    refreshPatients: null,
    refreshTriageQueue: null,
    refreshAppointments: null,
    refreshAll: () => {
      triggers.current.refreshStats?.();
      triggers.current.refreshPatients?.();
      triggers.current.refreshTriageQueue?.();
      triggers.current.refreshAppointments?.();
    }
  });

  const registerStatsRefresh = (callback: () => void) => {
    triggers.current.refreshStats = callback;
  };

  const registerPatientsRefresh = (callback: () => void) => {
    triggers.current.refreshPatients = callback;
  };

  const registerTriageQueueRefresh = (callback: () => void) => {
    triggers.current.refreshTriageQueue = callback;
  };

  const registerAppointmentsRefresh = (callback: () => void) => {
    triggers.current.refreshAppointments = callback;
  };

  return (
    <DashboardContext.Provider value={{
      triggers,
      registerStatsRefresh,
      registerPatientsRefresh,
      registerTriageQueueRefresh,
      registerAppointmentsRefresh
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
