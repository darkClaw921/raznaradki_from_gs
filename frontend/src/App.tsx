import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sheet from './pages/Sheet';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import { useSelector } from 'react-redux';
import { RootState } from './store';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function AppContent() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/sheet/:id" 
            element={
              <PrivateRoute>
                <Sheet />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App; 