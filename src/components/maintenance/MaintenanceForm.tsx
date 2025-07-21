import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface MaintenanceFormProps {
  maintenance?: any;
  machines: any[];
  technicians: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  maintenance,
  machines,
  technicians,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: maintenance?.title || '',
    description: maintenance?.description || '',
    machine_id: maintenance?.machine_id || '',
    technician_id: maintenance?.technician_id || '',
    scheduled_date: maintenance?.scheduled_date ? new Date(maintenance.scheduled_date) : new Date(),
    estimated_duration: maintenance?.estimated_duration || 60,
    maintenance_type: maintenance?.maintenance_type || 'preventive',
    priority: maintenance?.priority || 'medium',
    frequency: maintenance?.frequency || 'once',
    checklist: maintenance?.checklist || [],
    required_parts: maintenance?.required_parts || [],
    estimated_cost: maintenance?.estimated_cost || 0,
    notes: maintenance?.notes || '',
    isRecurring: maintenance?.frequency !== 'once'
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newPart, setNewPart] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState({
    interval: 1,
    endDate: null,
    maxOccurrences: null
  });

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
    if (newPart.trim()) {
      setFormData(prev => ({
        ...prev,
        required_parts: [...prev.required_parts, { name: newPart.trim(), quantity: 1 }]
      }));
      setNewPart('');
    }
  };

  const removeRequiredPart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_parts: prev.required_parts.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      scheduled_date: formData.scheduled_date.toISOString(),
      recurrence_pattern: formData.isRecurring ? recurrencePattern : null
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Maintenance préventive mensuelle"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="machine">Machine *</Label>
              <Select
                value={formData.machine_id.toString()}
                onValueChange={(value) => handleInputChange('machine_id', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une machine" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id.toString()}>
                      {machine.name} - {machine.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description détaillée de la maintenance..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Planification */}
      <Card>
        <CardHeader>
          <CardTitle>Planification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date et heure *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date ? (
                      format(formData.scheduled_date, "PPP 'à' HH:mm", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
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
              <Label htmlFor="duration">Durée estimée (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value))}
                min="15"
                step="15"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="technician">Technicien</Label>
              <Select
                value={formData.technician_id?.toString() || ''}
                onValueChange={(value) => handleInputChange('technician_id', value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un technicien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non assigné</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem key={technician.id} value={technician.id.toString()}>
                      {technician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de maintenance</Label>
              <Select
                value={formData.maintenance_type}
                onValueChange={(value) => handleInputChange('maintenance_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Préventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="emergency">Urgence</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="estimated_cost">Coût estimé (FCFA)</Label>
              <Input
                id="estimated_cost"
                type="number"
                value={formData.estimated_cost}
                onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Récurrence */}
      <Card>
        <CardHeader>
          <CardTitle>Récurrence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
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
            <Label htmlFor="recurring">Maintenance récurrente</Label>
          </div>
          
          {formData.isRecurring && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Fréquence</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleInputChange('frequency', value)}
                >
                  <SelectTrigger>
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
                <Label htmlFor="interval">Intervalle</Label>
                <Input
                  id="interval"
                  type="number"
                  value={recurrencePattern.interval}
                  onChange={(e) => setRecurrencePattern(prev => ({
                    ...prev,
                    interval: parseInt(e.target.value) || 1
                  }))}
                  min="1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="Ajouter une tâche..."
              onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
            />
            <Button type="button" onClick={addChecklistItem} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {formData.checklist.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span>{item.task}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pièces requises */}
      <Card>
        <CardHeader>
          <CardTitle>Pièces requises</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newPart}
              onChange={(e) => setNewPart(e.target.value)}
              placeholder="Ajouter une pièce..."
              onKeyPress={(e) => e.key === 'Enter' && addRequiredPart()}
            />
            <Button type="button" onClick={addRequiredPart} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {formData.required_parts.map((part, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span>{part.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRequiredPart(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Notes supplémentaires..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : maintenance ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm; 