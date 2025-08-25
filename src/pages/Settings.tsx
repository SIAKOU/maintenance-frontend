import React, { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Download,
  Trash2,
  HardDriveUpload,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useNavigate } from "react-router-dom";
import { getImageUrl, api } from '@/lib/api';
import { loadPapaParse, loadJsPDF, loadXLSX } from "@/lib/lazyExports";
// @ts-ignore
import ExportWorker from '@/workers/exportWorker.ts?worker&inline';

type UserRole = "admin" | "technician" | "administration";

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  avatar?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    urgent: boolean;
    maintenance: boolean;
  };
}

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings = () => {
  const { toast } = useToast();
  const { user: authUser, refetchUser } = useAuth();
  const navigate = useNavigate();

  // État initial par défaut aligné avec le modèle Sequelize
  const defaultUser: UserData = {
    id: 0,
    firstName: "",
    lastName: "",
    email: "",
    role: "technician",
    isActive: true,
    notifications: {
      email: true,
      push: true,
      urgent: true,
      maintenance: true,
    },
  };

  const [user, setUser] = useState<UserData>(defaultUser);
  const [avatarBust, setAvatarBust] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [securityForm, setSecurityForm] = useState<SecurityForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUserData = () => {
      try {
        let userData = { ...defaultUser };

        // Priorité au contexte d'authentification
        if (authUser) {
          userData = {
            ...defaultUser,
            id: authUser.id,
            firstName: authUser.firstName,
            lastName: authUser.lastName,
            email: authUser.email,
            role: authUser.role,
            phone: authUser.phone || "",
            isActive: authUser.isActive,
            lastLogin: authUser.lastLogin,
            notifications: {
              ...defaultUser.notifications,
              ...(authUser.notifications || {}),
            },
          };
        } else {
          // Fallback sur localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser) as Partial<UserData>;
            userData = {
              ...defaultUser,
              ...parsedUser,
              notifications: {
                ...defaultUser.notifications,
                ...(parsedUser.notifications || {}),
              },
            };
          }
        }

        setUser(userData);
        setProfileForm({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone || "",
        });
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données utilisateur",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authUser]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSecurityForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleNotificationToggle = (type: keyof UserData["notifications"]) => {
    setUser((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications!,
        [type]: !prev.notifications?.[type],
      },
    }));
  };

  const saveProfile = () => {
    const updatedUser: UserData = {
      ...user,
      ...profileForm,
      phone: profileForm.phone || undefined,
    };

    setUser(updatedUser);
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées avec succès.",
      variant: "default",
    });
    refetchUser();
  };

  const changePassword = () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (securityForm.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mot de passe changé",
      description: "Votre mot de passe a été mis à jour avec succès.",
      variant: "default",
    });
    setSecurityForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const exportData = () => {
    toast({
      title: `Export ${exportFormat.toUpperCase()}`,
      description: `Vos données sont en cours d'exportation au format ${exportFormat}.`,
      variant: "default",
    });

    // Simulation d'export avec timeout
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: `Vos données ont été exportées avec succès au format ${exportFormat}.`,
        variant: "default",
      });
    }, 2000);
  };

  const deleteAccount = () => {
    setIsDeleting(true);
    const interval = setInterval(() => {
      setDeleteProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            toast({
              title: "Compte supprimé",
              description: "Votre compte a été supprimé avec succès.",
              variant: "default",
            });
            localStorage.removeItem("user");
            window.location.href = "/login";
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getInitials = () => {
    return `${user.firstName?.charAt(0) || ""}${
      user.lastName?.charAt(0) || ""
    }`;
  };

  // Fonctions pour gérer l'upload/suppression d'avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      const data = await api.put<{ user: any }, any>(`users/${authUser.id}/avatar`, formData);
      setUser((prev) => ({ ...prev, avatar: (data as any).user.avatar }));
      setAvatarBust(Date.now());
      toast({ title: "Photo de profil mise à jour" });
      refetchUser();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la photo.", variant: "destructive" });
    }
  };
  const handleRemoveAvatar = async () => {
    if (!authUser) return;
    try {
      await api.delete(`users/${authUser.id}/avatar`);
      setUser((prev) => ({ ...prev, avatar: undefined }));
      setAvatarBust(Date.now());
      toast({ title: "Photo de profil supprimée" });
      refetchUser();
    } catch (err) {
      toast({ title: "Erreur", description: "Impossible de supprimer la photo.", variant: "destructive" });
    }
  };

  // --- Fonctions d'export corrigées ---
  const handleExportPDF = async () => {
    const rows = Object.entries(user).map(([k, v]) => [k, String(v ?? "")]);
    const worker = new ExportWorker();
    worker.postMessage({ type: 'pdf', payload: { title: 'Profil Utilisateur', headers: [["Champ","Valeur"]], rows } });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data?.ok && e.data.blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(e.data.blob);
        link.download = 'profil.pdf';
        link.click();
      }
      worker.terminate();
    };
    toast({ title: "Export PDF terminé" });
  };
  const handleExportExcel = async () => {
    const worker = new ExportWorker();
    worker.postMessage({ type: 'xlsx', payload: { sheetName: 'Profil', rows: [user] } });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data?.ok && e.data.blob) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(e.data.blob);
        link.download = 'profil.xlsx';
        link.click();
      }
      worker.terminate();
    };
    toast({ title: "Export Excel terminé" });
  };
  const handleExportCSV = async () => {
    const Papa = await loadPapaParse();
    const csv = Papa.unparse([user]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "profil.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export CSV terminé" });
  };
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "profil.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export JSON terminé" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-500">Chargement du profil utilisateur...</span>
      </div>
    );
  }
  if (!authUser) {
    navigate("/", { replace: true });
    return null;
  }

  const BACKEND_URL = 'http://localhost:5000';

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Paramètres
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configurez votre profil et les préférences de l'application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Profil Utilisateur
                  </CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    key={user.avatar || 'no-avatar'}
                    src={user.avatar ? `${getImageUrl(user.avatar)}?t=${avatarBust}` : undefined}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                  <AvatarFallback className="text-xl font-medium bg-gray-100 dark:bg-gray-800">
                    {getInitials() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
                    Changer la photo
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={handleRemoveAvatar}>
                    Supprimer
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="avatar"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName || ""}
                    onChange={handleProfileChange}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName || ""}
                    onChange={handleProfileChange}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email || ""}
                  onChange={handleProfileChange}
                  placeholder="votre@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone || ""}
                  onChange={handleProfileChange}
                  placeholder="+228 XX XX XX XX"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  onClick={saveProfile}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Sauvegarder les modifications
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Sécurité
                  </CardTitle>
                  <CardDescription>
                    Gérez votre mot de passe et la sécurité de votre compte
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={securityForm.currentPassword}
                  onChange={handleSecurityChange}
                  placeholder="Votre mot de passe actuel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={securityForm.newPassword}
                  onChange={handleSecurityChange}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={handleSecurityChange}
                  placeholder="Confirmez le nouveau mot de passe"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button
                  onClick={changePassword}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  Modifier le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                  <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Configurez vos préférences de notification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries({
                email: "Notifications email",
                push: "Notifications push",
                urgent: "Notifications urgentes",
                maintenance: "Rappels maintenance",
              }).map(([key, label], index) => (
                <React.Fragment key={key}>
                  {index > 0 && <Separator />}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor={`${key}Notifications`}>{label}</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {key === "email" && "Recevoir les notifications par email"}
                        {key === "push" && "Recevoir les notifications dans le navigateur"}
                        {key === "urgent" && "Notifications pour les interventions critiques"}
                        {key === "maintenance" && "Rappels de maintenance préventive"}
                      </p>
                    </div>
                    <Switch
                      id={`${key}Notifications`}
                      checked={user.notifications?.[key as keyof UserData["notifications"]] ?? false}
                      onCheckedChange={() => handleNotificationToggle(key as keyof UserData["notifications"])}
                    />
                  </div>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>

          {/* --- Section Données responsive --- */}
          <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm max-w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Données</CardTitle>
                  <CardDescription>Gestion des données personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
                <Button type="button" variant="outline" onClick={handleExportPDF}>Export PDF</Button>
                <Button type="button" variant="outline" onClick={handleExportExcel}>Export Excel</Button>
                <Button type="button" variant="outline" onClick={handleExportCSV}>Export CSV</Button>
                <Button type="button" variant="outline" onClick={handleExportJSON}>Export JSON</Button>
              </div>

              <Button
                onClick={exportData}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter mes données
              </Button>

              <Button
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <HardDriveUpload className="h-4 w-4" />
                Télécharger l'historique complet
              </Button>

              <Separator />

              <div className="space-y-3">
                <Button
                  onClick={deleteAccount}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting
                    ? "Suppression en cours..."
                    : "Supprimer mon compte"}
                </Button>
                {isDeleting && (
                  <Progress value={deleteProgress} className="h-2" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    Système
                  </CardTitle>
                  <CardDescription>
                    Informations sur l'application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Version", value: "1.2.0" },
                { label: "Dernière mise à jour", value: "15 Juin 2024" },
                { label: "Rôle", value: user.role, transform: (v: string) => v.charAt(0).toUpperCase() + v.slice(1) },
                { label: "ID Utilisateur", value: `#${user.id}` },
              ].map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && <Separator />}
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.label}:
                    </span>
                    <span className="font-medium">
                      {item.transform ? item.transform(item.value) : item.value}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default function SettingsProtected() {
  return (
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  );
}