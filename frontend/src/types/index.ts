// Основные типы данных

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface Sheet {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  isPublic: boolean;
  rowCount: number;
  columnCount: number;
  templateId?: number;
  sourceSheetId?: number; // ID исходной таблицы для отчетов
  settings?: any;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  users?: User[];
  template?: SheetTemplate;
  sourceSheet?: Sheet; // Исходная таблица для отчетов
  dependentSheets?: Sheet[]; // Связанные отчеты
  cells?: Cell[];
}

export interface Cell {
  id: number;
  sheetId: number;
  row: number;
  column: number;
  value: string;
  formula?: string;
  format?: CellFormat;
  isLocked: boolean;
  mergedWith?: string;
}

export interface CellFormat {
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
  border?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface UserSheet {
  userId: number;
  sheetId: number;
  permission: 'read' | 'write' | 'admin';
  rowRestrictions?: number[];
  columnRestrictions?: number[];
}

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  message: string;
}

export interface SheetsResponse {
  sheets: Sheet[];
  total: number;
}

export interface SheetResponse {
  sheet: Sheet;
  userPermissions: string;
}

// WebSocket event types
export interface CellUpdateEvent {
  sheetId: string;
  cell: {
    row: number;
    column: number;
    value: string;
    formula?: string;
    format?: CellFormat;
  };
  updatedBy: {
    id: number;
    name: string;
  };
}

export interface UserJoinedEvent {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  sheetId: string;
}

export interface UserLeftEvent {
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
  sheetId: string;
}

export interface CellsMergedEvent {
  sheetId: string;
  range: {
    startRow: number;
    startColumn: number;
    endRow: number;
    endColumn: number;
  };
  mainCell: string;
  updatedBy: {
    id: number;
    name: string;
  };
}

export interface UserCursorEvent {
  userId: number;
  userName: string;
  position: {
    row: number;
    column: number;
  };
  sheetId: string;
}

export interface CellLockedEvent {
  sheetId: string;
  position: {
    row: number;
    column: number;
  };
  lockedBy: {
    id: number;
    name: string;
  };
}

// Utility types
export type PermissionType = 'read' | 'write' | 'admin';
export type CellAddress = `${string}${number}`; // например: A1, B2
export type CellRange = `${CellAddress}:${CellAddress}`; // например: A1:B2

// Типы для шаблонов таблиц
export interface SheetTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  structure: {
    headers: TemplateCell[];
    sampleData: TemplateCell[];
    columnWidths?: { [key: string]: number };
  };
  rowCount: number;
  columnCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCell {
  row: number;
  column: number;
  value: string;
  format?: CellFormat;
}

export interface CreateSheetFromTemplateRequest {
  name: string;
  description?: string;
} 