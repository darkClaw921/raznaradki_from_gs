import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Divider,
  Select,
  MenuItem,
  FormControl,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Menu,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  BorderAll,
  BorderOuter,
  BorderInner,
  Palette,
  FontDownload,
  History,
  Add,
  WrapText,
  AspectRatio
} from '@mui/icons-material';

interface FormatToolbarProps {
  selectedCells: { startRow: number; endRow: number; startColumn: number; endColumn: number } | null;
  onFormat: (format: any) => void;
  onAddRow: (count?: number) => void;
  onAddColumn: (count?: number) => void;
  onShowHistory: (row: number, column: number) => void;
  onAutoResize?: () => void;
  userPermissions: string;
  isReportSheet?: boolean;
}

const FormatToolbar: React.FC<FormatToolbarProps> = ({
  selectedCells,
  onFormat,
  onAddRow,
  onAddColumn,
  onShowHistory,
  onAutoResize,
  userPermissions,
  isReportSheet = false
}) => {
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(12);
  const [textAlign, setTextAlign] = useState('left');
  const [colorAnchor, setColorAnchor] = useState<null | HTMLElement>(null);
  const [isColorUserInitiated, setIsColorUserInitiated] = useState(false);
  const [borderAnchor, setBorderAnchor] = useState<null | HTMLElement>(null);
  const [isUserInitiated, setIsUserInitiated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [addRowDialogOpen, setAddRowDialogOpen] = useState(false);
  const [addColumnDialogOpen, setAddColumnDialogOpen] = useState(false);
  const [rowCount, setRowCount] = useState(1);
  const [columnCount, setColumnCount] = useState(1);

  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia'
  ];

  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const borderStyles = [
    { name: 'Все границы', value: 'all', icon: <BorderAll /> },
    { name: 'Внешние границы', value: 'outer', icon: <BorderOuter /> },
    { name: 'Внутренние границы', value: 'inner', icon: <BorderInner /> }
  ];

  const handleFontFormat = (type: string, value: any) => {
    const format = { [type]: value };
    onFormat(format);
  };

  const handleBorderFormat = (borderType: string) => {
    const format = {
      border: {
        type: borderType,
        style: 'solid',
        width: 1,
        color: '#000000'
      }
    };
    onFormat(format);
    setBorderAnchor(null);
  };

  const handleColorFormat = (colorType: 'textColor' | 'backgroundColor', color: string) => {
    const format = { [colorType]: color };
    onFormat(format);
    setColorAnchor(null);
  };

  const handleAlignChange = (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
    if (newAlignment !== null) {
      setTextAlign(newAlignment);
      handleFontFormat('textAlign', newAlignment);
    }
  };

  const handleWrapText = () => {
    const format = {
      textWrap: 'wrap', // Добавляем флаг для автоподстройки высоты
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
      overflow: 'hidden'
    };
    onFormat(format);
  };

  const handleShowHistory = () => {
    if (selectedCells && selectedCells.startRow === selectedCells.endRow && 
        selectedCells.startColumn === selectedCells.endColumn) {
      onShowHistory(selectedCells.startRow, selectedCells.startColumn);
    }
  };

  const handleAddRows = () => {
    onAddRow(rowCount);
    setAddRowDialogOpen(false);
    setRowCount(1);
  };

  const handleAddColumns = () => {
    onAddColumn(columnCount);
    setAddColumnDialogOpen(false);
    setColumnCount(1);
  };

  const isReadOnly = userPermissions === 'read';
  const canEditStructure = userPermissions === 'admin';

  // Защита от случайного открытия меню при инициализации
  useEffect(() => {
    // Сбрасываем состояние меню при инициализации компонента
    setBorderAnchor(null);
    setColorAnchor(null);
    setIsUserInitiated(false);
    setIsColorUserInitiated(false);
    setIsInitializing(true);
    console.log('🔧 FormatToolbar инициализирован, меню сброшены');
    
    // Разрешаем взаимодействие через 2 секунды после инициализации
    const timer = setTimeout(() => {
      setIsInitializing(false);
      console.log('🔧 FormatToolbar готов к взаимодействию');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Paper 
      sx={{ 
        p: 1, 
        mb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        flexWrap: 'wrap'
      }}
    >
      {/* Добавление строк и столбцов */}
      {canEditStructure && (
        <>
          <Tooltip title="Добавить строку">
            <Button 
              onClick={() => setAddRowDialogOpen(true)} 
              size="small" 
              startIcon={<Add />}
            >
              Строка
            </Button>
          </Tooltip>
          <Tooltip title="Добавить столбец">
            <Button 
              onClick={() => setAddColumnDialogOpen(true)} 
              size="small" 
              startIcon={<Add />}
            >
              Столбец
            </Button>
          </Tooltip>
          <Divider orientation="vertical" flexItem />
        </>
      )}

      {/* Форматирование шрифта */}
      {!isReadOnly && (
        <>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={fontFamily}
              onChange={(e) => {
                setFontFamily(e.target.value);
                handleFontFormat('fontFamily', e.target.value);
              }}
            >
              {fontFamilies.map((font) => (
                <MenuItem key={font} value={font}>
                  {font}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 60 }}>
            <Select
              value={fontSize}
              onChange={(e) => {
                setFontSize(Number(e.target.value));
                handleFontFormat('fontSize', Number(e.target.value));
              }}
            >
              {fontSizes.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem />

          {/* Стили текста */}
          <Tooltip title="Жирный">
            <IconButton 
              onClick={() => handleFontFormat('fontWeight', 'bold')}
              size="small"
            >
              <FormatBold />
            </IconButton>
          </Tooltip>

          <Tooltip title="Курсив">
            <IconButton 
              onClick={() => handleFontFormat('fontStyle', 'italic')}
              size="small"
            >
              <FormatItalic />
            </IconButton>
          </Tooltip>

          <Tooltip title="Подчеркнутый">
            <IconButton 
              onClick={() => handleFontFormat('textDecoration', 'underline')}
              size="small"
            >
              <FormatUnderlined />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem />

          {/* Выравнивание */}
          <ToggleButtonGroup
            value={textAlign}
            exclusive
            onChange={handleAlignChange}
            size="small"
          >
            <ToggleButton value="left">
              <FormatAlignLeft />
            </ToggleButton>
            <ToggleButton value="center">
              <FormatAlignCenter />
            </ToggleButton>
            <ToggleButton value="right">
              <FormatAlignRight />
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem />

          {/* Перенос текста */}
          <Tooltip title="Перенос текста">
            <IconButton 
              onClick={handleWrapText}
              size="small"
            >
              <WrapText />
            </IconButton>
          </Tooltip>

          {/* Автонастройка размеров для отчетов */}
          {isReportSheet && onAutoResize && (
            <Tooltip title="Автонастройка размеров строк и столбцов">
              <IconButton 
                onClick={onAutoResize}
                size="small"
              >
                <AspectRatio />
              </IconButton>
            </Tooltip>
          )}

          <Divider orientation="vertical" flexItem />

          {/* Цвета */}
          <Tooltip title="Цвет текста и фона">
            <IconButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Дополнительная проверка что это реальный клик пользователя и компонент готов
                if (e.isTrusted && e.type === 'click' && !isInitializing) {
                  console.log('🎨 Реальный клик пользователя на кнопку цветов', {
                    isTrusted: e.isTrusted,
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget
                  });
                  setIsColorUserInitiated(true);
                  setColorAnchor(e.currentTarget);
                } else {
                  console.log('🚫 Блокируем подозрительное событие на кнопке цветов', {
                    isTrusted: e.isTrusted,
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget,
                    isInitializing
                  });
                }
              }}
              size="small"
            >
              <Palette />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={colorAnchor}
            open={Boolean(colorAnchor) && isColorUserInitiated}
            onClose={() => {
              console.log('🎨 Закрываем меню цветов');
              setColorAnchor(null);
              setIsColorUserInitiated(false);
            }}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
          >
            <Box sx={{ p: 2, maxWidth: 200 }}>
              <Box sx={{ mb: 1, fontWeight: 'bold' }}>Цвет текста</Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {colors.map((color) => (
                  <Box
                    key={`text-${color}`}
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                    onClick={() => handleColorFormat('textColor', color)}
                  />
                ))}
              </Box>
              <Box sx={{ mb: 1, fontWeight: 'bold' }}>Цвет фона</Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {colors.map((color) => (
                  <Box
                    key={`bg-${color}`}
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: color,
                      border: '1px solid #ccc',
                      cursor: 'pointer',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                    onClick={() => handleColorFormat('backgroundColor', color)}
                  />
                ))}
              </Box>
            </Box>
          </Menu>

          {/* Границы */}
          <Tooltip title="Границы">
            <IconButton 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Дополнительная проверка что это реальный клик пользователя и компонент готов
                if (e.isTrusted && e.type === 'click' && !isInitializing) {
                  console.log('🔳 Реальный клик пользователя на кнопку границ', {
                    isTrusted: e.isTrusted,
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget
                  });
                  setIsUserInitiated(true);
                  setBorderAnchor(e.currentTarget);
                } else {
                  console.log('🚫 Блокируем подозрительное событие на кнопке границ', {
                    isTrusted: e.isTrusted,
                    type: e.type,
                    target: e.target,
                    currentTarget: e.currentTarget,
                    isInitializing
                  });
                }
              }}
              size="small"
            >
              <BorderAll />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={borderAnchor}
            open={Boolean(borderAnchor) && isUserInitiated}
            onClose={() => {
              console.log('🔳 Закрываем меню границ');
              setBorderAnchor(null);
              setIsUserInitiated(false);
            }}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
          >
            <Box sx={{ p: 1 }}>
              {borderStyles.map((style) => (
                <Button
                  key={style.value}
                  startIcon={style.icon}
                  onClick={() => handleBorderFormat(style.value)}
                  sx={{ display: 'block', width: '100%', mb: 0.5 }}
                >
                  {style.name}
                </Button>
              ))}
            </Box>
          </Menu>

          <Divider orientation="vertical" flexItem />
        </>
      )}

      {/* История */}
      <Tooltip title="История изменений ячейки">
        <IconButton 
          onClick={handleShowHistory}
          size="small"
          disabled={!selectedCells || selectedCells.startRow !== selectedCells.endRow || 
                   selectedCells.startColumn !== selectedCells.endColumn}
        >
          <History />
        </IconButton>
      </Tooltip>

      {/* Диалог добавления строк */}
      <Dialog open={addRowDialogOpen} onClose={() => setAddRowDialogOpen(false)}>
        <DialogTitle>Добавить строки</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Количество строк"
            type="number"
            fullWidth
            variant="outlined"
            value={rowCount}
            onChange={(e) => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 50 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRowDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleAddRows} variant="contained">Добавить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог добавления столбцов */}
      <Dialog open={addColumnDialogOpen} onClose={() => setAddColumnDialogOpen(false)}>
        <DialogTitle>Добавить столбцы</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Количество столбцов"
            type="number"
            fullWidth
            variant="outlined"
            value={columnCount}
            onChange={(e) => setColumnCount(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 26 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddColumnDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleAddColumns} variant="contained">Добавить</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default FormatToolbar; 