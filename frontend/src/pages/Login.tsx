import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { AppDispatch, RootState } from '../store';
import { login, register, clearError } from '../store/authSlice';

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Очищаем ошибки при смене таба
    dispatch(clearError());
  }, [tabValue, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) {
      dispatch(login(loginForm));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.email && registerForm.password && registerForm.firstName && registerForm.lastName) {
      dispatch(register(registerForm));
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            DMD Cottage Sheets
          </Typography>
          
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
            <Tab label="Вход" />
            <Tab label="Регистрация" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {tabValue === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                margin="normal"
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Войти'}
              </Button>
            </Box>
          )}

          {tabValue === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                margin="normal"
                required
                autoComplete="email"
              />
              <TextField
                fullWidth
                label="Имя"
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                margin="normal"
                required
                autoComplete="given-name"
              />
              <TextField
                fullWidth
                label="Фамилия"
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                margin="normal"
                required
                autoComplete="family-name"
              />
              <TextField
                fullWidth
                label="Пароль"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                margin="normal"
                required
                autoComplete="new-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 