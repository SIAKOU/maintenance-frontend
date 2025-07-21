import React, { useState } from "react";
import {
  Plus,
  Search,
  Users as UsersIcon,
  Shield,
  Wrench,
  Building,
  Trash,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import CreateUserModal from "@/components/users/CreateUserModal";
import EditUserModal from "@/components/users/EditUserModal";
import type { EditUserFormData } from "@/components/users/EditUserModal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getImageUrl } from '@/lib/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "technician" | "administration";
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string; // Added avatar field
}

interface UsersResponse {
  users: User[];
}

const Users = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<UsersResponse>({
    queryKey: ["users", debouncedSearchTerm],
    queryFn: () => api.get(`users?search=${debouncedSearchTerm}`),
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditUserFormData }) =>
      api.put(`users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été sauvegardées avec succès.",
      });
      setIsEditModalOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const users = data?.users || [];

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId: number) =>
      api.patch(`users/${userId}/toggle-status`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Statut modifié",
        description: "Le statut de l'utilisateur a été mis à jour.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors du changement de statut",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "Le compte utilisateur a été supprimé.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
  });

  const handleToggleUserStatus = (userId: number) => {
    toggleUserStatusMutation.mutate(userId);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "technician":
        return "Technicien";
      case "administration":
        return "Administration";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "technician":
        return "bg-blue-100 text-blue-800";
      case "administration":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "technician":
        return <Wrench className="h-4 w-4" />;
      case "administration":
        return <Building className="h-4 w-4" />;
      default:
        return <UsersIcon className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName ?? ""} ${user.lastName ?? ""}`
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const roleCounts = {
    admin: users.filter((u) => u.role === "admin").length,
    technician: users.filter((u) => u.role === "technician").length,
    administration: users.filter((u) => u.role === "administration").length,
    active: users.filter((u) => u.isActive).length,
    total: users.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des utilisateurs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-500">
          Erreur lors du chargement des utilisateurs
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">
            Administration des comptes et des rôles utilisateurs
          </p>
        </div>
        <Button
          className="btn-primary flex items-center space-x-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel utilisateur</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total",
            count: roleCounts.total,
            color: "text-gray-900",
            icon: <UsersIcon className="h-8 w-8 text-gray-600" />,
          },
          {
            label: "Actifs",
            count: roleCounts.active,
            color: "text-green-600",
            icon: <UsersIcon className="h-6 w-6 text-green-600" />,
            bg: "bg-green-100",
          },
          {
            label: "Admins",
            count: roleCounts.admin,
            color: "text-red-600",
            icon: <Shield className="h-6 w-6 text-red-600" />,
            bg: "bg-red-100",
          },
          {
            label: "Techniciens",
            count: roleCounts.technician,
            color: "text-blue-600",
            icon: <Wrench className="h-6 w-6 text-blue-600" />,
            bg: "bg-blue-100",
          },
          {
            label: "Administration",
            count: roleCounts.administration,
            color: "text-green-600",
            icon: <Building className="h-6 w-6 text-green-600" />,
            bg: "bg-green-100",
          },
        ].map(({ label, count, color, icon, bg }, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{count}</p>
                </div>
                <div className={`${bg ?? ""} p-2 rounded-lg`}>{icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 overflow-x-auto">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={getImageUrl(user.avatar)} 
                      alt={`${user.firstName} ${user.lastName}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
                      {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                  {!user.isActive && (
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-600"
                    >
                      Inactif
                    </Badge>
                  )}
                  <Badge className={getRoleColor(user.role)}>
                    <div className="flex items-center space-x-1">
                      {getRoleIcon(user.role)}
                      <span>{getRoleLabel(user.role)}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Téléphone:</span>
                    <p className="font-medium">
                      {user.phone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Créé le:</span>
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                {user.lastLogin && (
                  <div className="text-sm">
                    <span className="text-gray-500">Dernière connexion:</span>
                    <p className="font-medium">
                      {new Date(user.lastLogin).toLocaleString("fr-FR")}
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleEditUser(user)}
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    variant={user.isActive ? "destructive" : "default"}
                    onClick={() => handleToggleUserStatus(user.id)}
                  >
                    {user.isActive ? "Désactiver" : "Activer"}
                  </Button>
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={() =>
          queryClient.invalidateQueries({ queryKey: ["users"] })
        }
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onUpdate={(data) => {
          if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser.id, data });
          }
        }}
        isUpdating={updateUserMutation.isPending}
      />
    </div>
  );
};

export default function UsersProtected() {
  return (
    <ProtectedRoute requiredRole="admin">
      <Users />
    </ProtectedRoute>
  );
}
