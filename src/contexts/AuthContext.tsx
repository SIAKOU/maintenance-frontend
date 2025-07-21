// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useQuery,
  useQueryClient,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { api, User, ApiError } from "@/lib/api";
import { Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (token: string) => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ME_ENDPOINT = "auth/me";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Gestion de la session utilisateur
  const {
    data: user,
    isLoading: isUserLoading,
    isError,
    error,
    refetch,
  } = useQuery<User>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await api.get<{ success: boolean; user: User }>(ME_ENDPOINT);
        return response.user;
      } catch (err) {
        if (ApiError.isApiError(err) && err.status === 401) {
          handleInvalidToken();
        }
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (ApiError.isApiError(error) && error.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 15 * 60 * 1000,
    enabled: !!authToken,
  });

  // Mutation pour le logout
  const logoutMutation: UseMutationResult<void, Error, void> = useMutation({
    mutationFn: async () => {
      await api.post("auth/logout", {});
    },
    onSuccess: () => {
      resetAuthState();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
      });
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      resetAuthState();
      navigate("/login");
    },
  });

  const handleInvalidToken = useCallback(() => {
    resetAuthState();
    navigate("/login", { state: { sessionExpired: true } });
  }, [navigate]);

  const resetAuthState = useCallback(() => {
    setAuthToken(null);
    queryClient.removeQueries({ queryKey: ["auth", "user"] });
    // Supprimer le token du localStorage
    localStorage.removeItem("token");
    // Supprimer le cookie
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  }, [queryClient]);

  const login = useCallback((token: string) => {
    setAuthToken(token);
    // Stocker le token dans localStorage pour l'API
    localStorage.setItem("token", token);
    // Et aussi dans un cookie pour la persistance
    document.cookie = `token=${token}; Path=/; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure;" : ""
    } Max-Age=${24 * 60 * 60}`;
  }, []);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  useEffect(() => {
    // Vérifier d'abord localStorage, puis cookie
    const token = localStorage.getItem("token") || 
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

    if (token) {
      setAuthToken(token);
    } else {
      queryClient.setQueryData(["auth", "user"], null);
    }
  }, [queryClient]);

  const contextValue: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user && !isError,
    isLoading: isUserLoading || logoutMutation.isPending,
    logout,
    login,
    refetchUser: refetch,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {isUserLoading ? <AuthLoader /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-blue-600 p-3 rounded-lg animate-pulse">
        <Wrench className="h-8 w-8 text-white" />
      </div>
      <p className="text-gray-600">Validation de la session...</p>
    </div>
  </div>
);
