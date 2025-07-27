import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./components/LoginPage";
import DoctorDashboard from "./components/dashboards/DoctorDashboard";
import NurseDashboard from "./components/dashboards/NurseDashboard";
import FinanceDashboard from "./components/dashboards/FinanceDashboard";
import { AdminDashboard } from "./components/dashboards/AdminDashboard";
import { PharmacyDashboard } from "./components/dashboards/PharmacyDashboard";
import { RecordVisit } from "./pages/RecordVisit";
import Layout from "./components/Layout";
import { AuthProvider, useAuth } from "./components/AuthProvider";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !profile || profile.role !== allowedRole) {
    return <LoginPage />;
  }
  
  return <Layout>{children}</Layout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/doctor-dashboard" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/nurse-dashboard" 
              element={
                <ProtectedRoute allowedRole="nurse">
                  <NurseDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/finance-dashboard" 
              element={
                <ProtectedRoute allowedRole="finance">
                  <FinanceDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pharmacy-dashboard" 
              element={
                <ProtectedRoute allowedRole="pharmacy">
                  <PharmacyDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/record-visit/:appointmentId" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <RecordVisit />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/record-visit/walk-in/:appointmentId" 
              element={
                <ProtectedRoute allowedRole="doctor">
                  <RecordVisit />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
