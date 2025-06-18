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
  Chip,
  IconButton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  PersonRemove,
  Group,
  Security
} from '@mui/icons-material';

interface UserGroup {
  id: number;
  name: string;
  description: string;
  users: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  createdAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

const GroupManagement: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [accessRulesDialogOpen, setAccessRulesDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Форма создания/редактирования группы
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Управление участниками
  const [newMembers, setNewMembers] = useState<User[]>([]);
  
  // Управление правилами доступа
  const [sheets, setSheets] = useState<any[]>([]);
  const [accessRuleForm, setAccessRuleForm] = useState({
    sheetId: '',
    permission: 'read',
    cellRange: ''
  });

  const loadGroups = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
      } else {
        setError('Ошибка загрузки групп');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
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

  useEffect(() => {
    loadGroups();
    loadUsers();
    loadSheets();
  }, []);

  const handleCreateGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupForm)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Группа создана успешно');
        setCreateDialogOpen(false);
        setGroupForm({
          name: '',
          description: '',
          permissions: []
        });
        loadGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания группы');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupForm)
      });

      if (response.ok) {
        setSuccess('Группа обновлена успешно');
        setEditDialogOpen(false);
        setSelectedGroup(null);
        loadGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка обновления группы');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Группа удалена успешно');
        loadGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления группы');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || newMembers.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: newMembers.map(user => user.id)
        })
      });

      if (response.ok) {
        setSuccess('Участники добавлены успешно');
        setNewMembers([]);
        setMembersDialogOpen(false);
        loadGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка добавления участников');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleRemoveMember = async (groupId: number, userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: [userId]
        })
      });

      if (response.ok) {
        setSuccess('Участник удален из группы');
        loadGroups();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления участника');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const openEditDialog = (group: UserGroup) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description,
      permissions: []
    });
    setEditDialogOpen(true);
  };

  const openMembersDialog = (group: UserGroup) => {
    setSelectedGroup(group);
    setMembersDialogOpen(true);
  };

  const openAccessRulesDialog = (group: UserGroup) => {
    setSelectedGroup(group);
    setAccessRulesDialogOpen(true);
  };

  const handleCreateAccessRule = async () => {
    if (!selectedGroup || !accessRuleForm.sheetId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/groups/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          sheetId: parseInt(accessRuleForm.sheetId),
          permission: accessRuleForm.permission,
          rowRestrictions: accessRuleForm.cellRange ? [accessRuleForm.cellRange] : null
        })
      });

      if (response.ok) {
        setSuccess('Правило доступа для группы создано успешно');
        setAccessRulesDialogOpen(false);
        setAccessRuleForm({
          sheetId: '',
          permission: 'read',
          cellRange: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания правила доступа');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Управление группами
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Создать группу
        </Button>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>Описание</TableCell>
              <TableCell>Участники</TableCell>
              <TableCell>Создана</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <Typography variant="subtitle2">{group.name}</Typography>
                </TableCell>
                <TableCell>{group.description}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${group.users.length} участников`} 
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {new Date(group.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => openMembersDialog(group)}
                    title="Управление участниками"
                  >
                    <Group />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="info"
                    onClick={() => openAccessRulesDialog(group)}
                    title="Права доступа"
                  >
                    <Security />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="secondary"
                    onClick={() => openEditDialog(group)}
                    title="Редактировать"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteGroup(group.id)}
                    title="Удалить"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог создания группы */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать группу</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Название группы"
              value={groupForm.name}
              onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Описание"
              multiline
              rows={3}
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateGroup} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования группы */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать группу</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Название группы"
              value={groupForm.name}
              onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Описание"
              multiline
              rows={3}
              value={groupForm.description}
              onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleUpdateGroup} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог управления участниками */}
      <Dialog open={membersDialogOpen} onClose={() => setMembersDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Управление участниками: {selectedGroup?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} pt={1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Добавить участников
              </Typography>
              <Autocomplete
                multiple
                options={users.filter(user => 
                  !selectedGroup?.users.find(member => member.id === user.id)
                )}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
                value={newMembers}
                onChange={(event, newValue) => setNewMembers(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Выберите пользователей"
                    placeholder="Начните вводить имя или email"
                  />
                )}
              />
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleAddMembers}
                disabled={newMembers.length === 0}
                sx={{ mt: 2 }}
              >
                Добавить выбранных
              </Button>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Текущие участники ({selectedGroup?.users.length || 0})
              </Typography>
              <List>
                {selectedGroup?.users.map((member) => (
                  <ListItem key={member.id} divider>
                    <ListItemText
                      primary={`${member.firstName} ${member.lastName}`}
                      secondary={member.email}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveMember(selectedGroup.id, member.id)}
                        title="Удалить из группы"
                      >
                        <PersonRemove />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMembersDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог управления правами доступа */}
      <Dialog open={accessRulesDialogOpen} onClose={() => setAccessRulesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Права доступа группы: {selectedGroup?.name}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <FormControl fullWidth>
              <InputLabel>Таблица</InputLabel>
              <Select
                value={accessRuleForm.sheetId}
                onChange={(e) => setAccessRuleForm({...accessRuleForm, sheetId: e.target.value})}
                label="Таблица"
              >
                {sheets.map(sheet => (
                  <MenuItem key={sheet.id} value={sheet.id.toString()}>
                    {sheet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Уровень доступа</InputLabel>
              <Select
                value={accessRuleForm.permission}
                onChange={(e) => setAccessRuleForm({...accessRuleForm, permission: e.target.value})}
                label="Уровень доступа"
              >
                <MenuItem value="read">Только чтение</MenuItem>
                <MenuItem value="write">Чтение и запись</MenuItem>
                <MenuItem value="admin">Администратор</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Диапазон ячеек (опционально)"
              value={accessRuleForm.cellRange}
              onChange={(e) => setAccessRuleForm({...accessRuleForm, cellRange: e.target.value})}
              placeholder="Например: A1:D10 или A:A"
              helperText="Оставьте пустым для доступа ко всей таблице"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccessRulesDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleCreateAccessRule} 
            variant="contained"
            disabled={!accessRuleForm.sheetId}
          >
            Создать правило
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupManagement; 