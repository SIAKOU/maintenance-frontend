import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
  FileText,
  AlertCircle as AlertErrorIcon,
  PlusCircle,
  ListTodo,
  TrendingUp,
  DollarSign,
  Activity,
  Zap,
  Shield,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { api, Report, Machine } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// --- TYPES ---
type DashboardData = {
  stats: {
    interventionsToday: number;
    operationalMachinesPercentage: number;
    avgResolutionTime: string;
    urgentInterventions: number;
    totalMaintenances: number;
    maintenancesInProgress: number;
    maintenancesCompleted: number;
    maintenancesOverdue: number;
    totalCost: number;
    efficiencyScore: number;
  };
  recentInterventions: Report[];
  upcomingMaintenance: Machine[];
  maintenanceSchedules: any[];
  urgentTasks: any[];
};

// --- FONCTION D'APPEL API (ROBUSTE) ---
const getDashboardData = async (): Promise<DashboardData> => {
  let recentInterventions: Report[] = [];
  let upcomingMaintenance: Machine[] = [];
  let allMachines: Machine[] = [];
  let maintenanceSchedules: any[] = [];
  let urgentTasks: any[] = [];

  try {
    const [
      interventionsResponse, 
      upcomingMaintResponse, 
      allMachinesResponse,
      maintenanceSchedulesResponse
    ] = await Promise.all([
      api.get<any>("reports?limit=5&sortBy=createdAt:desc").catch(() => null),
      api.get<any>("machines?limit=5&sortBy=nextMaintenanceDate:asc&status=operational").catch(() => null),
      api.get<any>("machines").catch(() => null),
      api.get<any>("maintenance-schedules?limit=10&sortBy=scheduled_date:asc").catch(() => null),
    ]);

    if (interventionsResponse)
      recentInterventions = Array.isArray(interventionsResponse)
        ? interventionsResponse
        : interventionsResponse?.reports || [];
    if (upcomingMaintResponse)
      upcomingMaintenance = Array.isArray(upcomingMaintResponse)
        ? upcomingMaintResponse
        : upcomingMaintResponse?.machines || [];
    if (allMachinesResponse)
      allMachines = Array.isArray(allMachinesResponse)
        ? allMachinesResponse
        : allMachinesResponse?.machines || [];
    if (maintenanceSchedulesResponse)
      maintenanceSchedules = Array.isArray(maintenanceSchedulesResponse)
        ? maintenanceSchedulesResponse
        : maintenanceSchedulesResponse?.data || [];

    // Calculer les tâches urgentes
    // Correction : le statut 'pending' n'existe pas pour les interventions, on filtre uniquement par priorité critique
    urgentTasks = [
      ...recentInterventions.filter(r => r.priority === 'critical'),
      ...maintenanceSchedules.filter(m => m.status === 'overdue' || m.priority === 'critical')
    ].slice(0, 5);

  } catch (error) {
    console.error("Erreur lors de la récupération des données du dashboard:", error);
  }

  const totalMachines = allMachines.length;
  const operationalMachines = allMachines.filter((m) => m.status === "operational").length;
  const operationalMachinesPercentage = totalMachines > 0 ? Math.round((operationalMachines / totalMachines) * 100) : 100;

  const totalMaintenances = maintenanceSchedules.length;
  const maintenancesInProgress = maintenanceSchedules.filter(m => m.status === 'in_progress').length;
  const maintenancesCompleted = maintenanceSchedules.filter(m => m.status === 'completed').length;
  const maintenancesOverdue = maintenanceSchedules.filter(m => m.status === 'overdue').length;

  const totalCost = maintenanceSchedules.reduce((sum, m) => sum + (m.actual_cost || 0), 0);
  const efficiencyScore = totalMaintenances > 0 ? Math.round((maintenancesCompleted / totalMaintenances) * 100) : 100;

  const stats = {
    interventionsToday: recentInterventions.length,
    operationalMachinesPercentage,
    avgResolutionTime: "N/A",
    urgentInterventions: recentInterventions.filter((r) => r.priority === "critical").length,
    totalMaintenances,
    maintenancesInProgress,
    maintenancesCompleted,
    maintenancesOverdue,
    totalCost,
    efficiencyScore
  };

  return { stats, recentInterventions, upcomingMaintenance, maintenanceSchedules, urgentTasks };
};

