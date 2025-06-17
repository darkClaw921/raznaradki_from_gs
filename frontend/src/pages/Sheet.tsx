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
} from '@mui/material';
import {
  ArrowBack,
  Share,
  People,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../store';
import { setCurrentSheet, setLoading } from '../store/sheetSlice';
import { sheetsApi } from '../services/api';
import Spreadsheet from '../components/Spreadsheet/Spreadsheet';

const Sheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentSheet, loading } = useSelector((state: RootState) => state.sheet);
  const { user } = useSelector((state: RootState) => state.auth);

  const [userPermissions, setUserPermissions] = useState<string>('read');

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
    } catch (error) {
      console.error('Ошибка загрузки таблицы:', error);
      navigate('/dashboard');
    } finally {
      dispatch(setLoading(false));
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {userPermissions === 'admin' && (
              <>
                <Button
                  startIcon={<People />}
                  variant="outlined"
                  size="small"
                >
                  Участники
                </Button>
                <Button
                  startIcon={<Share />}
                  variant="outlined"
                  size="small"
                >
                  Поделиться
                </Button>
              </>
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
    </Box>
  );
};

export default Sheet; 