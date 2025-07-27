import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingUp, Calendar } from "lucide-react";

interface MedicationWithInventory {
  id: string;
  name: string;
  dosage: string;
  form: string;
  category: string;
  total_quantity: number;
  total_value: number;
  low_stock: boolean;
  expiry_dates: string[];
}

interface InventoryReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medications: MedicationWithInventory[];
}

export const InventoryReportsDialog = ({ open, onOpenChange, medications }: InventoryReportsDialogProps) => {
  // Calculate report data
  const totalValue = medications.reduce((sum, med) => sum + med.total_value, 0);
  const totalItems = medications.length;
  const lowStockItems = medications.filter(med => med.low_stock);
  const outOfStockItems = medications.filter(med => med.total_quantity === 0);
  
  // Get medications expiring in next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringItems = medications.filter(med => 
    med.expiry_dates.some(date => 
      new Date(date) <= thirtyDaysFromNow && new Date(date) >= new Date()
    )
  );

  // Category breakdown
  const categoryBreakdown = medications.reduce((acc, med) => {
    acc[med.category] = (acc[med.category] || 0) + med.total_value;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Reports</DialogTitle>
          <DialogDescription>
            Comprehensive inventory analysis and reports
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="expiring">Expiring</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{outOfStockItems.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Value Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {medications
                    .sort((a, b) => b.total_value - a.total_value)
                    .slice(0, 5)
                    .map((med, index) => (
                      <div key={med.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">#{index + 1} {med.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {med.dosage} - Qty: {med.total_quantity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₦{med.total_value.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="low-stock" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alerts ({lowStockItems.length})
                </CardTitle>
                <CardDescription>
                  Medications that need to be reordered
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No low stock items found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lowStockItems.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{med.name} - {med.dosage}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.category} • {med.form}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {med.total_quantity} units left
                          </Badge>
                          {med.total_quantity === 0 && (
                            <Badge variant="destructive">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expiring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Expiring Soon ({expiringItems.length})
                </CardTitle>
                <CardDescription>
                  Medications expiring within 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expiringItems.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No medications expiring soon
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expiringItems.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{med.name} - {med.dosage}</div>
                          <div className="text-sm text-muted-foreground">
                            {med.category} • Qty: {med.total_quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Next Expiry:</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(med.expiry_dates[0]).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Category Breakdown
                </CardTitle>
                <CardDescription>
                  Inventory value by medication category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topCategories.map(([category, value]) => {
                    const percentage = ((value / totalValue) * 100).toFixed(1);
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {medications.filter(m => m.category === category).length} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₦{value.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};