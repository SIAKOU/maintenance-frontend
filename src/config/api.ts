// Configuration centralisée de l'API
export const API_CONFIG = {
  // URL de base de l'API
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  
  // URL du backend pour les images
  backendUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
  
  // Timeout des requêtes
  timeout: 10000,
  
  // Configuration des retry
  retry: {
    attempts: 3,
    delay: 1000,
  },
  
  // Headers par défaut
  defaultHeaders: {
    "Content-Type": "application/json",
  },
  
  // Configuration CORS
  cors: {
    credentials: "include",
  },
};

// Fonction pour obtenir l'URL complète d'un endpoint
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  return `${API_CONFIG.baseUrl}/${cleanEndpoint}`;
};

// Fonction pour obtenir l'URL d'une image
export const getImageUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/uploads/")) return `${API_CONFIG.backendUrl}${path}`;
  return `${API_CONFIG.backendUrl}/uploads/${path}`;
};

// Configuration par environnement
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiUrl: API_CONFIG.baseUrl,
  backendUrl: API_CONFIG.backendUrl,
}; 