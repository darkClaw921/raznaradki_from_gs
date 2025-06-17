import axios from 'axios';

// В продакшене используем относительный URL, в разработке - localhost
const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Создаем instance axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post('/auth/register', userData),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  inviteUser: (userData: {
    email: string;
    firstName: string;
    lastName: string;
    roleId?: number;
  }) => api.post('/auth/invite', userData),
  
  activateUser: (data: {
    email: string;
    tempPassword: string;
    newPassword: string;
  }) => api.post('/auth/activate', data),
};

// Sheets API
export const sheetsApi = {
  getSheets: () => api.get('/sheets'),
  
  getSheet: (id: string) => api.get(`/sheets/${id}`),
  
  createSheet: (sheetData: {
    name: string;
    description?: string;
    rowCount?: number;
    columnCount?: number;
    isPublic?: boolean;
  }) => api.post('/sheets', sheetData),
  
  updateSheet: (id: string, sheetData: any) => api.put(`/sheets/${id}`, sheetData),
  
  deleteSheet: (id: string) => api.delete(`/sheets/${id}`),
  
  addUserToSheet: (sheetId: string, userData: {
    userId: number;
    permission: 'read' | 'write' | 'admin';
    rowRestrictions?: number[];
    columnRestrictions?: number[];
  }) => api.post(`/sheets/${sheetId}/users`, userData),
};

// Cells API
export const cellsApi = {
  getCell: (sheetId: string, row: number, column: number) =>
    api.get(`/cells/${sheetId}/${row}/${column}`),
  
  updateCell: (sheetId: string, row: number, column: number, cellData: {
    value?: string;
    formula?: string;
    format?: any;
  }) => api.put(`/cells/${sheetId}/${row}/${column}`, cellData),
};

// Users API
export const usersApi = {
  getUsers: () => api.get('/users'),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  updateUser: (id: string, userData: any) => api.put(`/users/${id}`, userData),
  
  deactivateUser: (id: string) => api.patch(`/users/${id}/deactivate`),
};

// Roles API
export const rolesApi = {
  getRoles: () => api.get('/roles'),
  
  createRole: (roleData: {
    name: string;
    description?: string;
    permissionIds: number[];
  }) => api.post('/roles', roleData),
  
  updateRole: (id: string, roleData: any) => api.put(`/roles/${id}`, roleData),
  
  getPermissions: () => api.get('/roles/permissions'),
};

export default api; 