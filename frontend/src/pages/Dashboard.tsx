import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountCircle,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/authSlice';
import { setSheets, setLoading } from '../store/sheetSlice';
import { sheetsApi } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sheets, loading } = useSelector((state: RootState) => state.sheet);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [newSheetForm, setNewSheetForm] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    loadSheets();
  }, []);

  const loadSheets = async () => {
    try {
      dispatch(setLoading(true));
      const response = await sheetsApi.getSheets();
      dispatch(setSheets(response.data.sheets));
    } catch (error) {
      console.error('Ошибка загрузки таблиц:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateSheet = async () => {
    try {
      if (!newSheetForm.name) return;
      
      const response = await sheetsApi.createSheet(newSheetForm);
      await loadSheets(); // Перезагружаем список
      setCreateDialogOpen(false);
      setNewSheetForm({ name: '', description: '', isPublic: false });
      
      // Переходим к созданной таблице
      navigate(`/sheet/${response.data.sheet.id}`);
    } catch (error) {
      console.error('Ошибка создания таблицы:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            DMD Cottage Sheets
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip
              label={user?.role?.name}
              size="small"
              color="secondary"
              variant="outlined"
            />
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Мои таблицы
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Создать таблицу
          </Button>
        </Box>

        {loading ? (
          <Typography>Загрузка...</Typography>
        ) : (
          <Grid container spacing={3}>
            {sheets.map((sheet: any) => (
              <Grid item xs={12} sm={6} md={4} key={sheet.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {sheet.name}
                    </Typography>
                    {sheet.description && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {sheet.description}
                      </Typography>
                    )}
                    <Typography variant="caption" display="block">
                      Создано: {format(new Date(sheet.createdAt), 'dd.MM.yyyy', { locale: ru })}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Обновлено: {format(new Date(sheet.updatedAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </Typography>
                    {sheet.isPublic && (
                      <Chip label="Публичная" size="small" color="info" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/sheet/${sheet.id}`)}
                    >
                      Открыть
                    </Button>
                    <IconButton size="small">
                      <MoreVertIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {sheets.length === 0 && !loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              У вас пока нет таблиц
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Создайте свою первую таблицу, чтобы начать работу
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Создать таблицу
            </Button>
          </Box>
        )}
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Выйти
        </MenuItem>
      </Menu>

      {/* Create Sheet Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новую таблицу</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название таблицы"
            fullWidth
            variant="outlined"
            value={newSheetForm.name}
            onChange={(e) => setNewSheetForm({ ...newSheetForm, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание (необязательно)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newSheetForm.description}
            onChange={(e) => setNewSheetForm({ ...newSheetForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreateSheet} variant="contained" disabled={!newSheetForm.name}>
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Dashboard; 