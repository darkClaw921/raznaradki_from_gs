import axios from 'axios';
import { Sheet, SheetTemplate } from '../types';

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
    api.get(`/cells/sheets/${sheetId}/cells/${row}/${column}`),
  
  updateCell: (sheetId: string, row: number, column: number, cellData: { 
    value?: string; 
    formula?: string; 
    format?: any; 
  }) =>
    api.put(`/cells/sheets/${sheetId}/cells/${row}/${column}`, cellData),

  getCellHistory: (sheetId: number, row: number, column: number, limit = 50, offset = 0) =>
    api.get(`/cells/sheets/${sheetId}/cells/${row}/${column}/history?limit=${limit}&offset=${offset}`),

  formatCells: (sheetId: number, format: any, startRow: number, endRow: number, startColumn: number, endColumn: number) =>
    api.post(`/cells/sheets/${sheetId}/format`, {
      startRow,
      endRow, 
      startColumn,
      endColumn,
      format
    })
};

// Sheets API (дополнительные методы)
export const sheetsExtendedApi = {
  addColumn: (sheetId: string, position?: number) =>
    api.post(`/sheets/${sheetId}/columns`, { position }),

  addRow: (sheetId: string, position?: number) =>
    api.post(`/sheets/${sheetId}/rows`, { position }),

  getMembers: (sheetId: string) =>
    api.get(`/sheets/${sheetId}/members`),

  inviteMember: (sheetId: string, email: string, permission = 'read') =>
    api.post(`/sheets/${sheetId}/invite`, { email, permission }),

  resizeColumn: (sheetId: string, column: number, width: number) =>
    api.patch(`/sheets/${sheetId}/columns/resize`, { column, width }),

  resizeRow: (sheetId: string, row: number, height: number) =>
    api.patch(`/sheets/${sheetId}/rows/resize`, { row, height })
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

// Шаблоны таблиц
export const templatesApi = {
  // Получение списка шаблонов
  getTemplates: async (): Promise<{ templates: Record<string, SheetTemplate[]>; total: number }> => {
    const response = await api.get('/templates');
    return response.data;
  },

  // Создание таблицы из шаблона
  createFromTemplate: async (data: {
    templateId: number;
    name: string;
    description?: string;
    sourceSheetId?: number; // ID исходной таблицы для связи (устаревшее)
    sourceSheetIds?: number[]; // Массив ID журналов для связи
  }): Promise<{ message: string; sheet: Sheet }> => {
    const response = await api.post('/templates/create', data);
    return response.data;
  },

  // Синхронизация связанной таблицы
  syncLinkedSheet: async (reportSheetId: number, sourceSheetId: number, targetDate?: string): Promise<{ message: string }> => {
    const response = await api.post(`/templates/sync/${reportSheetId}/${sourceSheetId}`, { targetDate });
    return response.data;
  },

  // Обновление даты отчета
  updateReportDate: async (sheetId: number, reportDate: string): Promise<{ message: string; synchronized: boolean }> => {
    const response = await api.put(`/templates/update-report-date/${sheetId}`, { reportDate });
    return response.data;
  },

  // Управление связями журналов с отчетами
  getReportSources: async (sheetId: number): Promise<{ sources: any[] }> => {
    const response = await api.get(`/templates/report-sources/${sheetId}`);
    return response.data;
  },
  
  addReportSource: async (sheetId: number, sourceSheetId: number): Promise<{ message: string }> => {
    const response = await api.post(`/templates/report-sources/${sheetId}`, { sourceSheetId });
    return response.data;
  },
  
  removeReportSource: async (sheetId: number, sourceSheetId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/templates/report-sources/${sheetId}/${sourceSheetId}`);
    return response.data;
  }
};

export default api; 