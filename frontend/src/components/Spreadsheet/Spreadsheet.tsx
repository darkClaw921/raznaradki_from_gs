import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, TextField } from '@mui/material';
import { cellsApi } from '../../services/api';
import Cell from './Cell';
import { debounce } from 'lodash';

interface SpreadsheetProps {
  sheet: any;
  userPermissions: string;
}

interface CellData {
  row: number;
  column: number;
  value: string;
  formula?: string;
  format?: any;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ sheet, userPermissions }) => {
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; column: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Загрузка ячеек при инициализации
  useEffect(() => {
    if (sheet?.cells) {
      const cellsMap = new Map<string, CellData>();
      sheet.cells.forEach((cell: any) => {
        const key = `${cell.row}-${cell.column}`;
        cellsMap.set(key, cell);
      });
      setCells(cellsMap);
    }
  }, [sheet]);

  // Debounced функция для сохранения ячейки
  const debouncedSaveCell = useCallback(
    debounce(async (row: number, column: number, value: string, formula?: string) => {
      if (userPermissions === 'read') return;
      
      try {
        await cellsApi.updateCell(sheet.id, row, column, {
          value,
          formula: formula || undefined,
        });
      } catch (error) {
        console.error('Ошибка сохранения ячейки:', error);
      }
    }, 500),
    [sheet.id, userPermissions]
  );

  const getCellKey = (row: number, column: number) => `${row}-${column}`;

  const getCellValue = (row: number, column: number): string => {
    const key = getCellKey(row, column);
    return cells.get(key)?.value || '';
  };

  const setCellValue = (row: number, column: number, value: string, formula?: string) => {
    const key = getCellKey(row, column);
    const existingCell = cells.get(key);
    
    const updatedCell: CellData = {
      row,
      column,
      value,
      formula: formula || existingCell?.formula,
      format: existingCell?.format,
    };

    const newCells = new Map(cells);
    newCells.set(key, updatedCell);
    setCells(newCells);

    // Сохраняем в backend
    debouncedSaveCell(row, column, value, formula);
  };

  const handleCellClick = (row: number, column: number) => {
    setSelectedCell({ row, column });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (row: number, column: number) => {
    if (userPermissions === 'read') return;
    
    setEditingCell({ row, column });
    setSelectedCell({ row, column });
    const currentValue = getCellValue(row, column);
    setEditValue(currentValue);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingCell) {
        setCellValue(editingCell.row, editingCell.column, editValue);
        setEditingCell(null);
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const renderColumnHeaders = () => {
    const headers = [];
    for (let col = 0; col < (sheet.columnCount || 26); col++) {
      const letter = String.fromCharCode(65 + col);
      headers.push(
        <Box
          key={col}
          sx={{
            width: 100,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          {letter}
        </Box>
      );
    }
    return headers;
  };

  const renderRowHeader = (row: number) => (
    <Box
      sx={{
        width: 50,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #e0e0e0',
        fontWeight: 'bold',
        fontSize: '0.875rem',
      }}
    >
      {row + 1}
    </Box>
  );

  const renderGrid = () => {
    const rows = [];
    
    for (let row = 0; row < (sheet.rowCount || 100); row++) {
      const cells = [];
      
      for (let col = 0; col < (sheet.columnCount || 26); col++) {
        const isSelected = selectedCell?.row === row && selectedCell?.column === col;
        const isEditing = editingCell?.row === row && editingCell?.column === col;
        
        cells.push(
          <Cell
            key={`${row}-${col}`}
            row={row}
            column={col}
            value={getCellValue(row, col)}
            isSelected={isSelected}
            isEditing={isEditing}
            editValue={editValue}
            onEditValueChange={setEditValue}
            onClick={() => handleCellClick(row, col)}
            onDoubleClick={() => handleCellDoubleClick(row, col)}
            onKeyDown={handleEditKeyDown}
            readOnly={userPermissions === 'read'}
          />
        );
      }
      
      rows.push(
        <Box key={row} sx={{ display: 'flex' }}>
          {renderRowHeader(row)}
          {cells}
        </Box>
      );
    }
    
    return rows;
  };

  return (
    <Paper sx={{ height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'inline-block', minWidth: '100%' }}>
        {/* Headers */}
        <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 1 }}>
          <Box sx={{ width: 50, height: 30 }} /> {/* Corner cell */}
          {renderColumnHeaders()}
        </Box>
        
        {/* Grid */}
        <Box>
          {renderGrid()}
        </Box>
      </Box>
    </Paper>
  );
};

export default Spreadsheet; 