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
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
  Group,
  Security
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    id: number;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Форма создания пользователя
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '2', // По умолчанию роль пользователя
    isActive: true
  });

  // Форма приглашения
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    message: ''
  });

  // Форма редактирования пользователя
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    isActive: true
  });

  const dispatch = useDispatch<AppDispatch>();

  const loadUsers = async () => {
    setLoading(true);
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
      } else {
        setError('Ошибка загрузки пользователей');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
      // Установим роли по умолчанию если API недоступно
      setRoles([
        { id: 1, name: 'admin', description: 'Администратор' },
        { id: 2, name: 'user', description: 'Пользователь' }
      ]);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(createForm)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Пользователь создан. ${data.tempPassword ? `Временный пароль: ${data.tempPassword}` : ''}`);
        setCreateDialogOpen(false);
        setCreateForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          roleId: '2',
          isActive: true
        });
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания пользователя');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleInviteUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inviteForm)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Приглашение отправлено. Ссылка: ${data.inviteUrl}`);
        setInviteDialogOpen(false);
        setInviteForm({
          email: '',
          firstName: '',
          lastName: '',
          roleId: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка отправки приглашения');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          roleId: parseInt(editForm.roleId),
          isActive: editForm.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Пользователь обновлен успешно');
        setEditDialogOpen(false);
        setSelectedUser(null);
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка обновления пользователя');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.role.id.toString(),
      isActive: user.isActive
    });
    setEditDialogOpen(true);
  };

  const handleBulkUpdate = async (updates: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          updates
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setBulkEditDialogOpen(false);
        setSelectedUsers([]);
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка массового обновления');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === users.length 
        ? [] 
        : users.map(user => user.id)
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Управление пользователями
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => setInviteDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Пригласить
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Создать пользователя
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

      {selectedUsers.length > 0 && (
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="body2">
            Выбрано: {selectedUsers.length}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Group />}
            onClick={() => setBulkEditDialogOpen(true)}
          >
            Массовые операции
          </Button>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Имя</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Создан</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                  />
                </TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.role.name} 
                    color={user.role.name === 'admin' ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.isActive ? 'Активен' : 'Неактивен'} 
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => openEditDialog(user)}
                    title="Редактировать пользователя"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="secondary">
                    <Security />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог создания пользователя */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать пользователя</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Имя"
              value={createForm.firstName}
              onChange={(e) => setCreateForm({...createForm, firstName: e.target.value})}
              fullWidth
            />
            <TextField
              label="Фамилия"
              value={createForm.lastName}
              onChange={(e) => setCreateForm({...createForm, lastName: e.target.value})}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
              fullWidth
            />
            <TextField
              label="Пароль (оставьте пустым для автогенерации)"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
              fullWidth
            />
            <TextField
              select
              label="Роль"
              value={createForm.roleId}
              onChange={(e) => setCreateForm({...createForm, roleId: e.target.value})}
              fullWidth
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id.toString()}>
                  {role.description} ({role.name})
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({...createForm, isActive: e.target.checked})}
                />
              }
              label="Активный пользователь"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateUser} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог редактирования пользователя */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать пользователя</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Имя"
              value={editForm.firstName}
              onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
              fullWidth
            />
            <TextField
              label="Фамилия"
              value={editForm.lastName}
              onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={editForm.email}
              disabled
              fullWidth
              helperText="Email нельзя изменить"
            />
            <TextField
              select
              label="Роль"
              value={editForm.roleId}
              onChange={(e) => setEditForm({...editForm, roleId: e.target.value})}
              fullWidth
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id.toString()}>
                  {role.description} ({role.name})
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                />
              }
              label="Активный пользователь"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleEditUser} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог приглашения */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Пригласить пользователя</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              label="Email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Имя (опционально)"
              value={inviteForm.firstName}
              onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
              fullWidth
            />
            <TextField
              label="Фамилия (опционально)"
              value={inviteForm.lastName}
              onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
              fullWidth
            />
            <TextField
              label="Сообщение (опционально)"
              multiline
              rows={3}
              value={inviteForm.message}
              onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleInviteUser} variant="contained">Отправить приглашение</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 