const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('onemind_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('onemind_token', token);
  } else {
    localStorage.removeItem('onemind_token');
  }
}

export function getCurrentUser() {
  const data = localStorage.getItem('onemind_user');
  return data ? JSON.parse(data) : null;
}

export function setCurrentUser(user: any) {
  if (user) {
    localStorage.setItem('onemind_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('onemind_user');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: any = new Error(
      data.message || `API request failed (${response.status}: ${response.statusText || 'Server Error'})`
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  adminLogin: (email: string, password: string) =>
    apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  candidateLogin: (registrationId: string, password?: string) =>
    apiRequest('/auth/candidate/login', {
      method: 'POST',
      body: JSON.stringify({ registrationId, password }),
    }),

  getMe: () => apiRequest('/auth/me'),

  // Admin
  getAdminDashboard: () => apiRequest('/admin/dashboard'),

  getExams: () => apiRequest('/exams'),

  createExam: (payload: {
    title: string;
    description: string;
    durationMinutes: number;
    questions: Array<{
      text: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>;
  }) =>
    apiRequest('/admin/exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExamStatus: (examId: string, status: string) =>
    apiRequest(`/admin/exams/${examId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  registerCandidate: (payload: {
    name: string;
    email: string;
    registrationId: string;
    examId: string;
  }) =>
    apiRequest('/admin/candidates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getSubmissions: () => apiRequest('/admin/submissions'),

  // Candidate
  startCandidateExam: (examId?: string) =>
    apiRequest('/candidate/exam/start', {
      method: 'POST',
      body: JSON.stringify({ examId }),
    }),

  getCandidateSession: (sessionId: string) =>
    apiRequest(`/candidate/exam/${sessionId}`),

  saveResponse: (
    sessionId: string,
    questionId: string,
    answer: string,
    clientEventId?: string,
    sequenceNumber?: number
  ) =>
    apiRequest(`/candidate/exam/${sessionId}/response`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer, clientEventId, sequenceNumber }),
    }),

  submitCandidateExam: (sessionId: string) =>
    apiRequest(`/candidate/exam/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submittedAt: new Date().toISOString() }),
    }),

  // System & Simulation
  getSystemStatus: () => apiRequest('/system-status'),

  simulate: (action: string) =>
    apiRequest('/system/simulate', {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),

  syncCloud: () =>
    apiRequest('/system/sync', {
      method: 'POST',
    }),

  // Audit
  getAuditLog: (limit = 100) => apiRequest(`/audit?limit=${limit}`),

  verifyAuditLog: () => apiRequest('/audit/verify'),
};
