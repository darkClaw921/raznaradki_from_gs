import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Alert,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { Refresh, ContentCopy } from '@mui/icons-material';
import { systemApi } from '../../services/api';

interface SystemSettings {
  webhook_enabled: string;
  webhook_url: string;
  webhook_secret: string;
}

export const WebhookSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    webhook_enabled: 'false',
    webhook_url: '',
    webhook_secret: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await systemApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке настроек' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebhook = async (enabled: boolean) => {
    try {
      setLoading(true);
      await systemApi.toggleWebhook(enabled);
      setSettings(prev => ({ ...prev, webhook_enabled: enabled.toString() }));
      setMessage({ 
        type: 'success', 
        text: `Webhook ${enabled ? 'включен' : 'отключен'}` 
      });
    } catch (error) {
      console.error('Ошибка при переключении webhook:', error);
      setMessage({ type: 'error', text: 'Ошибка при переключении webhook' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWebhook = async () => {
    try {
      setLoading(true);
      const response = await systemApi.generateWebhookUrl();
      setSettings(prev => ({
        ...prev,
        webhook_url: response.data.webhookUrl,
        webhook_secret: response.data.webhookId
      }));
      setMessage({ 
        type: 'success', 
        text: 'Новый webhook URL сгенерирован' 
      });
    } catch (error) {
      console.error('Ошибка при генерации webhook URL:', error);
      setMessage({ type: 'error', text: 'Ошибка при генерации webhook URL' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(settings.webhook_url);
    setMessage({ type: 'success', text: 'URL скопирован в буфер обмена' });
  };

  const isEnabled = settings.webhook_enabled === 'true';

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Настройки Webhook
        </Typography>
        
        {message && (
          <Alert 
            severity={message.type} 
            onClose={() => setMessage(null)}
            sx={{ mb: 2 }}
          >
            {message.text}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isEnabled}
                onChange={(e) => handleToggleWebhook(e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <Box>
                <Typography component="span">
                  Webhook {isEnabled ? 'включен' : 'отключен'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Автоматическое добавление данных бронирования в таблицы
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Webhook URL
          </Typography>
          
          {settings.webhook_url ? (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  value={settings.webhook_url}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={handleCopyUrl}
                >
                  Копировать
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Используйте этот URL для настройки webhook в системе бронирования
              </Typography>
            </Paper>
          ) : (
            <Alert severity="info">
              Webhook URL не сгенерирован. Нажмите кнопку "Сгенерировать" для создания.
            </Alert>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleGenerateWebhook}
            disabled={loading}
            startIcon={<Refresh />}
          >
            {settings.webhook_url ? 'Перегенерировать' : 'Сгенерировать'} URL
          </Button>
          
          <Button
            variant="outlined"
            onClick={loadSettings}
            disabled={loading}
          >
            Обновить
          </Button>
        </Box>

        {settings.webhook_secret && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Информация
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`Статус: ${isEnabled ? 'Активен' : 'Неактивен'}`}
                color={isEnabled ? 'success' : 'default'}
                size="small"
              />
              <Chip 
                label={`ID: ${settings.webhook_secret.substring(0, 8)}...`}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}; 