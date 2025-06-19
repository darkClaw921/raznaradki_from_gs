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
  
  // Состояние для буфера обмена
  const [clipboard, setClipboard] = useState<{
    data: Map<string, CellData>;
    range: CellSelection;
    operation: 'copy' | 'cut';
  } | null>(null);

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

  // Обработка клавиатурной навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Обработка Escape для всех случаев (даже во время редактирования)
      if (e.key === 'Escape') {
        e.preventDefault();
        // Снимаем выделение и очищаем буфер обмена
        setSelectedCell(null);
        setSelectedRange(null);
        setEditingCell(null);
        setClipboard(null);
        setEditValue('');
        console.log('Escape нажат: очистка выделения и буфера обмена');
        return;
      }

      // Не обрабатываем остальные клавиши если идёт редактирование ячейки
      if (editingCell) return;
      
      // Не обрабатываем если фокус на другом элементе ввода
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (!selectedCell) return;

      const maxRows = sheet.rowCount || 100;
      const maxCols = sheet.columnCount || 26;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (selectedCell.row > 0) {
            const newRow = selectedCell.row - 1;
            setSelectedCell({ row: newRow, column: selectedCell.column });
            setSelectedRange({ startRow: newRow, endRow: newRow, startColumn: selectedCell.column, endColumn: selectedCell.column });
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (selectedCell.row < maxRows - 1) {
            const newRow = selectedCell.row + 1;
            setSelectedCell({ row: newRow, column: selectedCell.column });
            setSelectedRange({ startRow: newRow, endRow: newRow, startColumn: selectedCell.column, endColumn: selectedCell.column });
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (selectedCell.column > 0) {
            const newCol = selectedCell.column - 1;
            setSelectedCell({ row: selectedCell.row, column: newCol });
            setSelectedRange({ startRow: selectedCell.row, endRow: selectedCell.row, startColumn: newCol, endColumn: newCol });
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (selectedCell.column < maxCols - 1) {
            const newCol = selectedCell.column + 1;
            setSelectedCell({ row: selectedCell.row, column: newCol });
            setSelectedRange({ startRow: selectedCell.row, endRow: selectedCell.row, startColumn: newCol, endColumn: newCol });
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (userPermissions !== 'read' && selectedCell) {
            handleCellDoubleClick(selectedCell.row, selectedCell.column);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (userPermissions !== 'read' && selectedRange) {
            // Очищаем содержимое выделенных ячеек
            for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
              for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
                setCellValue(row, col, '');
              }
            }
          }
          break;
      }

      // Обработка комбинаций клавиш с Ctrl
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
          case 'C':
            e.preventDefault();
            copySelectedCells();
            break;
          case 'x':
          case 'X':
            e.preventDefault();
            cutSelectedCells();
            break;
          case 'v':
          case 'V':
            e.preventDefault();
            pasteClipboard();
            break;
        }
      }
    };

    // Обработчик события paste для улавливания данных из внешних источников
    const handlePaste = async (e: ClipboardEvent) => {
      // Пропускаем если идёт редактирование ячейки или нет выделенной ячейки
      if (editingCell || !selectedCell || userPermissions === 'read') {
        console.log('Пропускаем paste: редактирование=', editingCell, 'выделенная ячейка=', selectedCell, 'права=', userPermissions);
        return;
      }
      
      // Пропускаем если фокус на элементе ввода (кроме нашей таблицы)
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
        console.log('Пропускаем paste: фокус на элементе ввода');
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      console.log('Обрабатываем paste событие');
      
      try {
        // Получаем данные из системного буфера обмена
        const clipboardData = e.clipboardData;
        let textData = '';

        if (clipboardData) {
          // Пытаемся получить данные в разных форматах
          textData = clipboardData.getData('text/plain') || 
                    clipboardData.getData('text/tab-separated-values') ||
                    clipboardData.getData('text/csv');
        }

        if (!textData) {
          // Fallback - пытаемся прочитать через navigator.clipboard
          try {
            textData = await navigator.clipboard.readText();
          } catch (clipboardError) {
            console.log('Не удалось прочитать clipboard через navigator:', clipboardError);
          }
        }

        if (textData) {
          console.log('Вставляем данные из внешнего источника:', textData.substring(0, 100) + '...');
          
          // Разбираем данные по строкам и столбцам
          const rows = textData.split(/\r?\n/).filter(row => row.trim() !== '');
          const startRow = selectedCell.row;
          const startCol = selectedCell.column;

          let pastedCount = 0;
          
          rows.forEach((rowText, rowIndex) => {
            // Пытаемся разделить по разным разделителям
            let cellValues = [];
            
            // Пробуем табуляцию (TSV)
            if (rowText.includes('\t')) {
              cellValues = rowText.split('\t');
            } 
            // Пробуем запятую (CSV)
            else if (rowText.includes(',') && !rowText.includes(';')) {
              cellValues = rowText.split(',');
            }
            // Пробуем точку с запятой
            else if (rowText.includes(';')) {
              cellValues = rowText.split(';');
            }
            // Если разделителей нет, считаем одной ячейкой
            else {
              cellValues = [rowText];
            }

            cellValues.forEach((cellText, colIndex) => {
              const targetRow = startRow + rowIndex;
              const targetCol = startCol + colIndex;

              if (targetRow < (sheet.rowCount || 100) && targetCol < (sheet.columnCount || 26)) {
                // Очищаем от кавычек и пробелов
                const cleanValue = cellText.replace(/^["']|["']$/g, '').trim();
                setCellValue(targetRow, targetCol, cleanValue);
                pastedCount++;
              }
            });
          });

          console.log(`Успешно вставлено ${pastedCount} ячеек из внешнего источника`);
        } else {
          console.log('Нет данных для вставки');
        }
      } catch (error) {
        console.error('Ошибка вставки из внешнего источника:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('paste', handlePaste, true); // Используем capture фазу
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [selectedCell, editingCell, selectedRange, userPermissions, sheet, clipboard]);

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

  const handleCellClick = (row: number, column: number, e?: React.MouseEvent) => {
    // Предотвращаем выделение текста
    if (e) {
      e.preventDefault();
    }

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
    // Начинаем операцию выделения диапазона
    setIsDragging(true);
    setDragStart({ row, column });
    setSelectedCell({ row, column });
    setSelectedRange({ startRow: row, endRow: row, startColumn: column, endColumn: column });
    setEditingCell(null);
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
        setEditValue('');
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
        setEditValue('');
      }
    } else if (e.key === 'Escape') {
      // Отменяем редактирование без сохранения
      e.preventDefault();
      e.stopPropagation();
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleEditBlur = () => {
    // Автосохранение при потере фокуса
    if (editingCell && editValue !== undefined && editValue !== null) {
      console.log('Автосохранение ячейки при потере фокуса:', editingCell, 'значение:', editValue);
      
      // Получаем текущее значение ячейки для сравнения
      const key = getCellKey(editingCell.row, editingCell.column);
      const existingCell = cells.get(key);
      const currentValue = existingCell?.formula || existingCell?.value || '';
      
      // Сохраняем только если значение действительно изменилось
      if (editValue !== currentValue) {
        saveCellWithFormula(editingCell.row, editingCell.column, editValue);
        console.log('Значение изменилось, сохраняем');
      } else {
        console.log('Значение не изменилось, не сохраняем');
      }
      
      setEditingCell(null);
      setEditValue('');
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

  // Функция копирования выделенных ячеек
  const copySelectedCells = () => {
    if (!selectedRange) return;

    const clipboardData = new Map<string, CellData>();
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
        const key = getCellKey(row, col);
        const cell = cells.get(key);
        
        if (cell) {
          const relativeKey = getCellKey(
            row - selectedRange.startRow, 
            col - selectedRange.startColumn
          );
          clipboardData.set(relativeKey, { ...cell });
        }
      }
    }

    setClipboard({
      data: clipboardData,
      range: { ...selectedRange },
      operation: 'copy'
    });

    // Также копируем в системный буфер обмена в формате TSV
    const textData = [];
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      const rowData = [];
      for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
        const value = getCellValue(row, col);
        rowData.push(value);
      }
      textData.push(rowData.join('\t'));
    }
    
    navigator.clipboard.writeText(textData.join('\n')).catch(console.error);
  };

  // Функция вырезания выделенных ячеек
  const cutSelectedCells = () => {
    if (!selectedRange || userPermissions === 'read') return;

    const clipboardData = new Map<string, CellData>();
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
        const key = getCellKey(row, col);
        const cell = cells.get(key);
        
        if (cell) {
          const relativeKey = getCellKey(
            row - selectedRange.startRow, 
            col - selectedRange.startColumn
          );
          clipboardData.set(relativeKey, { ...cell });
        }
      }
    }

    setClipboard({
      data: clipboardData,
      range: { ...selectedRange },
      operation: 'cut'
    });

    // Очищаем вырезанные ячейки
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
        setCellValue(row, col, '');
      }
    }
  };

  // Функция вставки из буфера обмена
  const pasteClipboard = async () => {
    if (!selectedCell || userPermissions === 'read') return;

    try {
      // Сначала пытаемся вставить из внутреннего буфера
      if (clipboard) {
        const startRow = selectedCell.row;
        const startCol = selectedCell.column;

        clipboard.data.forEach((cellData, relativeKey) => {
          const [relRow, relCol] = relativeKey.split('-').map(Number);
          const targetRow = startRow + relRow;
          const targetCol = startCol + relCol;

          // Проверяем границы таблицы
          if (targetRow < (sheet.rowCount || 100) && targetCol < (sheet.columnCount || 26)) {
            setCellValue(targetRow, targetCol, cellData.value, cellData.formula);
            
            // Если есть форматирование, применяем его
            if (cellData.format) {
              handleCellFormat(targetRow, targetCol, cellData.format);
            }
          }
        });

        // Если это была операция вырезания, очищаем буфер
        if (clipboard.operation === 'cut') {
          setClipboard(null);
        }

        return;
      }

      // Иначе пытаемся вставить из системного буфера обмена
      const text = await navigator.clipboard.readText();
      if (text) {
        const rows = text.split('\n');
        const startRow = selectedCell.row;
        const startCol = selectedCell.column;

        rows.forEach((rowText, rowIndex) => {
          const cells = rowText.split('\t');
          cells.forEach((cellText, colIndex) => {
            const targetRow = startRow + rowIndex;
            const targetCol = startCol + colIndex;

            if (targetRow < (sheet.rowCount || 100) && targetCol < (sheet.columnCount || 26)) {
              setCellValue(targetRow, targetCol, cellText.trim());
            }
          });
        });
      }
    } catch (error) {
      console.error('Ошибка вставки из буфера обмена:', error);
    }
  };

  // Функция применения форматирования к отдельной ячейке
  const handleCellFormat = async (row: number, column: number, format: any) => {
    try {
      await cellsApi.formatCells(sheet.id, format, row, row, column, column);

      // Обновляем локальное состояние
      const key = getCellKey(row, column);
      const newCells = new Map(cells);
      const existingCell = newCells.get(key);
      const updatedFormat = { ...existingCell?.format, ...format };
      
      if (existingCell) {
        newCells.set(key, { ...existingCell, format: updatedFormat });
      } else {
        newCells.set(key, {
          row,
          column,
          value: '',
          format: updatedFormat
        });
      }
      setCells(newCells);
    } catch (error) {
      console.error('Ошибка применения форматирования к ячейке:', error);
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

  const isInClipboardRange = (row: number, column: number): boolean => {
    if (!clipboard || clipboard.operation !== 'copy') return false;
    const range = clipboard.range;
    return row >= range.startRow && row <= range.endRow &&
           column >= range.startColumn && column <= range.endColumn;
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
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
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
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
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
        const isInClipboard = isInClipboardRange(row, col);
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
            isInClipboard={isInClipboard}
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
      <Paper 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          outline: 'none', // Убираем стандартный outline при фокусе
          '&:focus': {
            outline: 'none'
          }
        }} 
        onMouseUp={handleMouseUp}
        tabIndex={0} // Делаем Paper фокусируемым для клавиатурной навигации
        onFocus={() => {
          // Если нет выделенной ячейки, выбираем первую
          if (!selectedCell) {
            setSelectedCell({ row: 0, column: 0 });
            setSelectedRange({ startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 });
          }
          console.log('Таблица получила фокус');
        }}
        onMouseDown={(e) => {
          // Убеждаемся что таблица получает фокус при клике
          e.currentTarget.focus();
        }}
        onPaste={(e) => {
          // Дополнительная обработка paste на уровне таблицы
          console.log('Paste событие на уровне таблицы');
          if (selectedCell && !editingCell && userPermissions !== 'read') {
            e.preventDefault();
            // Событие будет обработано глобальным обработчиком
          }
        }}
      >
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