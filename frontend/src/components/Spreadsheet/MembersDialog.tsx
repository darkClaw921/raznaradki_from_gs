import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert
} from '@mui/material';
import { Add, PersonAdd } from '@mui/icons-material';
import { sheetsExtendedApi } from '../../services/api';

interface MembersDialogProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
  userPermissions: string;
}

interface Member {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  permission: string;
  joinedAt: string;
}

const MembersDialog: React.FC<MembersDialogProps> = ({
  open,
  onClose,
  sheetId,
  userPermissions
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState('read');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (open && sheetId) {
      loadMembers();
    }
  }, [open, sheetId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await sheetsExtendedApi.getMembers(sheetId);
      setMembers(response.data.members);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки участников' });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      await sheetsExtendedApi.inviteMember(sheetId, inviteEmail, invitePermission);
      setMessage({ type: 'success', text: 'Участник успешно приглашен' });
      setInviteEmail('');
      await loadMembers(); // Обновляем список
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Ошибка приглашения участника' 
      });
    } finally {
      setInviting(false);
    }
  };

  const getPermissionLabel = (permission: string) => {
    const labels = {
      'owner': 'Владелец',
      'admin': 'Администратор',
      'write': 'Редактирование',
      'read': 'Только чтение'
    };
    return labels[permission as keyof typeof labels] || permission;
  };

  const getPermissionColor = (permission: string) => {
    const colors = {
      'owner': 'error',
      'admin': 'warning',
      'write': 'primary',
      'read': 'default'
    };
    return colors[permission as keyof typeof colors] || 'default';
  };

  const canInvite = userPermissions === 'admin' || userPermissions === 'owner';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '70vh' }
      }}
    >
      <DialogTitle>
        Участники таблицы
      </DialogTitle>
      
      <DialogContent>
        {message && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
            sx={{ mb: 2 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Приглашение нового участника */}
        {canInvite && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PersonAdd sx={{ mr: 1 }} />
              Пригласить участника
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                label="Email адрес"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                type="email"
              />
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Права доступа</InputLabel>
                <Select
                  value={invitePermission}
                  onChange={(e) => setInvitePermission(e.target.value)}
                  label="Права доступа"
                >
                  <MenuItem value="read">Только чтение</MenuItem>
                  <MenuItem value="write">Редактирование</MenuItem>
                  <MenuItem value="admin">Администратор</MenuItem>
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                startIcon={inviting ? <CircularProgress size={16} /> : <Add />}
              >
                Пригласить
              </Button>
            </Box>
          </Box>
        )}

        {/* Список участников */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : members.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center" p={4}>
            Участников нет
          </Typography>
        ) : (
          <List>
            {members.map((member) => (
              <ListItem key={member.user.id} divider>
                <ListItemText
                  primary={`${member.user.firstName} ${member.user.lastName}`}
                  secondary={member.user.email}
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label={getPermissionLabel(member.permission)}
                    color={getPermissionColor(member.permission) as any}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MembersDialog; 