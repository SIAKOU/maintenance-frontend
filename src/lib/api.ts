// types.ts
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface Report extends BaseEntity {
  title: string;
  workDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  machineId: number;
  technicianId: number;
  workType: "maintenance" | "repair" | "inspection" | "installation" | "other";
  problemDescription: string;
  actionsTaken: string;
  partsUsed?: Part[];
  toolsUsed?: string[];
  observations?: string;
  recommendations?: string;
  status: "draft" | "submitted" | "reviewed" | "approved";
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  priority: "low" | "medium" | "high" | "critical";
  machine?: Machine;
  technician?: User;
}

export interface Part {
  id: number;
  name: string;
  reference: string;
  quantity: number;
}

export interface Machine extends BaseEntity {
  name: string;
  reference: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  location: string;
  department: string;
  description?: string;
  installationDate?: string;
  warrantyEndDate?: string;
  status: "operational" | "maintenance" | "breakdown" | "retired";
  priority: "low" | "medium" | "high" | "critical";
  maintenanceSchedule?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceHistory?: Report[];
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "technician" | "administration";
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  avatar?: string;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  email?: boolean;
  push?: boolean;
  urgent?: boolean;
  maintenance?: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

// api.ts
import { API_CONFIG, getApiUrl, getImageUrl as configGetImageUrl } from '@/config/api';

const API_TIMEOUT = API_CONFIG.timeout;

// Debug: Afficher l'URL de l'API utilisée (en développement seulement)
if (import.meta.env.DEV) {
  console.log('🔗 API URL configurée:', API_CONFIG.baseUrl);
  console.log('🔗 VITE_API_URL:', import.meta.env.VITE_API_URL);
}

export class ApiError extends Error {
  public status: number;
  public details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const headers = new Headers(options.headers || {});

    // Set Content-Type if not FormData
    if (options.body && !(options.body instanceof FormData)) {
      headers.append("Content-Type", "application/json");
    }

    // Add auth token if exists (from cookie or localStorage)
    const token = localStorage.getItem("token");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    };

    // Clean endpoint path
    const url = getApiUrl(endpoint);

    const response = await fetch(url, config);

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails: unknown;
      try {
        errorDetails = await response.json();
      } catch {
        errorDetails = { message: response.statusText };
      }

      // Gestion spéciale des erreurs d'authentification
      if (response.status === 401 || response.status === 403) {
        // Supprimer le token invalide
        localStorage.removeItem("token");
        document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }

      throw new ApiError(
        `API Error: ${response.status}`,
        response.status,
        errorDetails
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    // Handle potential token refresh
    const newToken = response.headers.get("X-New-Token");
    if (newToken) {
      localStorage.setItem("token", newToken);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new ApiError("Request timeout", 408);
    }

    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: "GET" }),

  post: <T, U = unknown>(endpoint: string, body: U, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T, U = unknown>(endpoint: string, body: U, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T, U = unknown>(endpoint: string, body: U, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: "DELETE" }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestInit) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    }),
};

export const BACKEND_URL = API_CONFIG.backendUrl;

export function getImageUrl(path?: string | null): string | undefined {
  return configGetImageUrl(path);
}

// Helper functions for common API patterns
export const apiHelpers = {
  list: async <T>(endpoint: string, params?: Record<string, any>) => {
    const query = params ? new URLSearchParams(params).toString() : "";
    const url = query ? `${endpoint}?${query}` : endpoint;
    return api.get<ListResponse<T>>(url);
  },

  getById: async <T extends BaseEntity>(endpoint: string, id: number) => {
    return api.get<T>(`${endpoint}/${id}`);
  },

  create: async <T, U = unknown>(endpoint: string, data: U) => {
    return api.post<T, U>(endpoint, data);
  },

  update: async <T, U = unknown>(endpoint: string, id: number, data: U) => {
    return api.put<T, U>(`${endpoint}/${id}`, data);
  },

  delete: async (endpoint: string, id: number) => {
    return api.delete<{ success: boolean }>(`${endpoint}/${id}`);
  },
};

// Type guards
export function isPaginationResponse<T>(data: any): data is ListResponse<T> {
  return data && Array.isArray(data.data) && data.pagination;
}
