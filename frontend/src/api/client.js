import axios from 'axios';

const api = axios.create({
  baseURL: '/', // С учетом Proxy это будет вести на http://127.0.0.1:8000
});

// Добавляем токен в каждый запрос автоматически
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;