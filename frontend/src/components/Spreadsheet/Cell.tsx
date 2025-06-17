import React from 'react';
import { Box, TextField } from '@mui/material';

interface CellProps {
  row: number;
  column: number;
  value: string;
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onClick: () => void;
  onDoubleClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  readOnly: boolean;
}

const Cell: React.FC<CellProps> = ({
  row,
  column,
  value,
  isSelected,
  isEditing,
  editValue,
  onEditValueChange,
  onClick,
  onDoubleClick,
  onKeyDown,
  readOnly,
}) => {
  if (isEditing) {
    return (
      <TextField
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
        variant="outlined"
        size="small"
        sx={{
          width: 100,
          height: 30,
          '& .MuiOutlinedInput-root': {
            height: '100%',
            '& fieldset': {
              border: '2px solid #1976d2',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '4px 8px',
            fontSize: '0.875rem',
          },
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 100,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        border: isSelected 
          ? '2px solid #1976d2' 
          : '1px solid #e0e0e0',
        backgroundColor: isSelected 
          ? '#e3f2fd' 
          : readOnly 
            ? '#f9f9f9' 
            : 'white',
        cursor: readOnly ? 'default' : 'pointer',
        fontSize: '0.875rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        '&:hover': {
          backgroundColor: isSelected 
            ? '#e3f2fd' 
            : readOnly 
              ? '#f9f9f9' 
              : '#f5f5f5',
        },
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={value} // Показываем полный текст в tooltip
    >
      {value}
    </Box>
  );
};

export default Cell; 