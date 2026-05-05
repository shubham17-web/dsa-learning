import axios from 'axios';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/auth/token', formData);
  },
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const problemService = {
  getTopics: () => api.get('/topics'),
  getQuestions: (params) => api.get('/questions', { params }),
  getQuestion: (slug) => api.get(`/questions/${slug}`),
  getDailyChallenge: () => api.get('/daily-challenge'),
  executeCode: (payload) => api.post('/execute', payload),
  updateProgress: (questionId, payload) => api.post(`/progress/${questionId}`, payload),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const discussionService = {
  getDiscussions: (slug) => api.get(`/questions/${slug}/discussions`),
  createDiscussion: (slug, payload) => api.post(`/questions/${slug}/discussions`, payload),
  getComments: (discussionId) => api.get(`/discussions/${discussionId}/comments`),
};

export const aiService = {
  chat: (message, history = []) => api.post('/chat', { message, history }),
};

export default api;
