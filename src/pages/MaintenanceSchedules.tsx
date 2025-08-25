import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Clock, AlertTriangle, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import CreateMaintenanceModal from '@/components/maintenance/CreateMaintenanceModal';

interface MaintenanceSchedule {
  id: number;
  title: string;
  description?: string;
  machine_id: number;
  machine?: { name: string; model: string };
  technician_id?: number;
  technician?: { name: string; email: string };
  scheduled_date: string;
  estimated_duration: number;
  maintenance_type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  checklist?: Array<{ task: string; completed: boolean }>;
  required_parts?: Array<{ name: string; quantity: number; cost: number }>;
  estimated_cost: number;
  actual_cost: number;
  notes?: string;
  completed_at?: string;
  completion_notes?: string;
  next_scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

interface Machine {
  id: number;
  name: string;
  model: string;
  location: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const MaintenanceSchedules: React.FC = () => {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const { toast } = useToast();

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, machinesRes, techniciansRes] = await Promise.all([
        api.get<{ data: MaintenanceSchedule[] }>('/maintenance-schedules'),
        api.get<{ data: Machine[] }>('/machines'),
        api.get<{ data: User[] }>('/users?role=technician')
      ]);

      setSchedules(schedulesRes.data || []);
      setMachines(machinesRes.data || []);
      setTechnicians(techniciansRes.data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les maintenances
  const filteredSchedules = (schedules || []).filter(schedule => {
    const matchesStatus = filterStatus === 'all' || schedule.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || schedule.priority === filterPriority;
    const matchesSearch = schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.machine?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         schedule.technician?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  // Obtenir les maintenances pour une date spécifique
  const getSchedulesForDate = (date: Date) => {
    return (schedules || []).filter(schedule => {
      const scheduleDate = new Date(schedule.scheduled_date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  // Obtenir la couleur du badge selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir la couleur du badge selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir l'icône selon le type de maintenance
  const getMaintenanceIcon = (type: string) => {
    switch (type) {
      case 'preventive': return <CheckCircle className="w-4 h-4" />;
      case 'corrective': return <AlertTriangle className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'inspection': return <Eye className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Marquer une maintenance comme terminée
  const completeMaintenance = async (scheduleId: number) => {
    try {
      await api.put(`/maintenance-schedules/${scheduleId}/complete`, {
        completion_notes: 'Maintenance terminée'
      });
      
      toast({
        title: "Succès",
        description: "Maintenance marquée comme terminée"
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la maintenance comme terminée",
        variant: "destructive"
      });
    }
  };

  // Supprimer une maintenance
  const deleteMaintenance = async (scheduleId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) return;
    
    try {
      await api.delete(`/maintenance-schedules/${scheduleId}`);
      
      toast({
        title: "Succès",
        description: "Maintenance supprimée"
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la maintenance",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planification des Maintenances</h1>
          <p className="text-muted-foreground">
            Gérez et planifiez les maintenances préventives et correctives
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Maintenance
        </Button>
      </div>

      {/* Modal de création */}
      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Maintenances planifiées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(schedules || []).filter(s => s.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Maintenances en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(schedules || []).filter(s => s.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Maintenances terminées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(schedules || []).filter(s => s.status === 'overdue').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Maintenances en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interface principale */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une maintenance..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="scheduled">Planifiée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des maintenances */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenances planifiées</CardTitle>
              <CardDescription>
                Liste de toutes les maintenances planifiées ({filteredSchedules.length} résultat{filteredSchedules.length > 1 ? 's' : ''})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSchedules.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Machine</TableHead>
                      <TableHead>Technicien</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priorité</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Coût</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{schedule.title}</div>
                            {schedule.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {schedule.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{schedule.machine?.name}</div>
                            <div className="text-sm text-gray-500">{schedule.machine?.model}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {schedule.technician ? (
                            <div>
                              <div className="font-medium">{schedule.technician.name}</div>
                              <div className="text-sm text-gray-500">{schedule.technician.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(schedule.scheduled_date), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(schedule.scheduled_date), 'HH:mm', { locale: fr })} ({schedule.estimated_duration}min)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMaintenanceIcon(schedule.maintenance_type)}
                            <span className="capitalize">{schedule.maintenance_type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(schedule.priority)}>
                            {schedule.priority === 'low' ? 'Faible' :
                             schedule.priority === 'medium' ? 'Moyenne' :
                             schedule.priority === 'high' ? 'Élevée' : 'Critique'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status === 'scheduled' ? 'Planifiée' :
                             schedule.status === 'in_progress' ? 'En cours' :
                             schedule.status === 'completed' ? 'Terminée' :
                             schedule.status === 'cancelled' ? 'Annulée' : 'En retard'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            <div className="font-medium">{schedule.estimated_cost} FCFA</div>
                            {schedule.actual_cost > 0 && (
                              <div className="text-sm text-gray-500">
                                Réel: {schedule.actual_cost} FCFA
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setIsViewModalOpen(true);
                              }}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {schedule.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSchedule(schedule);
                                  setIsEditModalOpen(true);
                                }}
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {schedule.status === 'scheduled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => completeMaintenance(schedule.id)}
                                title="Marquer comme terminée"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMaintenance(schedule.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune maintenance trouvée
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                      ? 'Essayez de modifier vos filtres de recherche'
                      : 'Créez votre première maintenance pour commencer'
                    }
                  </p>
                  {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer une maintenance
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendrier des maintenances</CardTitle>
              <CardDescription>
                Vue calendrier des maintenances planifiées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                locale={fr}
                modifiers={{
                  hasMaintenance: (date) => getSchedulesForDate(date).length > 0,
                  overdue: (date) => getSchedulesForDate(date).some(s => s.status === 'overdue'),
                  inProgress: (date) => getSchedulesForDate(date).some(s => s.status === 'in_progress')
                }}
                modifiersStyles={{
                  hasMaintenance: { backgroundColor: '#3b82f6', color: 'white' },
                  overdue: { backgroundColor: '#ef4444', color: 'white' },
                  inProgress: { backgroundColor: '#f59e0b', color: 'white' }
                }}
              />
              
              {selectedDate && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">
                    Maintenances du {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
                  </h3>
                  <div className="space-y-2">
                    {getSchedulesForDate(selectedDate).map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{schedule.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.machine?.name} • {schedule.technician?.name || 'Non assigné'}
                          </p>
                        </div>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                    ))}
                    {getSchedulesForDate(selectedDate).length === 0 && (
                      <p className="text-muted-foreground">Aucune maintenance planifiée pour cette date</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals pour voir, éditer, créer */}
      {/* Modal de visualisation */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la maintenance</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-6">
              {/* En-tête */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-bold mb-2">{selectedSchedule.title}</h3>
                <p className="text-gray-600">{selectedSchedule.description}</p>
                <div className="flex gap-2 mt-3">
                  <Badge className={getPriorityColor(selectedSchedule.priority)}>
                    {selectedSchedule.priority === 'low' ? 'Faible' :
                     selectedSchedule.priority === 'medium' ? 'Moyenne' :
                     selectedSchedule.priority === 'high' ? 'Élevée' : 'Critique'}
                  </Badge>
                  <Badge className={getStatusColor(selectedSchedule.status)}>
                    {selectedSchedule.status === 'scheduled' ? 'Planifiée' :
                     selectedSchedule.status === 'in_progress' ? 'En cours' :
                     selectedSchedule.status === 'completed' ? 'Terminée' :
                     selectedSchedule.status === 'cancelled' ? 'Annulée' : 'En retard'}
                  </Badge>
                  <Badge variant="outline">
                    {selectedSchedule.maintenance_type}
                  </Badge>
                </div>
              </div>
              
              {/* Informations principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Machine</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-medium">{selectedSchedule.machine?.name}</div>
                      <div className="text-sm text-gray-600">{selectedSchedule.machine?.model}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Technicien</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {selectedSchedule.technician ? (
                        <>
                          <div className="font-medium">{selectedSchedule.technician.name}</div>
                          <div className="text-sm text-gray-600">{selectedSchedule.technician.email}</div>
                        </>
                      ) : (
                        <span className="text-gray-500">Non assigné</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Planification</h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                      <div><span className="font-medium">Date:</span> {format(new Date(selectedSchedule.scheduled_date), 'PPP', { locale: fr })}</div>
                      <div><span className="font-medium">Heure:</span> {format(new Date(selectedSchedule.scheduled_date), 'HH:mm', { locale: fr })}</div>
                      <div><span className="font-medium">Durée estimée:</span> {selectedSchedule.estimated_duration} minutes</div>
                      <div><span className="font-medium">Fréquence:</span> {selectedSchedule.frequency}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Coûts</h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                      <div><span className="font-medium">Coût estimé:</span> {selectedSchedule.estimated_cost} FCFA</div>
                      {selectedSchedule.actual_cost > 0 && (
                        <div><span className="font-medium">Coût réel:</span> {selectedSchedule.actual_cost} FCFA</div>
                      )}
                    </div>
                  </div>
                  
                  {selectedSchedule.completed_at && (
                    <div>
                      <h4 className="font-semibold mb-2">Terminée le</h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-medium">{format(new Date(selectedSchedule.completed_at), 'PPP', { locale: fr })}</div>
                        {selectedSchedule.completion_notes && (
                          <div className="text-sm text-gray-600 mt-1">{selectedSchedule.completion_notes}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedSchedule.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {selectedSchedule.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Checklist */}
              {selectedSchedule.checklist && selectedSchedule.checklist.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Checklist</h4>
                  <div className="space-y-2">
                    {selectedSchedule.checklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <CheckCircle className={`w-4 h-4 ${item.completed ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>
                          {item.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Pièces requises */}
              {selectedSchedule.required_parts && selectedSchedule.required_parts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Pièces requises</h4>
                  <div className="space-y-2">
                    {selectedSchedule.required_parts.map((part, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="font-medium">{part.name}</span>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Qty: {part.quantity}</span>
                          <span>{part.estimated_cost} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceSchedules; 