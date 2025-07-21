import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Users,
  Building2,
  LogOut,
  Menu,
  Wrench,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getImageUrl } from '@/lib/api';

// --- TYPES ---
interface LayoutProps {
  children: React.ReactNode;
}

// --- COMPOSANT PRINCIPAL ---
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar (fixe sur desktop, coulissante sur mobile/tablette) */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Contenu principal qui aura le défilement */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header visible uniquement sur mobile/tablette */}
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {/* Le padding est maintenant ici pour englober toute la zone de défilement */}
          <div className="py-4 px-2 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- SOUS-COMPOSANTS POUR LA LISIBILITÉ ---

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, logout: contextLogout, refetchUser } = useAuth();

  const navigation = [
    { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { name: "Rapports", href: "/reports", icon: FileText },
    { name: "Machines", href: "/machines", icon: Building2 },
    { name: "Maintenances", href: "/maintenance", icon: Calendar },
    ...(user?.role === "admin"
      ? [{ name: "Utilisateurs", href: "/users", icon: Users }]
      : []),
    { name: "Paramètres", href: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    contextLogout();
    refetchUser();
    toast({ title: "Déconnexion réussie", description: "À bientôt !" });
    navigate("/");
  };

  return (
    <>
      {/* Overlay pour mobile/tablette */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 md:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Contenu de la Sidebar */}
      <aside
        aria-label="Menu latéral de navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:inset-0
        h-full overflow-y-auto focus:outline-none`}
        tabIndex={-1}
      >
        <SidebarHeader />
        <UserInfo user={user} />
        <NavigationMenu
          navigation={navigation}
          location={location}
          onNavigate={(href) => {
            navigate(href);
            setSidebarOpen(false);
          }}
        />
        <LogoutButton onLogout={handleLogout} />
      </aside>
    </>
  );
};

const SidebarHeader = () => (
  <div className="flex items-center h-16 px-6 border-b border-gray-200 flex-shrink-0">
    <Link to="/dashboard" className="flex items-center space-x-3">
      <div className="bg-blue-600 p-2 rounded-lg">
        <Wrench className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-lg font-bold text-gray-900">MaintenancePro</h1>
    </Link>
  </div>
);

const UserInfo = ({
  user,
}: {
  user: { firstName?: string; lastName?: string; role?: string; avatar?: string } | null;
}) => {
  const getRoleLabel = (role?: string) =>
    ({
      admin: "Administrateur",
      technician: "Technicien",
      administration: "Administration",
    }[role || ""] || "Rôle inconnu");
  const getRoleColor = (role?: string) =>
    ({
      admin: "bg-red-100 text-red-800",
      technician: "bg-blue-100 text-blue-800",
      administration: "bg-green-100 text-green-800",
    }[role || ""] || "bg-gray-100 text-gray-800");

  const initials =
    (user?.firstName?.[0] || "?") + (user?.lastName?.[0] || "?");

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={getImageUrl(user?.avatar)} 
            alt={`${user?.firstName} ${user?.lastName}`}
            className="object-cover"
          />
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.firstName || "Utilisateur"} {user?.lastName || "inconnu"}
          </p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
              user?.role
            )}`}
          >
            {getRoleLabel(user?.role)}
          </span>
        </div>
      </div>
    </div>
  );
};

const NavigationMenu = ({
  navigation,
  location,
  onNavigate,
}: {
  navigation: any[];
  location: unknown;
  onNavigate: (href: string) => void;
}) => (
  <nav className="mt-6 px-3 flex-1">
    <div className="space-y-1">
      {navigation.map((item) => {
        const isActive = (location as Location).pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <button
            key={item.name}
            onClick={() => onNavigate(item.href)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              isActive
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </button>
        );
      })}
    </div>
  </nav>
);

const LogoutButton = ({ onLogout }: { onLogout: () => void }) => (
  <div className="p-3 border-t border-gray-200 flex-shrink-0">
    <Button
      variant="ghost"
      className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
      onClick={onLogout}
    >
      <LogOut className="mr-3 h-5 w-5" />
      Déconnexion
    </Button>
  </div>
);

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <div className="relative z-20 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
    <button
      onClick={onMenuClick}
      className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      aria-label="Ouvrir la navigation latérale"
    >
      <span className="sr-only">Ouvrir la sidebar</span>
      <Menu className="h-6 w-6" />
    </button>
    <div className="flex-1 px-4 flex justify-center">
      <Link to="/dashboard" className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Wrench className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">MaintenancePro</span>
      </Link>
    </div>
  </div>
);

export default Layout;
