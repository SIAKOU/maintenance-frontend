import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query"; // **CORRECTION 1: Importation pour la v5**
import {
  Plus,
  Search,
  Filter,
  Building2,
  MapPin,
  Calendar,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDebounce } from "@/hooks/useDebounce";
import { api, Machine as ApiMachine } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Types locaux
type Machine = ApiMachine & {
  interventionsCount?: number;
};

type MachinesResponse = {
  machines: Machine[];
  statusCounts: {
    operational: number;
    maintenance: number;
    breakdown: number;
    total: number;
  };
};

const Machines = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- Ajout du modal de détails de machine ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const handleShowDetails = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsDetailModalOpen(true);
  };

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  // --- CORRECTION 2: Mise à jour de la syntaxe de useQuery pour la v5 ---
  const { data, isLoading, error } = useQuery<MachinesResponse>({
    queryKey: ["machines", filterStatus, debouncedSearchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      return api.get(`machines?${params.toString()}`);
    },
    // Syntaxe correcte pour React Query v5
    placeholderData: keepPreviousData,
  });

  // --- CORRECTION 3: Mise à jour de la mutation pour la v5 ---
  const createMachineMutation = useMutation({
    mutationFn: (
      newMachineData: Omit<ApiMachine, "id" | "createdAt" | "updatedAt">
    ) => api.post<Machine, any>("machines", newMachineData),
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "La machine a été créée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      setIsModalOpen(false);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Impossible de créer la machine.",
      });
    },
  });

  const handleCreateMachine = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    if (imageFile) {
      formData.append("image", imageFile);
    }
    const newMachine = Object.fromEntries(formData.entries());
    createMachineMutation.mutate(formData as any); // On envoie le FormData directement
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validation du fichier
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non autorisé",
          description: "Veuillez sélectionner une image (JPEG, PNG, WebP)",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale est de 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // --- CORRECTION 4: S'assurer que les données par défaut sont correctes ---
  const machines = data?.machines || [];
  const statusCounts = data?.statusCounts || {
    operational: 0,
    maintenance: 0,
    breakdown: 0,
    total: 0,
  };

  const getStatusLabel = (status: string) =>
    ({
      operational: "Opérationnel",
      maintenance: "En maintenance",
      breakdown: "En panne",
      retired: "Retiré",
    }[status] || status);
  const getStatusColor = (status: string) =>
    ({
      operational: "bg-green-100 text-green-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      breakdown: "bg-red-100 text-red-800",
      retired: "bg-gray-100 text-gray-800",
    }[status] || "bg-gray-100 text-gray-800");
  const getPriorityColor = (priority: string) =>
    ({
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }[priority] || "bg-gray-100 text-gray-800");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parc Machines</h1>
          <p className="text-gray-600 mt-1">
            Gestion et suivi de tous vos équipements industriels.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle machine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle machine</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour ajouter un nouvel
                équipement.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleCreateMachine}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
              encType="multipart/form-data"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Référence</Label>
                <Input id="reference" name="reference" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marque</Label>
                <Input id="brand" name="brand" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modèle</Label>
                <Input id="model" name="model" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input id="location" name="location" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Input id="department" name="department" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select name="status" defaultValue="operational" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Opérationnel</SelectItem>
                    <SelectItem value="maintenance">En maintenance</SelectItem>
                    <SelectItem value="breakdown">En panne</SelectItem>
                    <SelectItem value="retired">Retiré</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select name="priority" defaultValue="medium" required>
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
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Photo de la machine (optionnel)</Label>
                <Input
                  ref={fileInputRef}
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Aperçu :</span>
                    <img
                      src={imagePreview}
                      alt="Aperçu de la machine"
                      className="h-24 w-24 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="md:col-span-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </DialogClose>
                {/* --- CORRECTION 5: Utilisation de isPending au lieu de isLoading --- */}
                <Button
                  type="submit"
                  disabled={createMachineMutation.isPending}
                >
                  {createMachineMutation.isPending
                    ? "Création..."
                    : "Créer la machine"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total machines"
          value={
            isLoading ? <Skeleton className="h-7 w-12" /> : statusCounts.total
          }
          icon={<Building2 className="h-8 w-8 text-blue-600" />}
        />
        <StatCard
          title="Opérationnelles"
          value={
            isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              statusCounts.operational
            )
          }
          icon={<Building2 className="h-6 w-6 text-green-600" />}
          color="green"
        />
        <StatCard
          title="En maintenance"
          value={
            isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              statusCounts.maintenance
            )
          }
          icon={<Calendar className="h-6 w-6 text-yellow-600" />}
          color="yellow"
        />
        <StatCard
          title="En panne"
          value={
            isLoading ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              statusCounts.breakdown
            )
          }
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          color="red"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, réf, marque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="operational">Opérationnel</SelectItem>
                <SelectItem value="maintenance">En maintenance</SelectItem>
                <SelectItem value="breakdown">En panne</SelectItem>
                <SelectItem value="retired">Retiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Machines Grid */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <MachineCardSkeleton />
            <MachineCardSkeleton />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>
              Impossible de charger la liste des machines. { (error as Error).message }
            </AlertDescription>
          </Alert>
        ) : machines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto">
            {machines.map((machine) => (
              <Card key={machine.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={machine.image} />
                      <AvatarFallback>{machine.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{machine.name}</CardTitle>
                      <CardDescription>{machine.reference}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>Statut : {machine.status}</div>
                      <div>Localisation : {machine.location}</div>
                      <div>Département : {machine.department}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleShowDetails(machine)}>
                        Voir détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Aucune machine trouvée</h3>
              <p className="text-sm text-gray-600">
                Aucune machine ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <MachineDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        machine={selectedMachine}
      />
    </div>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: string;
}) => {
  const iconBgColor =
    color === "green"
      ? "bg-green-100"
      : color === "yellow"
      ? "bg-yellow-100"
      : color === "red"
      ? "bg-red-100"
      : "";
  const valueColor =
    color === "green"
      ? "text-green-600"
      : color === "yellow"
      ? "text-yellow-600"
      : color === "red"
      ? "text-red-600"
      : "text-gray-900";
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        </div>
        <div className={`p-2 rounded-lg ${iconBgColor || ""}`}>{icon}</div>
      </CardContent>
    </Card>
  );
};

const MachineCard = ({ machine }: { machine: Machine }) => {
  const getStatusLabel = (status: string) =>
    ({
      operational: "Opérationnel",
      maintenance: "En maintenance",
      breakdown: "En panne",
      retired: "Retiré",
    }[status] || status);
  const getStatusColor = (status: string) =>
    ({
      operational: "bg-green-100 text-green-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      breakdown: "bg-red-100 text-red-800",
      retired: "bg-gray-100 text-gray-800",
    }[status] || "bg-gray-100 text-gray-800");
  const getPriorityColor = (priority: string) =>
    ({
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    }[priority] || "bg-gray-100 text-gray-800");
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span>{machine.name}</span>
            </CardTitle>
            <CardDescription className="mt-1">
              {machine.reference} • {machine.brand} {machine.model}
            </CardDescription>
          </div>
          {machine.image && (
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage 
                src={getImageUrl(machine.image)} 
                alt={machine.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {machine.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <Badge className={getPriorityColor(machine.priority)}>
              {machine.priority}
            </Badge>
            <Badge className={getStatusColor(machine.status)}>
              {getStatusLabel(machine.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{machine.location}</span>
        </div>
        <div className="border-t pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Département:</span>
            <div className="font-medium">{machine.department}</div>
          </div>
          <div>
            <span className="text-gray-500">Interventions:</span>
            <div className="font-medium">{machine.interventionsCount || "N/A"}</div>
          </div>
          <div>
            <span className="text-gray-500">Dernière maint.:</span>
            <div className="font-medium">
              {machine.lastMaintenanceDate
                ? new Date(machine.lastMaintenanceDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Prochaine maint.:</span>
            <div className="font-medium">
              {machine.nextMaintenanceDate
                ? new Date(machine.nextMaintenanceDate).toLocaleDateString()
                : "N/A"}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" size="sm">
            Voir détails
          </Button>
          <Button size="sm">Planifier</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MachineCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-5 w-full" />
      <div className="border-t pt-3 grid grid-cols-2 gap-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </CardContent>
  </Card>
);

// --- Modal de détails de machine ---
const MachineDetailModal = ({ isOpen, onClose, machine }: { isOpen: boolean; onClose: () => void; machine: Machine | null }) => {
  if (!machine) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Détails de la machine</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-32 w-32">
            <AvatarImage 
              src={getImageUrl(machine.image)} 
              alt={machine.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-2xl">
              {machine.name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-2">
            <div><b>Nom :</b> {machine.name}</div>
            <div><b>Référence :</b> {machine.reference}</div>
            <div><b>Marque :</b> {machine.brand}</div>
            <div><b>Modèle :</b> {machine.model}</div>
            <div><b>Numéro de série :</b> {machine.serialNumber}</div>
            <div><b>Localisation :</b> {machine.location}</div>
            <div><b>Département :</b> {machine.department}</div>
            <div><b>Description :</b> {machine.description}</div>
            <div><b>Date d'installation :</b> {machine.installationDate}</div>
            <div><b>Fin de garantie :</b> {machine.warrantyEndDate}</div>
            <div><b>Statut :</b> {machine.status}</div>
            <div><b>Priorité :</b> {machine.priority}</div>
            <div><b>Dernière maintenance :</b> {machine.lastMaintenanceDate}</div>
            <div><b>Prochaine maintenance :</b> {machine.nextMaintenanceDate}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Machines;
