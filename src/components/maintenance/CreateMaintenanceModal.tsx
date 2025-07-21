import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Clock, AlertTriangle, CheckCircle, Eye, Building2, Users, DollarSign, List, Package, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Machine {
  id: number;
  name: string;
  model: string;
  location: string;
  status: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const CreateMaintenanceModal: React.FC<CreateMaintenanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    machine_id: '',
    technician_id: 'none',
    scheduled_date: new Date(),
    estimated_duration: 60,
    maintenance_type: 'preventive' as 'preventive' | 'corrective' | 'emergency' | 'inspection',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    frequency: 'once' as 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    checklist: [] as { task: string; completed: boolean }[],
    required_parts: [] as { name: string; quantity: number; estimated_cost: number }[],
    estimated_cost: 0,
    notes: '',
    isRecurring: false
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newPart, setNewPart] = useState({ name: '', quantity: 1, estimated_cost: 0 });
  const [recurrencePattern, setRecurrencePattern] = useState({
    interval: 1,
    endDate: null as Date | null,
    maxOccurrences: null as number | null
  });

  const { toast } = useToast();

  // Charger les données initiales
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [machinesRes, techniciansRes] = await Promise.all([
        api.get<any>('/machines'),
        api.get<any>('/users?role=technician')
      ]);

      setMachines(machinesRes.data || []);
      setTechnicians(techniciansRes.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [...prev.checklist, { task: newChecklistItem.trim(), completed: false }]
      }));
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const addRequiredPart = () => {
    if (newPart.name.trim()) {
      setFormData(prev => ({
        ...prev,
        required_parts: [...prev.required_parts, { ...newPart, name: newPart.name.trim() }]
      }));
      setNewPart({ name: '', quantity: 1, estimated_cost: 0 });
    }
  };

  const removeRequiredPart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalCost = () => {
    const partsCost = formData.required_parts.reduce((sum, part) => sum + (part.estimated_cost * part.quantity), 0);
    return formData.estimated_cost + partsCost;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      machine_id: '',
      technician_id: 'none',
      scheduled_date: new Date(),
      estimated_duration: 60,
      maintenance_type: 'preventive',
      priority: 'medium',
      frequency: 'once',
      checklist: [],
      required_parts: [],
      estimated_cost: 0,
      notes: '',
      isRecurring: false
    });
    setNewChecklistItem('');
    setNewPart({ name: '', quantity: 1, estimated_cost: 0 });
    setRecurrencePattern({
      interval: 1,
      endDate: null,
      maxOccurrences: null
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.machine_id) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        machine_id: parseInt(formData.machine_id),
        technician_id: formData.technician_id && formData.technician_id !== 'none' ? parseInt(formData.technician_id) : null,
        scheduled_date: formData.scheduled_date.toISOString(),
        recurrence_pattern: formData.isRecurring ? recurrencePattern : null
      };
      
      await api.post('/maintenance-schedules', submitData);
      
      toast({
        title: "Succès",
        description: "Maintenance créée avec succès"
      });
      
      onSuccess();
      onClose();
      resetForm();
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Impossible de créer la maintenance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMaintenanceTypeIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'corrective': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'inspection': return <Eye className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col mx-auto my-2 sm:my-4">
        {/* En-tête fixe */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sm:p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Créer une nouvelle maintenance</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">Planifiez une maintenance pour une machine</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetForm}
                className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Section 1: Informations de base */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Informations de base</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Titre de la maintenance *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Maintenance préventive mensuelle"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="machine" className="text-sm font-medium text-gray-700">
                    Machine *
                  </Label>
                  <Select
                    value={formData.machine_id}
                    onValueChange={(value) => handleInputChange('machine_id', value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Sélectionner une machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.length > 0 ? (
                        machines.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{machine.name}</span>
                              <span className="text-xs text-gray-500">{machine.model} - {machine.location}</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Chargement des machines...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Description détaillée de la maintenance..."
                  rows={3}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Section 2: Planification */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Planification</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date et heure *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
                          !formData.scheduled_date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.scheduled_date ? (
                          format(formData.scheduled_date, "dd/MM/yyyy 'à' HH:mm", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.scheduled_date}
                        onSelect={(date) => date && handleInputChange('scheduled_date', date)}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                    Durée estimée (minutes)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value))}
                    min="15"
                    step="15"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="technician" className="text-sm font-medium text-gray-700">
                    Technicien
                  </Label>
                  <Select
                    value={formData.technician_id}
                    onValueChange={(value) => handleInputChange('technician_id', value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Sélectionner un technicien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non assigné</SelectItem>
                      {technicians.length > 0 ? (
                        technicians.map((technician) => (
                          <SelectItem key={technician.id} value={technician.id.toString()}>
                            {technician.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Chargement des techniciens...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Type de maintenance
                  </Label>
                  <Select
                    value={formData.maintenance_type}
                    onValueChange={(value) => handleInputChange('maintenance_type', value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Préventive
                        </div>
                      </SelectItem>
                      <SelectItem value="corrective">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Corrective
                        </div>
                      </SelectItem>
                      <SelectItem value="emergency">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          Urgence
                        </div>
                      </SelectItem>
                      <SelectItem value="inspection">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          Inspection
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Priorité
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-medium text-gray-700">
                    Coût estimé (FCFA)
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    value={formData.estimated_cost}
                    onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="100"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Récurrence */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Récurrence</h3>
              </div>
              
              <div className="flex items-center space-x-3 mb-4">
                <Switch
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => {
                    handleInputChange('isRecurring', checked);
                    if (!checked) {
                      handleInputChange('frequency', 'once');
                    }
                  }}
                />
                <Label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Maintenance récurrente
                </Label>
              </div>
              
              {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
                      Fréquence
                    </Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => handleInputChange('frequency', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                        <SelectItem value="quarterly">Trimestrielle</SelectItem>
                        <SelectItem value="yearly">Annuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interval" className="text-sm font-medium text-gray-700">
                      Intervalle
                    </Label>
                    <Input
                      id="interval"
                      type="number"
                      value={recurrencePattern.interval}
                      onChange={(e) => setRecurrencePattern(prev => ({
                        ...prev,
                        interval: parseInt(e.target.value) || 1
                      }))}
                      min="1"
                      className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Checklist */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <List className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Checklist</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Ajouter une tâche..."
                  onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <Button 
                  type="button" 
                  onClick={addChecklistItem} 
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <span className="text-sm">{item.task}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Pièces requises */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Package className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Pièces requises</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
                <Input
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom de la pièce"
                  onKeyPress={(e) => e.key === 'Enter' && addRequiredPart()}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <Input
                  type="number"
                  value={newPart.quantity}
                  onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  placeholder="Quantité"
                  min="1"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <Input
                  type="number"
                  value={newPart.estimated_cost}
                  onChange={(e) => setNewPart(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
                  placeholder="Coût estimé (FCFA)"
                  min="0"
                  step="100"
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <Button 
                  type="button" 
                  onClick={addRequiredPart} 
                  size="sm"
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.required_parts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{part.name}</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Qty: {part.quantity}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {part.estimated_cost} FCFA
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRequiredPart(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 6: Notes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <List className="h-5 w-5 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              </div>
              
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notes supplémentaires..."
                rows={3}
                className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            {/* Section 7: Résumé des coûts */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-900">Résumé des coûts</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-200">
                  <span className="text-gray-700">Coût de main-d'œuvre estimé:</span>
                  <span className="font-semibold text-emerald-700">{formData.estimated_cost} FCFA</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-emerald-200">
                  <span className="text-gray-700">Coût des pièces:</span>
                  <span className="font-semibold text-emerald-700">
                    {formData.required_parts.reduce((sum, part) => sum + (part.estimated_cost * part.quantity), 0)} FCFA
                  </span>
                </div>
                <Separator className="bg-emerald-200" />
                <div className="flex justify-between items-center p-4 bg-emerald-100 rounded-lg">
                  <span className="text-lg font-bold text-emerald-900">Coût total estimé:</span>
                  <span className="text-2xl font-bold text-emerald-900">{calculateTotalCost()} FCFA</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Actions fixes en bas */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 sm:p-6 rounded-b-xl flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50 order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 order-1 sm:order-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Créer la maintenance
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMaintenanceModal; 