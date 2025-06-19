import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  TextField,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Share,
  People,
  CalendarToday,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { setCurrentSheet, setLoading } from '../store/sheetSlice';
import { sheetsApi, templatesApi } from '../services/api';
import Spreadsheet from '../components/Spreadsheet/Spreadsheet';
import MembersDialog from '../components/Spreadsheet/MembersDialog';

const Sheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentSheet, loading } = useSelector((state: RootState) => state.sheet);
  const { user } = useSelector((state: RootState) => state.auth);

  const [userPermissions, setUserPermissions] = useState<string>('read');
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [reportDate, setReportDate] = useState<string>('');
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [linkedJournals, setLinkedJournals] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadSheet(id);
    }
  }, [id]);

  const loadSheet = async (sheetId: string) => {
    try {
      dispatch(setLoading(true));
      const response = await sheetsApi.getSheet(sheetId);
      dispatch(setCurrentSheet(response.data.sheet));
      setUserPermissions(response.data.userPermissions || 'read');
      
      // Инициализируем дату отчета если это связанная таблица
      if (response.data.sheet.reportDate) {
        setReportDate(response.data.sheet.reportDate);
      }

      // Проверяем связанные журналы для отчетов
      if (response.data.sheet.template?.name?.includes('Отчет')) {
        try {
          const reportSourcesResponse = await templatesApi.getReportSources(parseInt(sheetId));
          setLinkedJournals(reportSourcesResponse.sources || []);
        } catch (error) {
          console.error('Ошибка загрузки связанных журналов:', error);
          setLinkedJournals([]);
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки таблицы:', error);
      navigate('/dashboard');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleOpenMembers = () => {
    setMembersDialogOpen(true);
  };

  const handleShareSheet = () => {
    // Функция "Поделиться" - открываем диалог участников
    setMembersDialogOpen(true);
  };

  const handleReportDateChange = async (newDate: string) => {
    if (!isLinkedReport || !currentSheet) return;
    
    try {
      setIsUpdatingDate(true);
      
      // Обновляем дату отчета на сервере
      await templatesApi.updateReportDate(currentSheet.id, newDate);
      
      // Обновляем локальное состояние
      setReportDate(newDate);
      
      // Перезагружаем таблицу чтобы увидеть обновленные данные
      await loadSheet(id!);
      
    } catch (error) {
      console.error('Ошибка обновления даты отчета:', error);
    } finally {
      setIsUpdatingDate(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!currentSheet) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>Таблица не найдена</Typography>
      </Box>
    );
  }

  const canManageAccess = userPermissions === 'admin' || userPermissions === 'owner';

  const isLinkedReport = currentSheet?.template?.name?.includes('Отчет') && linkedJournals.length > 0;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {currentSheet.name}
          </Typography>

          {/* Компонент выбора даты отчета */}
          {isLinkedReport && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
              <TextField
                type="date"
                size="small"
                value={reportDate || ''}
                onChange={(e) => handleReportDateChange(e.target.value)}
                disabled={isUpdatingDate}
                InputLabelProps={{ shrink: true }}
                sx={{ 
                  width: 150,
                  '& .MuiInputBase-input': {
                    fontSize: '0.875rem',
                    padding: '6px 8px'
                  }
                }}
              />
              {isLinkedReport && (
                <Chip
                  label={`Связанные журналы (${linkedJournals.length})`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Кнопка участников - доступна всем для просмотра */}
            <Button
              startIcon={<People />}
              variant="outlined"
              size="small"
              onClick={handleOpenMembers}
            >
              Участники
            </Button>

            {/* Кнопка поделиться - только для администраторов */}
            {canManageAccess && (
              <Button
                startIcon={<Share />}
                variant="outlined"
                size="small"
                onClick={handleShareSheet}
              >
                Поделиться
              </Button>
            )}
            
            <Typography variant="caption" sx={{ ml: 2 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Spreadsheet
          sheet={currentSheet}
          userPermissions={userPermissions}
        />
      </Box>

      {/* Диалог управления участниками */}
      <MembersDialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        sheetId={id || ''}
        userPermissions={userPermissions}
      />
    </Box>
  );
};

export default Sheet; 