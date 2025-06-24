import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  AppBar,
  Toolbar,
  Button,
  IconButton
} from '@mui/material';
import {
  People,
  Groups,
  Security,
  TableChart,
  ArrowBack,
  Webhook
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/Admin/UserManagement';
import GroupManagement from '../components/Admin/GroupManagement';
import AccessControl from '../components/Admin/AccessControl';
import { WebhookSettings } from '../components/Admin/WebhookSettings';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminPanel: React.FC = () => {
  const [value, setValue] = useState(0);
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Проверяем что пользователь администратор
  if (user?.role?.name !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Панель Администратора
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="admin panel tabs">
              <Tab 
                icon={<People />} 
                label="Пользователи" 
                {...a11yProps(0)} 
                iconPosition="start"
              />
              <Tab 
                icon={<Groups />} 
                label="Группы" 
                {...a11yProps(1)} 
                iconPosition="start"
              />
              <Tab 
                icon={<Security />} 
                label="Права доступа" 
                {...a11yProps(2)} 
                iconPosition="start"
              />
              <Tab 
                icon={<TableChart />} 
                label="Таблицы" 
                {...a11yProps(3)} 
                iconPosition="start"
              />
              <Tab 
                icon={<Webhook />} 
                label="Webhook" 
                {...a11yProps(4)} 
                iconPosition="start"
              />
            </Tabs>
          </Box>
          
          <TabPanel value={value} index={0}>
            <UserManagement />
          </TabPanel>
          
          <TabPanel value={value} index={1}>
            <GroupManagement />
          </TabPanel>
          
          <TabPanel value={value} index={2}>
            <AccessControl />
          </TabPanel>
          
          <TabPanel value={value} index={3}>
            <Typography variant="h6" gutterBottom>
              Управление таблицами
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Раздел в разработке. Пока управление таблицами доступно через основной интерфейс.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ mt: 2 }}
            >
              Перейти к таблицам
            </Button>
          </TabPanel>

          <TabPanel value={value} index={4}>
            <WebhookSettings />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminPanel; 