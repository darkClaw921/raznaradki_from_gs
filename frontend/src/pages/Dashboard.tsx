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
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AccountCircle,
  ExitToApp as LogoutIcon,
  AdminPanelSettings,
  TableView,
  Description,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { logout } from '../store/authSlice';
import { setSheets, setLoading } from '../store/sheetSlice';
import { sheetsApi, templatesApi } from '../services/api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { SheetTemplate, Sheet } from '../types';

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
  const [selectedTab, setSelectedTab] = useState(0);
  const [templates, setTemplates] = useState<Record<string, SheetTemplate[]>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<SheetTemplate | null>(null);
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetDescription, setNewSheetDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [sourceSheetIds, setSourceSheetIds] = useState<number[]>([]);
  const [availableJournals, setAvailableJournals] = useState<Sheet[]>([]);

  // Состояние для меню действий с таблицами
  const [sheetMenuAnchor, setSheetMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    loadSheets();
    loadTemplates();
  }, []);

  const loadSheets = async () => {
    try {
      dispatch(setLoading(true));
      const response = await sheetsApi.getSheets();
      console.log('Загруженные таблицы:', response.data.sheets);
      console.log('Текущий пользователь:', user?.id);
      dispatch(setSheets(response.data.sheets));
    } catch (error) {
      console.error('Ошибка загрузки таблиц:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadTemplates = async () => {
    if (Object.keys(templates).length > 0) return;
    
    setCreating(true);
    try {
      const response = await templatesApi.getTemplates();
      setTemplates(response.templates);
    } catch (error) {
      console.error('Ошибка загрузки шаблонов:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateDialog = async () => {
    setCreateDialogOpen(true);
    loadTemplates();
    
    // Убеждаемся что таблицы загружены перед фильтрацией журналов
    if (sheets.length === 0) {
      await loadSheets();
    }
    
    setTimeout(() => {
      loadAvailableJournals();
    }, 100);
  };

  const loadAvailableJournals = () => {
    const journals = sheets.filter((sheet: any) => 
      sheet.template?.name === 'Журнал заселения DMD Cottage'
    );
    setAvailableJournals(journals);
  };

  const handleTemplateSelect = (template: SheetTemplate) => {
    setSelectedTemplate(template);
    setNewSheetName(template.name);
    setNewSheetDescription(template.description);
    
    // Обновляем список журналов при выборе шаблона отчета
    if (template.name === 'Отчет заселения/выселения DMD Cottage') {
      // Сначала загружаем журналы
      const journals = sheets.filter((sheet: any) => {
        return sheet.template?.name === 'Журнал заселения DMD Cottage';
      });
      
      setAvailableJournals(journals);
      
      // Устанавливаем первый журнал по умолчанию если есть
      if (journals.length > 0) {
        setSourceSheetIds([journals[0].id]);
      }
          } else {
        setSourceSheetIds([]);
      }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newSheetName.trim()) return;

    setCreating(true);
    try {
      const response = await templatesApi.createFromTemplate({
        templateId: selectedTemplate.id,
        name: newSheetName,
        description: newSheetDescription,
        sourceSheetIds: sourceSheetIds.length > 0 ? sourceSheetIds : undefined
      });

      await loadSheets();
      setCreateDialogOpen(false);
      resetDialogState();
      navigate(`/sheet/${response.sheet.id}`);
    } catch (error: any) {
      console.error('Ошибка создания таблицы из шаблона:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setNewSheetName('');
    setNewSheetDescription('');
    setSelectedTemplate(null);
    setSelectedTab(0);
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

  const resetDialogState = () => {
    setNewSheetName('');
    setNewSheetDescription('');
    setSelectedTemplate(null);
    setSelectedTab(0);
    setSourceSheetIds([]);
  };

  // Обработчики для меню действий с таблицами
  const handleSheetMenuOpen = (event: React.MouseEvent<HTMLElement>, sheet: Sheet) => {
    console.log('📱 Меню открыто для таблицы:', sheet);
    event.stopPropagation();
    setSheetMenuAnchor(event.currentTarget);
    setSelectedSheet(sheet);
  };

  const handleSheetMenuClose = () => {
    console.log('📱 Меню закрыто');
    setSheetMenuAnchor(null);
    // НЕ обнуляем selectedSheet здесь - он нужен в диалогах!
    // setSelectedSheet(null);
  };

  const handleEditSheet = () => {
    console.log('🖊️ handleEditSheet вызвана, selectedSheet:', selectedSheet);
    if (selectedSheet) {
      setEditName(selectedSheet.name);
      setEditDescription(selectedSheet.description || '');
      setEditDialogOpen(true);
      console.log('✅ Диалог редактирования открыт');
    }
    handleSheetMenuClose();
  };

  const handleDeleteSheet = () => {
    console.log('🗑️ handleDeleteSheet вызвана, selectedSheet:', selectedSheet);
    setDeleteDialogOpen(true);
    handleSheetMenuClose();
    console.log('✅ Диалог удаления открыт');
  };

  const confirmEditSheet = async () => {
    console.log('💾 confirmEditSheet ЗАПУЩЕНА');
    if (!selectedSheet || !editName.trim()) {
      console.log('❌ Проверка не пройдена:', { selectedSheet, editName });
      return;
    }

    console.log('Редактирование таблицы:', {
      id: selectedSheet.id,
      name: editName,
      description: editDescription,
      currentUser: user?.id,
      sheetCreatedBy: selectedSheet.createdBy
    });

    try {
      const response = await sheetsApi.updateSheet(selectedSheet.id.toString(), {
        name: editName,
        description: editDescription || undefined
      });
      console.log('Ответ сервера при редактировании:', response);
      await loadSheets();
      setEditDialogOpen(false);
      setEditName('');
      setEditDescription('');
      setSelectedSheet(null);
    } catch (error: any) {
      console.error('Ошибка обновления таблицы:', error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      alert(`Ошибка редактирования: ${error.response?.data?.error || error.message}`);
    }
  };

  const confirmDeleteSheet = async () => {
    console.log('🗑️ confirmDeleteSheet ЗАПУЩЕНА');
    if (!selectedSheet) {
      console.log('❌ selectedSheet отсутствует:', selectedSheet);
      return;
    }

    console.log('Удаление таблицы:', {
      id: selectedSheet.id,
      name: selectedSheet.name,
      currentUser: user?.id,
      sheetCreatedBy: selectedSheet.createdBy
    });

    try {
      const response = await sheetsApi.deleteSheet(selectedSheet.id.toString());
      console.log('Ответ сервера при удалении:', response);
      await loadSheets();
      setDeleteDialogOpen(false);
      setSelectedSheet(null);
    } catch (error: any) {
      console.error('Ошибка удаления таблицы:', error);
      console.error('Детали ошибки:', error.response?.data || error.message);
      alert(`Ошибка удаления: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCreateEmptySheet = async () => {
    if (!newSheetName.trim()) return;

    setCreating(true);
    try {
      const response = await sheetsApi.createSheet({
        name: newSheetName,
        description: newSheetDescription || undefined,
        isPublic: false
      });

      await loadSheets();
      setCreateDialogOpen(false);
      resetDialogState();
      navigate(`/sheet/${response.data.sheet.id}`);
    } catch (error: any) {
      console.error('Ошибка создания таблицы:', error);
    } finally {
      setCreating(false);
    }
  };

  const groupedTemplates = Object.values(templates).flat().reduce((acc, template) => {
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
              onClick={handleCreateDialog}
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
                    {/* Показываем кнопку действий только создателю таблицы */}
                    {(sheet.createdBy === user?.id || user?.role?.name === 'admin') && (
                      <IconButton 
                        size="small"
                        onClick={(e) => handleSheetMenuOpen(e, sheet)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    )}
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
              onClick={handleCreateDialog}
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
        onClick={handleCreateDialog}
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

      {/* Sheet Actions Menu */}
      <Menu
        anchorEl={sheetMenuAnchor}
        open={Boolean(sheetMenuAnchor)}
        onClose={handleSheetMenuClose}
      >
        {/* Редактирование доступно создателю и админам */}
        {(selectedSheet?.createdBy === user?.id || user?.role?.name === 'admin') && (
          <MenuItem onClick={handleEditSheet}>
            <EditIcon sx={{ mr: 1 }} />
            Редактировать
          </MenuItem>
        )}
        {/* Удаление доступно только создателю */}
        {selectedSheet?.createdBy === user?.id && (
          <MenuItem onClick={handleDeleteSheet} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Удалить
          </MenuItem>
        )}
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
            value={selectedTab} 
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Пустая таблица" />
            <Tab label="Из шаблона" />
          </Tabs>

          <TabPanel value={selectedTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                autoFocus
                label="Название таблицы"
                fullWidth
                variant="outlined"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
              />
              <TextField
                label="Описание (необязательно)"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={newSheetDescription}
                onChange={(e) => setNewSheetDescription(e.target.value)}
              />
            </Box>
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {creating ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
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
                          value={newSheetName}
                          onChange={(e) => setNewSheetName(e.target.value)}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          label="Описание (необязательно)"
                          fullWidth
                          multiline
                          rows={2}
                          variant="outlined"
                          value={newSheetDescription}
                          onChange={(e) => setNewSheetDescription(e.target.value)}
                        />
                        {selectedTemplate?.name === 'Отчет заселения/выселения DMD Cottage' && (
                          <Autocomplete
                            multiple
                            sx={{ mt: 2 }}
                            options={availableJournals}
                            getOptionLabel={(journal: any) => journal.name}
                            value={availableJournals.filter(journal => sourceSheetIds.includes(journal.id))}
                            onChange={(_, newValue) => {
                              setSourceSheetIds(newValue.map((journal: any) => journal.id));
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Связать с журналами заселения"
                                placeholder="Выберите журналы..."
                              />
                            )}
                                                         renderTags={(tagValue, getTagProps) =>
                               tagValue.map((option: any, index) => (
                                 <Chip
                                   label={option.name}
                                   {...getTagProps({ index })}
                                   color="primary"
                                   variant="outlined"
                                 />
                               ))
                             }
                            noOptionsText="Нет доступных журналов"
                            isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
                          />
                        )}
                      </Box>
                    </>
                  )}
                </>
              )}
            </Box>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Отмена
          </Button>
          {selectedTab === 0 ? (
            <Button 
              onClick={handleCreateEmptySheet}
              disabled={!newSheetName.trim() || creating}
              variant="contained"
            >
              {creating ? <CircularProgress size={20} /> : 'Создать'}
            </Button>
          ) : (
            <Button 
              onClick={handleCreateFromTemplate}
              disabled={!selectedTemplate || !newSheetName.trim() || creating}
              variant="contained"
            >
              {creating ? <CircularProgress size={20} /> : 'Создать из шаблона'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Sheet Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать таблицу</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              label="Название таблицы"
              fullWidth
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <TextField
              label="Описание"
              fullWidth
              multiline
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            setSelectedSheet(null);
            setEditName('');
            setEditDescription('');
          }}>Отмена</Button>
          <Button 
            onClick={() => {
              console.log('💾 Кнопка Сохранить нажата');
              confirmEditSheet();
            }} 
            variant="contained"
            disabled={!editName.trim()}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Sheet Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить таблицу</DialogTitle>
        <DialogContent>
          <Typography>
            Вы действительно хотите удалить таблицу "{selectedSheet?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Это действие нельзя отменить. Все данные таблицы будут потеряны.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setSelectedSheet(null);
          }}>Отмена</Button>
          <Button 
            onClick={() => {
              console.log('🗑️ Кнопка Удалить нажата');
              confirmDeleteSheet();
            }} 
            variant="contained" 
            color="error"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Dashboard; 