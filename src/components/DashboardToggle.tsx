import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, LayoutDashboard } from "lucide-react";

interface DashboardToggleProps {
  viewMode: 'dashboard' | 'timeline';
  onToggle: (mode: 'dashboard' | 'timeline') => void;
}

export const DashboardToggle = ({ viewMode, onToggle }: DashboardToggleProps) => {
  return (
    <div className="flex items-center justify-center space-x-4 py-4 border rounded-lg bg-muted/30">
      <div className="flex items-center space-x-2">
        <LayoutDashboard className="h-4 w-4" />
        <Label htmlFor="view-toggle" className="text-sm font-medium">
          Dashboard View
        </Label>
      </div>
      
      <Switch
        id="view-toggle"
        checked={viewMode === 'timeline'}
        onCheckedChange={(checked) => onToggle(checked ? 'timeline' : 'dashboard')}
      />
      
      <div className="flex items-center space-x-2">
        <Clock className="h-4 w-4" />
        <Label htmlFor="view-toggle" className="text-sm font-medium">
          Patient Timeline
        </Label>
      </div>
    </div>
  );
};