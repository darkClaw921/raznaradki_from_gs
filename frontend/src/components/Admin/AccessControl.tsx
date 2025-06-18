import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Autocomplete
} from '@mui/material';
import {
  Add,
  Delete,
  ExpandMore,
  ContentCopy
} from '@mui/icons-material';

interface Sheet {
  id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface AccessRule {
  id: number;
  sheetId: number;
  userId?: number;
  groupId?: number;
  cellRange?: string;
  permissions: string[];
  createdAt: string;
  user?: User;
  group?: {
    id: number;
    name: string;
  };
}

const AccessControl: React.FC = () => {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accessRules, setAccessRules] = useState<AccessRule[]>([]);
  const [createRuleDialogOpen, setCreateRuleDialogOpen] = useState(false);
  const [copyAccessDialogOpen, setCopyAccessDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Форма создания правила доступа
  const [accessForm, setAccessForm] = useState({
    sheetId: '',
    userId: '',
    cellRange: '',
    permissions: [] as string[]
  });

  // Форма копирования доступа
  const [copyForm, setCopyForm] = useState({
    fromSheetId: '',
    toSheetIds: [] as number[]
  });

  const availablePermissions = [
    { value: 'read', label: 'Чтение' },
    { value: 'write', label: 'Запись' },
    { value: 'comment', label: 'Комментарии' },
    { value: 'share', label: 'Совместное использование' },
    { value: 'admin', label: 'Администрирование' }
  ];

  const loadSheets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/sheets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSheets(data.sheets);
      }
    } catch (error) {
      console.error('Ошибка загрузки таблиц:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const loadAccessRules = async () => {
    try {
      const token = localStorage.getItem('token');
      // Симуляция данных для демонстрации
      setAccessRules([]);
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  useEffect(() => {
    loadSheets();
    loadUsers();
    loadAccessRules();
  }, []);

  const handleCreateAccessRule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sheets/${accessForm.sheetId}/access/cell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: accessForm.userId,
          cellRange: accessForm.cellRange || undefined,
          permissions: accessForm.permissions
        })
      });

      if (response.ok) {
        setSuccess('Правило доступа создано успешно');
        setCreateRuleDialogOpen(false);
        setAccessForm({
          sheetId: '',
          userId: '',
          cellRange: '',
          permissions: []
        });
        loadAccessRules();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания правила доступа');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleCopyAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/sheets/${copyForm.fromSheetId}/access/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetSheetIds: copyForm.toSheetIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Права доступа скопированы на ${data.updatedSheets} таблиц`);
        setCopyAccessDialogOpen(false);
        setCopyForm({
          fromSheetId: '',
          toSheetIds: []
        });
        loadAccessRules();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка копирования прав доступа');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Управление правами доступа
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ContentCopy />}
            onClick={() => setCopyAccessDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Копировать права
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateRuleDialogOpen(true)}
          >
            Добавить правило
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box mb={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Статистика
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Всего таблиц: {sheets.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Всего правил доступа: {accessRules.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Пользователей: {users.length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Детальные права доступа
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Здесь вы можете настроить детальные права доступа для пользователей и групп на уровне:
        </Typography>
        <ul>
          <li>Отдельных ячеек (например, A1, B5)</li>
          <li>Диапазонов ячеек (например, A1:C10)</li>
          <li>Строк и столбцов (например, A:A, 1:1)</li>
          <li>Целых таблиц</li>
        </ul>
        
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Доступные права:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {availablePermissions.map(permission => (
              <Chip
                key={permission.value}
                label={permission.label}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Диалог создания правила доступа */}
      <Dialog open={createRuleDialogOpen} onClose={() => setCreateRuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать правило доступа</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Таблица</InputLabel>
              <Select
                value={accessForm.sheetId}
                onChange={(e) => setAccessForm({...accessForm, sheetId: e.target.value})}
                label="Таблица"
              >
                {sheets.map((sheet) => (
                  <MenuItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Пользователь</InputLabel>
              <Select
                value={accessForm.userId}
                onChange={(e) => setAccessForm({...accessForm, userId: e.target.value})}
                label="Пользователь"
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Область (например, A1:C10, оставьте пустым для всей таблицы)"
              value={accessForm.cellRange}
              onChange={(e) => setAccessForm({...accessForm, cellRange: e.target.value})}
              fullWidth
              placeholder="A1:C10"
            />

            <FormControl fullWidth>
              <InputLabel>Права доступа</InputLabel>
              <Select
                multiple
                value={accessForm.permissions}
                onChange={(e) => setAccessForm({...accessForm, permissions: e.target.value as string[]})}
                label="Права доступа"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={availablePermissions.find(p => p.value === value)?.label || value}
                        size="small" 
                      />
                    ))}
                  </Box>
                )}
              >
                {availablePermissions.map((permission) => (
                  <MenuItem key={permission.value} value={permission.value}>
                    {permission.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRuleDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleCreateAccessRule} 
            variant="contained"
            disabled={!accessForm.sheetId || !accessForm.permissions.length}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог копирования прав доступа */}
      <Dialog open={copyAccessDialogOpen} onClose={() => setCopyAccessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Копировать права доступа</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Источник (таблица)</InputLabel>
              <Select
                value={copyForm.fromSheetId}
                onChange={(e) => setCopyForm({...copyForm, fromSheetId: e.target.value})}
                label="Источник (таблица)"
              >
                {sheets.map((sheet) => (
                  <MenuItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              options={sheets.filter(sheet => sheet.id.toString() !== copyForm.fromSheetId)}
              getOptionLabel={(option) => option.name}
              value={sheets.filter(sheet => copyForm.toSheetIds.includes(sheet.id))}
              onChange={(event, newValue) => 
                setCopyForm({...copyForm, toSheetIds: newValue.map(sheet => sheet.id)})
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Целевые таблицы"
                  placeholder="Выберите таблицы для копирования прав"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyAccessDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleCopyAccess} 
            variant="contained"
            disabled={!copyForm.fromSheetId || copyForm.toSheetIds.length === 0}
          >
            Копировать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccessControl; 