import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, TextField } from '@mui/material';
import { cellsApi, sheetsExtendedApi } from '../../services/api';
import Cell from './Cell';
import FormatToolbar from './FormatToolbar';
import CellHistoryDialog from './CellHistoryDialog';
import { FormulaEngine } from '../../utils/formulaEngine';
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

interface CellSelection {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ sheet, userPermissions }) => {
  const [cells, setCells] = useState<Map<string, CellData>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<CellSelection | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; column: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; column: number } | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyCell, setHistoryCell] = useState<{ row: number; column: number } | null>(null);
  const [columnSizes, setColumnSizes] = useState<{ [key: number]: number }>({});
  const [rowSizes, setRowSizes] = useState<{ [key: number]: number }>({});

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

    // Загружаем размеры из настроек таблицы
    if (sheet?.settings) {
      setColumnSizes(sheet.settings.columnSizes || {});
      setRowSizes(sheet.settings.rowSizes || {});
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
    const cell = cells.get(key);
    if (!cell) return '';
    
    // Если ячейка содержит формулу, вычисляем и отображаем результат
    if (cell.formula && cell.formula.startsWith('=')) {
      const engine = new FormulaEngine(cells);
      const result = engine.evaluate(cell.formula);
      return result.toString();
    }
    
    return cell.value || '';
  };

  const getCellFormat = (row: number, column: number): any => {
    const key = getCellKey(row, column);
    return cells.get(key)?.format || {};
  };

  const setCellValue = (row: number, column: number, value: string, formula?: string) => {
    const key = getCellKey(row, column);
    const existingCell = cells.get(key);
    
    // Проверяем, действительно ли значение изменилось
    const currentValue = existingCell?.value || '';
    const currentFormula = existingCell?.formula || '';
    
    if (currentValue === value && currentFormula === (formula || '')) {
      // Значение не изменилось, не сохраняем
      return;
    }
    
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

    // Сохраняем в backend только если есть изменения
    debouncedSaveCell(row, column, value, formula);
  };

  const handleCellClick = (row: number, column: number) => {
    if (userPermissions === 'read') {
      setSelectedCell({ row, column });
      setSelectedRange({ startRow: row, endRow: row, startColumn: column, endColumn: column });
      setEditingCell(null);
      return;
    }

    // Если кликнули на уже выбранную ячейку - начинаем редактирование
    if (selectedCell && selectedCell.row === row && selectedCell.column === column) {
      setEditingCell({ row, column });
      
      // Для редактирования показываем формулу, если есть, иначе значение
      const key = getCellKey(row, column);
      const cell = cells.get(key);
      const editableValue = cell?.formula || cell?.value || '';
      setEditValue(editableValue);
    } else {
      // Иначе просто выбираем ячейку
      setSelectedCell({ row, column });
      setSelectedRange({ startRow: row, endRow: row, startColumn: column, endColumn: column });
      setEditingCell(null);
    }
  };

  const handleCellMouseDown = (row: number, column: number) => {
    setIsDragging(true);
    setDragStart({ row, column });
    setSelectedCell({ row, column });
    setSelectedRange({ startRow: row, endRow: row, startColumn: column, endColumn: column });
  };

  const handleCellMouseEnter = (row: number, column: number) => {
    if (isDragging && dragStart) {
      const startRow = Math.min(dragStart.row, row);
      const endRow = Math.max(dragStart.row, row);
      const startColumn = Math.min(dragStart.column, column);
      const endColumn = Math.max(dragStart.column, column);
      
      setSelectedRange({ startRow, endRow, startColumn, endColumn });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleCellDoubleClick = (row: number, column: number) => {
    if (userPermissions === 'read') return;
    
    setEditingCell({ row, column });
    setSelectedCell({ row, column });
    
    // Для редактирования показываем формулу, если есть, иначе значение
    const key = getCellKey(row, column);
    const cell = cells.get(key);
    const editableValue = cell?.formula || cell?.value || '';
    setEditValue(editableValue);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingCell) {
        saveCellWithFormula(editingCell.row, editingCell.column, editValue);
        setEditingCell(null);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (editingCell) {
        saveCellWithFormula(editingCell.row, editingCell.column, editValue);
        // Переходим к следующей ячейке
        const nextColumn = editingCell.column + 1;
        if (nextColumn < (sheet.columnCount || 26)) {
          setSelectedCell({ row: editingCell.row, column: nextColumn });
          setSelectedRange({ 
            startRow: editingCell.row, 
            endRow: editingCell.row, 
            startColumn: nextColumn, 
            endColumn: nextColumn 
          });
        }
        setEditingCell(null);
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleEditBlur = () => {
    // Автосохранение при потере фокуса
    if (editingCell) {
      saveCellWithFormula(editingCell.row, editingCell.column, editValue);
      setEditingCell(null);
    }
  };

  // Новая функция для сохранения ячеек с поддержкой формул
  const saveCellWithFormula = (row: number, column: number, value: string) => {
    if (value.startsWith('=')) {
      // Это формула
      const engine = new FormulaEngine(cells);
      const computedValue = engine.evaluate(value);
      setCellValue(row, column, computedValue.toString(), value);
    } else {
      // Обычное значение
      setCellValue(row, column, value);
    }
  };

  const handleFormat = async (format: any) => {
    if (!selectedRange || userPermissions === 'read') return;

    try {
      await cellsApi.formatCells(
        sheet.id,
        format,
        selectedRange.startRow,
        selectedRange.endRow,
        selectedRange.startColumn,
        selectedRange.endColumn
      );

      // Обновляем локальное состояние ячеек
      const newCells = new Map(cells);
      for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
        for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
          const key = getCellKey(row, col);
          const existingCell = newCells.get(key);
          const updatedFormat = { ...existingCell?.format, ...format };
          
          if (existingCell) {
            newCells.set(key, { ...existingCell, format: updatedFormat });
          } else {
            newCells.set(key, {
              row,
              column: col,
              value: '',
              format: updatedFormat
            });
          }
        }
      }
      setCells(newCells);
    } catch (error) {
      console.error('Ошибка применения форматирования:', error);
    }
  };

  const handleAddRow = async () => {
    try {
      await sheetsExtendedApi.addRow(sheet.id.toString());
      window.location.reload(); // Простое обновление страницы
    } catch (error) {
      console.error('Ошибка добавления строки:', error);
    }
  };

  const handleAddColumn = async () => {
    try {
      await sheetsExtendedApi.addColumn(sheet.id.toString());
      window.location.reload(); // Простое обновление страницы
    } catch (error) {
      console.error('Ошибка добавления столбца:', error);
    }
  };

  const handleShowHistory = (row: number, column: number) => {
    setHistoryCell({ row, column });
    setHistoryDialogOpen(true);
  };

  const isInSelectedRange = (row: number, column: number): boolean => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow && row <= selectedRange.endRow &&
           column >= selectedRange.startColumn && column <= selectedRange.endColumn;
  };

  const getColumnWidth = (column: number): number => {
    return columnSizes[column] || 100;
  };

  const getRowHeight = (row: number): number => {
    return rowSizes[row] || 30;
  };

  const renderColumnHeaders = () => {
    const headers = [];
    for (let col = 0; col < (sheet.columnCount || 26); col++) {
      const letter = String.fromCharCode(65 + col);
      const width = getColumnWidth(col);
      
      headers.push(
        <Box
          key={col}
          sx={{
            width: width,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            fontWeight: 'bold',
            fontSize: '0.875rem',
            position: 'relative',
          }}
        >
          {letter}
          {/* Разделитель для изменения размера */}
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 4,
              cursor: 'col-resize',
              '&:hover': {
                backgroundColor: '#1976d2',
              },
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = width;
              
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(50, startWidth + (e.clientX - startX));
                setColumnSizes(prev => ({ ...prev, [col]: newWidth }));
              };
              
              const handleMouseUp = async () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                try {
                  await sheetsExtendedApi.resizeColumn(sheet.id.toString(), col, columnSizes[col] || 100);
                } catch (error) {
                  console.error('Ошибка сохранения размера столбца:', error);
                }
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </Box>
      );
    }
    return headers;
  };

  const renderRowHeader = (row: number) => {
    const height = getRowHeight(row);
    
    return (
      <Box
        sx={{
          width: 50,
          height: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          fontWeight: 'bold',
          fontSize: '0.875rem',
          position: 'relative',
        }}
      >
        {row + 1}
        {/* Разделитель для изменения размера */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            cursor: 'row-resize',
            '&:hover': {
              backgroundColor: '#1976d2',
            },
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            const startY = e.clientY;
            const startHeight = height;
            
            const handleMouseMove = (e: MouseEvent) => {
              const newHeight = Math.max(20, startHeight + (e.clientY - startY));
              setRowSizes(prev => ({ ...prev, [row]: newHeight }));
            };
            
            const handleMouseUp = async () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              
              try {
                await sheetsExtendedApi.resizeRow(sheet.id.toString(), row, rowSizes[row] || 30);
              } catch (error) {
                console.error('Ошибка сохранения размера строки:', error);
              }
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </Box>
    );
  };

  const renderGrid = () => {
    const rows = [];
    
    for (let row = 0; row < (sheet.rowCount || 100); row++) {
      const cells = [];
      const rowHeight = getRowHeight(row);
      
      for (let col = 0; col < (sheet.columnCount || 26); col++) {
        const isSelected = selectedCell?.row === row && selectedCell?.column === col;
        const isEditing = editingCell?.row === row && editingCell?.column === col;
        const isInRange = isInSelectedRange(row, col);
        const cellFormat = getCellFormat(row, col);
        const columnWidth = getColumnWidth(col);
        
        cells.push(
          <Cell
            key={`${row}-${col}`}
            row={row}
            column={col}
            value={getCellValue(row, col)}
            format={cellFormat}
            isSelected={isSelected}
            isInRange={isInRange}
            isEditing={isEditing}
            editValue={editValue}
            width={columnWidth}
            height={rowHeight}
            onEditValueChange={setEditValue}
            onClick={() => handleCellClick(row, col)}
            onMouseDown={() => handleCellMouseDown(row, col)}
            onMouseEnter={() => handleCellMouseEnter(row, col)}
            onDoubleClick={() => handleCellDoubleClick(row, col)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditBlur}
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Панель инструментов */}
      <FormatToolbar
        selectedCells={selectedRange}
        onFormat={handleFormat}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
        onShowHistory={handleShowHistory}
        userPermissions={userPermissions}
      />

      {/* Таблица */}
      <Paper sx={{ flex: 1, overflow: 'auto' }} onMouseUp={handleMouseUp}>
        <Box sx={{ display: 'inline-block', minWidth: '100%' }}>
          {/* Headers */}
          <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 1 }}>
            <Box sx={{ width: 50, height: 30 }} /> {/* Corner cell */}
            {renderColumnHeaders()}
          </Box>
          
          {/* Grid */}
          {renderGrid()}
        </Box>
      </Paper>

      {/* Диалог истории */}
      {historyCell && (
        <CellHistoryDialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          sheetId={sheet.id}
          row={historyCell.row}
          column={historyCell.column}
        />
      )}
    </Box>
  );
};

export default Spreadsheet; 