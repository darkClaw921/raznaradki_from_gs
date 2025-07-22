import React, { useState, useEffect } from 'react';
import { Box, TextField, Select, MenuItem, FormControl } from '@mui/material';
import { useSelector } from 'react-redux';

interface CellProps {
  row: number;
  column: number;
  value: string;
  format?: any;
  isSelected: boolean;
  isInRange?: boolean;
  isInClipboard?: boolean;
  isEditing: boolean;
  editValue: string;
  width?: number;
  height?: number;
  onEditValueChange: (value: string) => void;
  onClick: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onDoubleClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur?: () => void;
  readOnly: boolean;
  sheetTitle?: string;
}

const HOUSE_STATUS_OPTIONS = [
  'Выс/Зас',
  'Проживают', 
  'Свободен',
  'Бронь'
];

const Cell: React.FC<CellProps> = ({
  row,
  column,
  value,
  format = {},
  isSelected,
  isInRange = false,
  isInClipboard = false,
  isEditing,
  editValue,
  width = 100,
  height = 30,
  onEditValueChange,
  onClick,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  onKeyDown,
  onBlur,
  readOnly,
  sheetTitle = '',
}) => {
  const [selectOpen, setSelectOpen] = useState(false);
  
  // Безопасное получение данных из Redux store
  const sheets = useSelector((state: any) => state?.spreadsheet?.sheets || []);
  const sheet = sheets.find((s: any) => s.name === sheetTitle);

  const isHouseStatusField = () => {
    const isJournalSheet = sheetTitle.includes('Журнал заселения');
    const isColumn9 = column === 9;
    const isNotHeaderRow = row > 0;
    
    return isJournalSheet && isColumn9 && isNotHeaderRow;
  };

  const isReportSheet = sheetTitle.includes('Отчет');
  const needsLeftBorder = isReportSheet && (column === 2 || column === 6);

  // Проверяем, является ли лист отчетом на основе шаблона DMD Cottage
  const isDMDCottageReport = sheet?.template?.name === 'Отчет заселения/выселения DMD Cottage';
  const needsThickBorder = isDMDCottageReport && (column === 2 || column === 6);

  useEffect(() => {
    if (isEditing && isHouseStatusField()) {
      const timer = setTimeout(() => {
        setSelectOpen(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setSelectOpen(false);
    }
  }, [isEditing, column, row, sheetTitle]);

  const getFormattedStyles = () => {
    const styles: any = {
      width,
      height,
      display: 'flex',
      alignItems: 'center',
      padding: '4px 8px',
      fontSize: '0.875rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      cursor: readOnly ? 'default' : 'pointer',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      WebkitTouchCallout: 'none',
      WebkitTapHighlightColor: 'transparent',
    };

    if (format.fontFamily) styles.fontFamily = format.fontFamily;
    if (format.fontSize) styles.fontSize = `${format.fontSize}px`;
    if (format.fontWeight) styles.fontWeight = format.fontWeight;
    if (format.fontStyle) styles.fontStyle = format.fontStyle;
    if (format.textDecoration) styles.textDecoration = format.textDecoration;
    if (format.textColor) styles.color = format.textColor;
    if (format.backgroundColor) styles.backgroundColor = format.backgroundColor;
    if (format.textAlign) styles.textAlign = format.textAlign;
    
    // Поддержка переноса текста
    if (format.whiteSpace) {
      styles.whiteSpace = format.whiteSpace;
      styles.overflow = format.overflow || 'visible';
      styles.wordWrap = format.wordWrap || 'break-word';
      styles.textOverflow = 'unset';
      delete styles.textOverflow;
    }

    if (format.border) {
      const border = format.border;
      const borderStyle = `${border.width || 1}px ${border.style || 'solid'} ${border.color || '#000000'}`;
      
      switch (border.type) {
        case 'all':
          styles.border = borderStyle;
          break;
        case 'outer':
          styles.border = borderStyle;
          break;
        case 'inner':
          styles.borderRight = borderStyle;
          styles.borderBottom = borderStyle;
          break;
        default:
          styles.border = borderStyle;
      }
    } else {
      if (isSelected) {
        styles.border = '2px solid #1976d2';
        styles.boxShadow = '0 0 0 1px #1976d2';
        styles.zIndex = 10;
      } else if (isInRange) {
        styles.border = '1px solid #2196f3';
        styles.backgroundColor = !format.backgroundColor ? '#f0f8ff' : format.backgroundColor;
      } else if (isInClipboard) {
        styles.border = '2px dashed #ff9800';
        styles.backgroundColor = !format.backgroundColor ? '#fff3e0' : format.backgroundColor;
      } else {
        styles.border = '1px solid #e0e0e0';
      }
    }

    // Добавляем жирную левую границу для столбцов C и G в отчетах
    if (needsLeftBorder) {
      styles.borderLeft = '2px solid #000000';
    }

    // Добавляем жирную левую границу только для отчетов DMD Cottage
    if (needsThickBorder) {
      styles.borderLeft = '2px solid black';
    }

    if (!format.backgroundColor) {
      if (isSelected) {
        styles.backgroundColor = '#e3f2fd';
      } else if (isInRange) {
        styles.backgroundColor = '#f0f8ff';
      } else if (isInClipboard) {
        styles.backgroundColor = '#fff3e0';
      } else if (readOnly) {
        styles.backgroundColor = '#f9f9f9';
      } else {
        styles.backgroundColor = 'white';
      }
    }

    if (!isSelected && !isInRange && !isInClipboard) {
      styles['&:hover'] = {
        backgroundColor: readOnly ? '#f9f9f9' : '#f5f5f5',
        border: '1px solid #bdbdbd',
        borderLeft: needsLeftBorder ? '2px solid #000000' : needsThickBorder ? '2px solid black' : undefined,
      };
    }

    return styles;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onMouseDown) {
      onMouseDown();
    }
  };

  if (isEditing) {
    if (isHouseStatusField()) {
      return (
        <FormControl
          size="small"
          sx={{
            width,
            height,
            '& .MuiOutlinedInput-root': {
              height: '100%',
              '& fieldset': {
                border: '2px solid #1976d2',
              },
            },
          }}
        >
          <Select
            value={editValue || ''}
            open={selectOpen}
            onOpen={() => setSelectOpen(true)}
            onClose={() => setSelectOpen(false)}
            onChange={(e) => {
              onEditValueChange(e.target.value);
              setSelectOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                setSelectOpen(true);
              } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectOpen(true);
              } else {
                onKeyDown(e);
              }
            }}
            onBlur={(e) => {
              if (!selectOpen) {
                if (onBlur) onBlur();
              }
            }}
            autoFocus
            displayEmpty
            sx={{
              height: '100%',
              '& .MuiSelect-select': {
                padding: '4px 8px',
                fontSize: format.fontSize ? `${format.fontSize}px` : '0.875rem',
                fontFamily: format.fontFamily || 'inherit',
                fontWeight: format.fontWeight || 'normal',
                fontStyle: format.fontStyle || 'normal',
                textAlign: format.textAlign || 'left',
              },
            }}
          >
            <MenuItem value="">
              <em>Выберите статус</em>
            </MenuItem>
            {HOUSE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return (
      <TextField
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        autoFocus
        variant="outlined"
        size="small"
        sx={{
          width,
          height,
          '& .MuiOutlinedInput-root': {
            height: '100%',
            '& fieldset': {
              border: '2px solid #1976d2',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '4px 8px',
            fontSize: format.fontSize ? `${format.fontSize}px` : '0.875rem',
            fontFamily: format.fontFamily || 'inherit',
            fontWeight: format.fontWeight || 'normal',
            fontStyle: format.fontStyle || 'normal',
            textAlign: format.textAlign || 'left',
          },
        }}
      />
    );
  }

  return (
    <Box
      sx={getFormattedStyles()}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={onMouseEnter}
      onDoubleClick={onDoubleClick}
      title={value}
    >
      {value}
    </Box>
  );
};

export default Cell; 