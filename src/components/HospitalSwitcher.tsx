import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface Hospital {
  id: string;
  name: string;
  is_active: boolean;
}

export const HospitalSwitcher = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (profile?.hospital_id) {
      setSelectedHospital(profile.hospital_id);
    }
  }, [profile]);

  const fetchHospitals = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const switchHospital = async () => {
    if (!selectedHospital || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hospital_id: selectedHospital })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast({
        title: "Hospital Switched",
        description: "Successfully switched to the selected hospital"
      });

      // Refresh the page to update the context
      window.location.reload();
    } catch (error) {
      console.error('Error switching hospital:', error);
      toast({
        title: "Error",
        description: "Failed to switch hospital",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Only show for admin users
  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Building className="w-5 h-5 text-muted-foreground" />
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">
              Switch Hospital Context
            </label>
            <Select value={selectedHospital} onValueChange={setSelectedHospital}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={switchHospital}
            disabled={loading || !selectedHospital || selectedHospital === profile?.hospital_id}
            size="sm"
          >
            {loading ? 'Switching...' : 'Switch'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};