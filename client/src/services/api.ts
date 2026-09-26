export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  summary: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  skills: string[];
  languages: string[];
  frameworks: string[];
  tools: string[];
  education: Array<{ institution: string; degree: string; year: string }>;
  experience: Array<{ company: string; role: string; duration: string; highlights: string[] }>;
  projects: Array<{ title: string; description: string; techStack: string[] }>;
  certifications: string[];
}

export interface ResumeRecord {
  id: string;
  fileUrl: string;
  uploadedAt: string;
  parsed: ParsedResume;
}

const API_BASE = '/api/v1';

let currentAccessToken: string | null = localStorage.getItem('accessToken');

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => currentAccessToken;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }

  // If payload is not FormData, default to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    // Attempt automatic token refresh
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.accessToken);
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        // Retry original request
        const retryRes = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        return retryRes;
      }
    } catch {
      setAccessToken(null);
    }
  }

  return response;
};

export const deleteResume = async (id: string) => {
  return apiFetch(`/resumes/${id}`, {
    method: 'DELETE',
  });
};
