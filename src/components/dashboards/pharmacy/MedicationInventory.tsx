import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, AlertTriangle, Plus, Minus, FileText } from "lucide-react";
import { AddMedicationDialog } from "./AddMedicationDialog";
import { ReceiveStockDialog } from "./ReceiveStockDialog";
import { DispenseMedicationDialog } from "./DispenseMedicationDialog";
import { InventoryReportsDialog } from "./InventoryReportsDialog";

interface MedicationWithInventory {
  id: string;
  name: string;
  dosage: string;
  form: string;
  manufacturer: string;
  category: string;
  total_quantity: number;
  total_value: number;
  low_stock: boolean;
  expiry_dates: string[];
}

export const MedicationInventory = () => {
  const [medications, setMedications] = useState<MedicationWithInventory[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<MedicationWithInventory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showDispenseDialog, setShowDispenseDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select(`
          id,
          name,
          dosage,
          form,
          manufacturer,
          category,
          medication_inventory (
            quantity_on_hand,
            total_cost,
            reorder_point,
            expiry_date
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      const formattedMedications: MedicationWithInventory[] = data.map(med => {
        const inventory = med.medication_inventory || [];
        const totalQuantity = inventory.reduce((sum, inv) => sum + (inv.quantity_on_hand || 0), 0);
        const totalValue = inventory.reduce((sum, inv) => sum + (inv.total_cost || 0), 0);
        const reorderPoint = inventory.length > 0 ? Math.min(...inventory.map(inv => inv.reorder_point)) : 0;
        const expiryDates = inventory.map(inv => inv.expiry_date).filter(date => date);

        return {
          id: med.id,
          name: med.name,
          dosage: med.dosage,
          form: med.form,
          manufacturer: med.manufacturer,
          category: med.category,
          total_quantity: totalQuantity,
          total_value: totalValue,
          low_stock: totalQuantity <= reorderPoint,
          expiry_dates: expiryDates,
        };
      });

      setMedications(formattedMedications);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  useEffect(() => {
    let filtered = medications;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      if (selectedCategory === "low_stock") {
        filtered = filtered.filter(med => med.low_stock);
      } else {
        filtered = filtered.filter(med => med.category.toLowerCase() === selectedCategory.toLowerCase());
      }
    }

    setFilteredMedications(filtered);
  }, [medications, searchQuery, selectedCategory]);

  const categories = ["all", "low_stock", ...Array.from(new Set(medications.map(med => med.category)))];

  if (loading) {
    return (
      <Card className="border-l-8 border-l-[#FF37A6]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Medication Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-8 border-l-[#FF37A6]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Medication Inventory
            <Badge variant="outline" className="ml-auto">
              {filteredMedications.length} items
            </Badge>
          </CardTitle>
          <CardDescription>Manage medication stock and inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button onClick={() => setShowReceiveDialog(true)} variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Receive
              </Button>
              <Button onClick={() => setShowDispenseDialog(true)} variant="outline" size="sm">
                <Minus className="h-4 w-4 mr-2" />
                Dispense
              </Button>
              <Button onClick={() => setShowReportsDialog(true)} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="low_stock" className="text-destructive">
                  Low Stock
                </TabsTrigger>
                {categories.slice(2, 6).map(category => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Medication List */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredMedications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchQuery || selectedCategory !== "all" 
                  ? "No medications found matching your criteria" 
                  : "No medications in inventory"}
              </div>
            ) : (
              filteredMedications.map((medication) => (
                <div
                  key={medication.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{medication.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {medication.dosage}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {medication.form}
                        </Badge>
                        {medication.low_stock && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {medication.manufacturer} • {medication.category}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          Qty: {medication.total_quantity}
                        </span>
                        <span className="text-muted-foreground">
                          Value: ₦{medication.total_value.toLocaleString()}
                        </span>
                        {medication.expiry_dates.length > 0 && (
                          <span className="text-muted-foreground">
                            Next Expiry: {new Date(medication.expiry_dates[0]).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddMedicationDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={fetchMedications}
      />
      <ReceiveStockDialog 
        open={showReceiveDialog} 
        onOpenChange={setShowReceiveDialog}
        medications={medications}
        onSuccess={fetchMedications}
      />
      <DispenseMedicationDialog 
        open={showDispenseDialog} 
        onOpenChange={setShowDispenseDialog}
        medications={medications}
        onSuccess={fetchMedications}
      />
      <InventoryReportsDialog 
        open={showReportsDialog} 
        onOpenChange={setShowReportsDialog}
        medications={medications}
      />
    </>
  );
};