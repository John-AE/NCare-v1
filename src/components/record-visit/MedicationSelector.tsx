import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: string;
  manufacturer: string;
  category: string;
  description?: string;
  total_quantity: number;
}

interface MedicationItem {
  id: string;
  medication_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface MedicationSelectorProps {
  medicationItems: MedicationItem[];
  setMedicationItems: (items: MedicationItem[]) => void;
}

export const MedicationSelector = ({
  medicationItems,
  setMedicationItems
}: MedicationSelectorProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchMedications();
  }, [profile]);

  useEffect(() => {
    filterMedications();
  }, [medications, searchTerm, selectedCategory]);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_inventory')
        .select(`
          id,
          quantity_on_hand,
          medications!inner(
            id,
            name,
            dosage,
            form,
            manufacturer,
            category,
            description
          )
        `)
        .eq('medications.is_active', true)
        .eq('hospital_id', profile?.hospital_id)
        .gt('quantity_on_hand', 0)
        .order('medications(name)', { ascending: true });

      if (error) throw error;

      // Transform and aggregate medications by medication ID
      const medicationsMap = new Map();
      data?.forEach(item => {
        const med = item.medications;
        if (medicationsMap.has(med.id)) {
          medicationsMap.get(med.id).total_quantity += item.quantity_on_hand;
        } else {
          medicationsMap.set(med.id, {
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            form: med.form,
            manufacturer: med.manufacturer,
            category: med.category,
            description: med.description,
            total_quantity: item.quantity_on_hand
          });
        }
      });

      const medicationsArray = Array.from(medicationsMap.values());
      setMedications(medicationsArray);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(medicationsArray.map(med => med.category).filter(category => category && category.trim() !== ''))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedications = () => {
    let filtered = medications;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(med => med.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMedications(filtered);
  };

  const addMedication = (medication: Medication) => {
    const existingItem = medicationItems.find(item => item.id === medication.id);
    
    if (existingItem) {
      // Increase quantity if medication already exists
      setMedicationItems(
        medicationItems.map(item =>
          item.id === medication.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_price: (item.quantity + 1) * item.unit_price
              }
            : item
        )
      );
    } else {
      // Add new medication - doctor sets the price
      const newItem: MedicationItem = {
        id: medication.id,
        medication_name: `${medication.name} ${medication.dosage} (${medication.form})`,
        quantity: 1,
        unit_price: 0, // Doctor will set this
        total_price: 0
      };
      setMedicationItems([...medicationItems, newItem]);
    }
  };

  const updateQuantity = (medicationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeMedication(medicationId);
      return;
    }

    setMedicationItems(
      medicationItems.map(item =>
        item.id === medicationId
          ? {
              ...item,
              quantity,
              total_price: quantity * item.unit_price
            }
          : item
      )
    );
  };

  const updatePrice = (medicationId: string, price: number) => {
    setMedicationItems(
      medicationItems.map(item =>
        item.id === medicationId
          ? {
              ...item,
              unit_price: price,
              total_price: item.quantity * price
            }
          : item
      )
    );
  };

  const removeMedication = (medicationId: string) => {
    setMedicationItems(medicationItems.filter(item => item.id !== medicationId));
  };

  const groupedMedications = categories.reduce((acc, category) => {
    const categoryMedications = filteredMedications.filter(med => med.category === category);
    if (categoryMedications.length > 0) {
      acc[category] = categoryMedications;
    }
    return acc;
  }, {} as Record<string, Medication[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Medication Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Available Medications</CardTitle>
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search medications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading medications...</div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {Object.entries(groupedMedications).map(([category, categoryMedications]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryMedications.map(medication => (
                        <div
                          key={medication.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{medication.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {medication.dosage} - {medication.form}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Stock: {medication.total_quantity} units
                            </p>
                            {medication.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {medication.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addMedication(medication)}
                            className="ml-2"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Selected Medications */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Medications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicationItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medications selected
            </div>
          ) : (
            <div className="space-y-3">
              {medicationItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.medication_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-8"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={item.unit_price || ''}
                      onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                      className="w-20 h-8"
                    />
                    <p className="text-sm font-medium w-20 text-right">
                      ₦{item.total_price.toLocaleString()}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMedication(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};