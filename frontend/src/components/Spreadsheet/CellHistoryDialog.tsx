import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cellsApi } from '../../services/api';

interface CellHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  sheetId: number;
  row: number;
  column: number;
}

interface HistoryItem {
  id: number;
  oldValue?: string;
  newValue?: string;
  oldFormula?: string;
  newFormula?: string;
  oldFormat?: any;
  newFormat?: any;
  changeType: 'value' | 'formula' | 'format' | 'create' | 'delete';
  changedByUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const CellHistoryDialog: React.FC<CellHistoryDialogProps> = ({
  open,
  onClose,
  sheetId,
  row,
  column
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && sheetId && row !== undefined && column !== undefined) {
      loadHistory();
    }
  }, [open, sheetId, row, column]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await cellsApi.getCellHistory(sheetId, row, column);
      setHistory(response.data.history);
    } catch (error) {
      console.error('Ошибка загрузки истории ячейки:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const labels = {
      'create': 'Создание',
      'value': 'Значение',
      'formula': 'Формула',
      'format': 'Форматирование',
      'delete': 'Удаление'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getChangeTypeColor = (type: string) => {
    const colors = {
      'create': 'success',
      'value': 'primary',
      'formula': 'warning',
      'format': 'info',
      'delete': 'error'
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const renderChange = (item: HistoryItem) => {
    switch (item.changeType) {
      case 'value':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Было: "{item.oldValue || '(пусто)'}"
            </Typography>
            <Typography variant="body2">
              Стало: "{item.newValue || '(пусто)'}"
            </Typography>
          </Box>
        );
      case 'formula':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Была: {item.oldFormula || '(нет формулы)'}
            </Typography>
            <Typography variant="body2">
              Стала: {item.newFormula || '(нет формулы)'}
            </Typography>
          </Box>
        );
      case 'format':
        return (
          <Box>
            <Typography variant="body2">
              Изменено форматирование ячейки
            </Typography>
            {item.newFormat && (
              <Box sx={{ mt: 1 }}>
                {item.newFormat.fontWeight && (
                  <Chip label="Жирный" size="small" sx={{ mr: 0.5 }} />
                )}
                {item.newFormat.fontStyle && (
                  <Chip label="Курсив" size="small" sx={{ mr: 0.5 }} />
                )}
                {item.newFormat.textDecoration && (
                  <Chip label="Подчеркнутый" size="small" sx={{ mr: 0.5 }} />
                )}
                {item.newFormat.textColor && (
                  <Chip 
                    label="Цвет текста" 
                    size="small" 
                    sx={{ 
                      mr: 0.5,
                      backgroundColor: item.newFormat.textColor,
                      color: item.newFormat.textColor === '#000000' ? 'white' : 'black'
                    }} 
                  />
                )}
                {item.newFormat.backgroundColor && (
                  <Chip 
                    label="Цвет фона" 
                    size="small" 
                    sx={{ 
                      mr: 0.5,
                      backgroundColor: item.newFormat.backgroundColor,
                      color: item.newFormat.backgroundColor === '#000000' ? 'white' : 'black'
                    }} 
                  />
                )}
              </Box>
            )}
          </Box>
        );
      case 'create':
        return (
          <Typography variant="body2">
            Ячейка создана со значением: "{item.newValue || '(пусто)'}"
          </Typography>
        );
      default:
        return (
          <Typography variant="body2">
            Изменение типа: {item.changeType}
          </Typography>
        );
    }
  };

  const columnLetter = String.fromCharCode(65 + column);
  const cellAddress = `${columnLetter}${row + 1}`;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        История изменений ячейки {cellAddress}
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center" p={4}>
            История изменений пуста
          </Typography>
        ) : (
          <List>
            {history.map((item) => (
              <ListItem 
                key={item.id} 
                divider
                sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, width: '100%' }}>
                  <Chip 
                    label={getChangeTypeLabel(item.changeType)}
                    color={getChangeTypeColor(item.changeType) as any}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.changedByUser.firstName} {item.changedByUser.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {format(new Date(item.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </Typography>
                </Box>
                {renderChange(item)}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CellHistoryDialog; 