// --- COMPOSANT PRINCIPAL ---
const Dashboard = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const {
    data,
    isLoading: isDashboardLoading,
    error,
  } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: getDashboardData,
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // --- AMÉLIORATION : Fonction pour la salutation dynamique ---
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Bonjour";
    if (currentHour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  const isLoading = isAuthLoading || isDashboardLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <HeaderSkeleton />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertErrorIcon className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>
          Impossible de charger les données. {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  const safeData = data || {
    stats: {
      interventionsToday: 0,
      operationalMachinesPercentage: 100,
      avgResolutionTime: "N/A",
      urgentInterventions: 0,
      totalMaintenances: 0,
      maintenancesInProgress: 0,
      maintenancesCompleted: 0,
      maintenancesOverdue: 0,
      totalCost: 0,
      efficiencyScore: 100
    },
    recentInterventions: [],
    upcomingMaintenance: [],
    maintenanceSchedules: [],
    urgentTasks: []
  };

  return (
    <div className="space-y-8">
      {/* En-tête amélioré */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user?.firstName || "Utilisateur"} 👋
          </h1>
          <p className="text-lg text-gray-600">
            Voici un aperçu complet de votre activité maintenance.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <Badge variant="outline" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              {safeData.stats.efficiencyScore}% d'efficacité
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Shield className="w-3 h-3 mr-1" />
              {safeData.stats.operationalMachinesPercentage}% machines opérationnelles
            </Badge>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate("/maintenance")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Planifier Maintenance
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => navigate("/reports")}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Nouv. Intervention
          </Button>
        </div>
      </header>

      {/* Statistiques principales */}
      <StatsSection stats={safeData.stats} />
      
      {/* Tâches urgentes */}
      <UrgentTasksSection urgentTasks={safeData.urgentTasks} />
      
      {/* Contenu principal */}
      <MainContentSection
        recentInterventions={safeData.recentInterventions}
        upcomingMaintenance={safeData.upcomingMaintenance}
        maintenanceSchedules={safeData.maintenanceSchedules}
      />
      
      {/* Actions rapides */}
      <QuickActionsSection />
    </div>
  );
};

// --- SOUS-COMPOSANTS AMÉLIORÉS ---

const StatsSection = ({ stats }: { stats: DashboardData["stats"] }) => (
  <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
    <StatCard
      title="Interventions Aujourd'hui"
      value={stats.interventionsToday}
      icon={<Wrench className="h-6 w-6 text-blue-600" />}
      trend="+12%"
      trendUp={true}
    />
    <StatCard
      title="Maintenances Planifiées"
      value={stats.totalMaintenances}
      icon={<Calendar className="h-6 w-6 text-purple-600" />}
      trend={`${stats.maintenancesInProgress} en cours`}
    />
    <StatCard
      title="Machines Opérationnelles"
      value={`${stats.operationalMachinesPercentage}%`}
      icon={<Building2 className="h-6 w-6 text-green-600" />}
      progress={stats.operationalMachinesPercentage}
    />
    <StatCard
      title="Tâches Urgentes"
      value={stats.urgentInterventions + stats.maintenancesOverdue}
      icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
      urgent={true}
    />
  </section>
);

