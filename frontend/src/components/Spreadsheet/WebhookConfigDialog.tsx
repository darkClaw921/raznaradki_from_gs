import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  Alert,
  Autocomplete,
  Paper
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { webhookApi } from '../../services/api';

interface WebhookConfigDialogProps {
  open: boolean;
  onClose: () => void;
  sheetId: string;
  sheetTitle: string;
}

interface WebhookMapping {
  id: number;
  sheetId: number;
  apartmentTitles: string;
  isActive: boolean;
}

export const WebhookConfigDialog: React.FC<WebhookConfigDialogProps> = ({
  open,
  onClose,
  sheetId,
  sheetTitle
}) => {
  const [mapping, setMapping] = useState<WebhookMapping | null>(null);
  const [apartmentTitles, setApartmentTitles] = useState<string[]>([]);
  const [newApartment, setNewApartment] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (open && sheetId) {
      loadMapping();
    }
  }, [open, sheetId]);

  const loadMapping = async () => {
    try {
      setLoading(true);
      const response = await webhookApi.getMapping(sheetId);
      
      if (response.data) {
        setMapping(response.data);
        setApartmentTitles(JSON.parse(response.data.apartmentTitles || '[]'));
        setIsActive(response.data.isActive);
      } else {
        // Нет настроек - используем значения по умолчанию
        setMapping(null);
        setApartmentTitles([]);
        setIsActive(true);
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек webhook:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке настроек' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (apartmentTitles.length === 0) {
        setMessage({ type: 'error', text: 'Необходимо указать хотя бы один апартамент' });
        return;
      }

      setLoading(true);
      await webhookApi.updateMapping(sheetId, {
        apartmentTitles,
        isActive
      });

      setMessage({ type: 'success', text: 'Настройки webhook сохранены' });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Ошибка при сохранении настроек webhook:', error);
      setMessage({ type: 'error', text: 'Ошибка при сохранении настроек' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddApartment = () => {
    if (newApartment.trim() && !apartmentTitles.includes(newApartment.trim())) {
      setApartmentTitles([...apartmentTitles, newApartment.trim()]);
      setNewApartment('');
    }
  };

  const handleRemoveApartment = (apartment: string) => {
    setApartmentTitles(apartmentTitles.filter(apt => apt !== apartment));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddApartment();
    }
  };

  // Предустановленные варианты апартаментов
  const suggestedApartments = [
    'c045'
    // 'с045', 'с046', 'с047', 'с048', 'с049',
    // 'с045', 'с046', 'с047', 'с048', 'с049',
    // 'DMD-1', 'DMD-2', 'DMD-3', 'DMD-4', 'DMD-5',
    // 'Студия-1', 'Студия-2', 'Студия-3'
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        Настройка Webhook для таблицы
        <Typography variant="body2" color="text.secondary">
          {sheetTitle}
        </Typography>
      </DialogTitle>

      <DialogContent>
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
          <Typography variant="body2" color="text.secondary" paragraph>
            Настройте, какие апартаменты должны автоматически добавляться в эту таблицу 
            при получении данных бронирования через webhook.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <Box>
                <Typography component="span">
                  Webhook активен
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Автоматически добавлять данные в эту таблицу
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Названия апартаментов
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Autocomplete
              freeSolo
              options={suggestedApartments}
              value={newApartment}
              onChange={(_, value) => setNewApartment(value || '')}
              onInputChange={(_, value) => setNewApartment(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Добавить апартамент"
                  placeholder="Например: с045"
                  variant="outlined"
                  size="small"
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <Button
                        onClick={handleAddApartment}
                        disabled={!newApartment.trim() || apartmentTitles.includes(newApartment.trim())}
                        startIcon={<Add />}
                        size="small"
                      >
                        Добавить
                      </Button>
                    ),
                  }}
                />
              )}
            />
          </Box>

          {apartmentTitles.length > 0 ? (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Настроенные апартаменты ({apartmentTitles.length}):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {apartmentTitles.map((apartment) => (
                  <Chip
                    key={apartment}
                    label={apartment}
                    onDelete={() => handleRemoveApartment(apartment)}
                    deleteIcon={<Delete />}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          ) : (
            <Alert severity="info">
              Добавьте названия апартаментов, для которых данные бронирования должны попадать в эту таблицу
            </Alert>
          )}
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            <strong>Как это работает:</strong><br />
            • При получении webhook с данными бронирования система проверит название апартамента<br />
            • Если название совпадает с одним из указанных выше, данные автоматически добавятся в таблицу<br />
            • Если несколько таблиц настроены на один апартамент, данные добавятся во все такие таблицы
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || apartmentTitles.length === 0}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 