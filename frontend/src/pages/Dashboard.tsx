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
  Tabs,
  Tab,
  CardMedia,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountCircle,
  ExitToApp as LogoutIcon,
  AdminPanelSettings,
  TableView,
  Description,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/authSlice';
import { setSheets, setLoading } from '../store/sheetSlice';
import { sheetsApi, templatesApi } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { SheetTemplate } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sheets, loading } = useSelector((state: RootState) => state.sheet);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState<SheetTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate | null>(null);
  const [newSheetForm, setNewSheetForm] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  useEffect(() => {
    loadSheets();
    loadTemplates();
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

  const loadTemplates = async () => {
    try {
      const response = await templatesApi.getTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
    }
  };

  const handleCreateSheet = async () => {
    try {
      if (!newSheetForm.name) return;
      
      let response;
      if (selectedTemplate) {
        // Создание из шаблона
        response = await templatesApi.createSheetFromTemplate(selectedTemplate.id, {
          name: newSheetForm.name,
          description: newSheetForm.description,
        });
      } else {
        // Обычное создание
        response = await sheetsApi.createSheet(newSheetForm);
      }
      
      await loadSheets(); // Перезагружаем список
      setCreateDialogOpen(false);
      setNewSheetForm({ name: '', description: '', isPublic: false });
      setSelectedTemplate(null);
      setTabValue(0);
      
      // Переходим к созданной таблице
      navigate(`/sheet/${response.data.sheet.id}`);
    } catch (error) {
      console.error('Ошибка создания таблицы:', error);
    }
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setNewSheetForm({ name: '', description: '', isPublic: false });
    setSelectedTemplate(null);
    setTabValue(0);
  };

  const handleTemplateSelect = (template: SheetTemplate) => {
    setSelectedTemplate(template);
    setNewSheetForm({
      ...newSheetForm,
      name: template.name,
      description: template.description,
    });
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

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, SheetTemplate[]>);

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
          <Box sx={{ display: 'flex', gap: 2 }}>
            {user?.role?.name === 'admin' && (
              <Button
                variant="outlined"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/admin')}
              >
                Панель администратора
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Создать таблицу
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Typography>Загрузка...</Typography>
        ) : (
          <Grid container spacing={3}>
            {sheets.map((sheet: any) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={sheet.id}>
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
                    {sheet.template && (
                      <Chip 
                        label={`Шаблон: ${sheet.template.name}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ mt: 1, ml: 1 }} 
                      />
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
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { minHeight: '600px' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableView />
            Создать новую таблицу
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Пустая таблица" />
            <Tab label="Из шаблона" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                label="Название таблицы"
                fullWidth
                variant="outlined"
                value={newSheetForm.name}
                onChange={(e) => setNewSheetForm({ ...newSheetForm, name: e.target.value })}
              />
              <TextField
                label="Описание (необязательно)"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={newSheetForm.description}
                onChange={(e) => setNewSheetForm({ ...newSheetForm, description: e.target.value })}
              />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <Box key={category}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    {category === 'hotel' ? 'Гостиничный бизнес' : category}
                  </Typography>
                  <Grid container spacing={2}>
                    {categoryTemplates.map((template) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={template.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            border: selectedTemplate?.id === template.id ? 2 : 1,
                            borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                            '&:hover': { borderColor: 'primary.main' }
                          }}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardMedia
                            sx={{ 
                              height: 80, 
                              background: 'linear-gradient(45deg, #e3f2fd 30%, #bbdefb 90%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Description sx={{ fontSize: 40, color: 'primary.main' }} />
                          </CardMedia>
                          <CardContent sx={{ pb: 1 }}>
                            <Typography variant="subtitle1" component="h3" gutterBottom>
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {template.description}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                              <Chip 
                                label={`${template.rowCount}×${template.columnCount}`} 
                                size="small" 
                                variant="outlined" 
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}

              {selectedTemplate && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Настройки таблицы
                    </Typography>
                    <TextField
                      label="Название таблицы"
                      fullWidth
                      variant="outlined"
                      value={newSheetForm.name}
                      onChange={(e) => setNewSheetForm({ ...newSheetForm, name: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      label="Описание (необязательно)"
                      fullWidth
                      multiline
                      rows={2}
                      variant="outlined"
                      value={newSheetForm.description}
                      onChange={(e) => setNewSheetForm({ ...newSheetForm, description: e.target.value })}
                    />
                  </Box>
                </>
              )}
            </Box>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Отмена
          </Button>
          <Button 
            onClick={handleCreateSheet} 
            variant="contained" 
            disabled={!newSheetForm.name}
          >
            {selectedTemplate ? `Создать из шаблона "${selectedTemplate.name}"` : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Dashboard; 