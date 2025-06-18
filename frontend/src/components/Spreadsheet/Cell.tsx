import React from 'react';
import { Box, TextField } from '@mui/material';

interface CellProps {
  row: number;
  column: number;
  value: string;
  format?: any;
  isSelected: boolean;
  isInRange?: boolean;
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
}

const Cell: React.FC<CellProps> = ({
  row,
  column,
  value,
  format = {},
  isSelected,
  isInRange = false,
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
}) => {
  // Применяем форматирование к стилям
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
    };

    // Применяем пользовательское форматирование
    if (format.fontFamily) styles.fontFamily = format.fontFamily;
    if (format.fontSize) styles.fontSize = `${format.fontSize}px`;
    if (format.fontWeight) styles.fontWeight = format.fontWeight;
    if (format.fontStyle) styles.fontStyle = format.fontStyle;
    if (format.textDecoration) styles.textDecoration = format.textDecoration;
    if (format.textColor) styles.color = format.textColor;
    if (format.backgroundColor) styles.backgroundColor = format.backgroundColor;
    if (format.textAlign) styles.textAlign = format.textAlign;

    // Границы
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
          // Внутренние границы применяются только если есть соседние ячейки с тем же форматированием
          styles.borderRight = borderStyle;
          styles.borderBottom = borderStyle;
          break;
        default:
          styles.border = borderStyle;
      }
    } else {
      // Стандартные границы
      styles.border = isSelected 
        ? '2px solid #1976d2' 
        : isInRange
          ? '1px solid #1976d2'
          : '1px solid #e0e0e0';
    }

    // Цвет фона для выделенных ячеек
    if (!format.backgroundColor) {
      if (isSelected) {
        styles.backgroundColor = '#e3f2fd';
      } else if (isInRange) {
        styles.backgroundColor = '#f0f8ff';
      } else if (readOnly) {
        styles.backgroundColor = '#f9f9f9';
      } else {
        styles.backgroundColor = 'white';
      }
    }

    // Эффект hover
    styles['&:hover'] = {
      backgroundColor: isSelected || isInRange
        ? styles.backgroundColor
        : readOnly 
          ? '#f9f9f9' 
          : '#f5f5f5',
    };

    return styles;
  };

  if (isEditing) {
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
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onDoubleClick={onDoubleClick}
      title={value} // Показываем полный текст в tooltip
    >
      {value}
    </Box>
  );
};

export default Cell; 