const UrgentTasksSection = ({ urgentTasks }: { urgentTasks: any[] }) => {
  const navigate = useNavigate();
  
  if (urgentTasks.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Tâches Urgentes
        </CardTitle>
        <CardDescription className="text-red-600">
          Actions requises immédiatement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {urgentTasks.slice(0, 3).map((task, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {task.title || task.name || 'Tâche urgente'}
                </p>
                <p className="text-sm text-gray-500">
                  {task.machine?.name || task.description || 'Action requise'}
                </p>
              </div>
              <Badge variant="destructive" className="ml-2">
                {task.priority === 'critical' ? 'Critique' : 'Urgent'}
              </Badge>
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          className="w-full mt-4 border-red-300 text-red-700 hover:bg-red-100"
          onClick={() => navigate("/reports")}
        >
          Voir toutes les tâches urgentes
        </Button>
      </CardContent>
    </Card>
  );
};

const MainContentSection = ({
  recentInterventions,
  upcomingMaintenance,
  maintenanceSchedules,
}: {
  recentInterventions: Report[];
  upcomingMaintenance: Machine[];
  maintenanceSchedules: any[];
}) => (
  <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
    <RecentInterventionsCard interventions={recentInterventions} />
    <UpcomingMaintenanceCard maintenances={upcomingMaintenance} />
    <MaintenanceSchedulesCard schedules={maintenanceSchedules} />
  </section>
);

const QuickActionsSection = () => {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Actions Rapides
        </CardTitle>
        <CardDescription>
          Accès direct aux fonctionnalités principales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickActionButton
            onClick={() => navigate("/reports")}
            icon={<Wrench className="h-7 w-7 text-blue-600" />}
            label="Nouv. Intervention"
          />
          <QuickActionButton
            onClick={() => navigate("/maintenance")}
            icon={<Calendar className="h-7 w-7 text-purple-600" />}
            label="Planifier Maintenance"
          />
          <QuickActionButton
            onClick={() => navigate("/machines")}
            icon={<Building2 className="h-7 w-7 text-green-600" />}
            label="Gérer les Machines"
          />
          <QuickActionButton
            onClick={() => navigate("/users")}
            icon={<Users className="h-7 w-7 text-orange-600" />}
            label="Gérer l'Équipe"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendUp,
  progress,
  urgent,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  progress?: number;
  urgent?: boolean;
}) => (
  <Card className={urgent ? "border-red-200 bg-red-50" : ""}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${urgent ? "text-red-800" : "text-gray-900"}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-1 ${trendUp ? "text-green-600" : "text-gray-500"}`}>
              {trend}
            </p>
          )}
          {progress !== undefined && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${urgent ? "bg-red-100" : "bg-slate-100"}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const RecentInterventionsCard = ({
  interventions,
}: {
  interventions: Report[];
}) => {
  const navigate = useNavigate();
  const getStatusLabel = (s: string) =>
    ({ pending: "En attente", in_progress: "En cours", completed: "Terminé" }[s] || s);
  const getStatusColor = (s: string) =>
    ({
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    }[s] || "bg-gray-100");
  const getPriorityColor = (p: string) =>
    ({
      low: "text-green-800",
      medium: "text-yellow-800",
      high: "text-orange-800",
      critical: "text-red-800",
    }[p] || "text-gray-800");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-blue-600" />
          Interventions récentes
        </CardTitle>
        <CardDescription>Dernières activités de maintenance.</CardDescription>
      </CardHeader>
      <CardContent>
        {interventions.length > 0 ? (
          <div className="space-y-3">
            {interventions.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/reports/${i.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {i.title}
                  </p>
                  <div className="flex items-center gap-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      {i.machine?.name || "N/A"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3 w-3" />
                      {i.technician?.firstName || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <Badge
                    variant="secondary"
                    className={`capitalize ${getPriorityColor(i.priority)} bg-opacity-20`}
                  >
                    {i.priority}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(i.status)}
                  >
                    {getStatusLabel(i.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <ListTodo className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucune intervention récente
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Créez une nouvelle intervention pour commencer.
            </p>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate("/reports")}
        >
          Voir toutes les interventions
        </Button>
      </CardContent>
    </Card>
  );
};

const UpcomingMaintenanceCard = ({
  maintenances,
}: {
  maintenances: Machine[];
}) => {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          Maintenance à venir
        </CardTitle>
        <CardDescription>Prochaines interventions planifiées.</CardDescription>
      </CardHeader>
      <CardContent>
        {maintenances.length > 0 ? (
          <div className="space-y-3">
            {maintenances.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/machines/${m.id}`)}
              >
                <div>
                  <p className="font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Réf: {m.reference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {m.nextMaintenanceDate
                      ? new Date(m.nextMaintenanceDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    Programmé
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucune maintenance programmée
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Planifiez une maintenance pour commencer.
            </p>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate("/machines")}
        >
          Voir toutes les machines
        </Button>
      </CardContent>
    </Card>
  );
};

const MaintenanceSchedulesCard = ({ schedules }: { schedules: any[] }) => {
  const navigate = useNavigate();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifiée';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Maintenances planifiées
        </CardTitle>
        <CardDescription>Prochaines maintenances programmées.</CardDescription>
      </CardHeader>
      <CardContent>
        {schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.slice(0, 5).map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/maintenance`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {schedule.title}
                  </p>
                  <div className="flex items-center gap-x-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3" />
                      {schedule.machine?.name || "N/A"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {new Date(schedule.scheduled_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <Badge
                    variant="secondary"
                    className={getStatusColor(schedule.status)}
                  >
                    {getStatusLabel(schedule.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucune maintenance planifiée
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Planifiez une nouvelle maintenance pour commencer.
            </p>
          </div>
        )}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate("/maintenance")}
        >
          Voir toutes les maintenances
        </Button>
      </CardContent>
    </Card>
  );
};

const QuickActionButton = ({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
  >
    <div className="p-3 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
      {icon}
    </div>
    <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
  </button>
);

const HeaderSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-96" />
    <Skeleton className="h-6 w-64" />
    <div className="flex gap-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-32" />
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-96" />
      ))}
    </div>
  </div>
);

export default Dashboard;
