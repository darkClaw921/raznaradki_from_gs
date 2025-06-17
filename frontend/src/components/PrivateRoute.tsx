import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import { RootState, AppDispatch } from '../store';
import { getCurrentUser } from '../store/authSlice';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, loading, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Если есть токен, но нет данных пользователя, загружаем их
    if (token && !user && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, user, loading]);

  // Показываем загрузку пока проверяем аутентификацию
  if (loading || (token && !user)) {
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

  // Если не аутентифицирован, перенаправляем на логин
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute; 