import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Box, Paper, TextField } from '@mui/material';
import { cellsApi, sheetsExtendedApi, sheetsApi } from '../../services/api';
import api from '../../services/api';
import Cell from './Cell';
import FormatToolbar from './FormatToolbar';
import CellHistoryDialog from './CellHistoryDialog';
import { FormulaEngine } from '../../utils/formulaEngine';
import { debounce } from 'lodash';
import { chunkCells, delay, BatchDebouncer, CellUpdate, BATCH_SIZE, BATCH_DELAY } from '../../utils/batchRequests';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SortIcon from '@mui/icons-material/Sort';
import { styled } from '@mui/material/styles';
// @ts-ignore
import * as XLSX from 'xlsx';
// ExcelJS для экспорта с форматированием
// @ts-ignore
import ExcelJS from 'exceljs';
import { Button, Stack } from '@mui/material';

interface SpreadsheetProps {
  sheet: any;
  userPermissions: string;
  reportDate?: string;
}

interface CellData {
  id?: number;
  sheetId?: number;
  row: number;
  column: number;
  value?: string;
  formula?: string;
  format?: any;
}

interface CellSelection {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

// Константы для виртуализации
const ROW_HEIGHT_DEFAULT = 30;
const HEADER_HEIGHT = 30;
const BUFFER_SIZE = 5; // Количество строк выше и ниже видимой области

// Фиксированные ширины столбцов для шаблона "Отчет заселения/выселения DMD Cottage"
const DMD_COTTAGE_FIXED_COLUMN_WIDTHS: { [key: number]: number } = {
  1: 94,   // Статус дома
  // 4: 120, // Комментарий
  9: 104,  // Дата выселения
  10: 74,  // Кол-во дней
  11: 81,  // Общая сумма
  12: 113,  // Предоплата
  13: 85   // Доплата
};

const Spreadsheet: React.FC<SpreadsheetProps> = ({ sheet, userPermissions, reportDate }) => {
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
  
  // Состояние для сортировки
  const [sortConfig, setSortConfig] = useState<{
    column: number;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Инициализация размеров из settings при загрузке таблицы
  useEffect(() => {
    if (sheet?.settings) {
      const { columnSizes: savedColumnSizes = {}, rowSizes: savedRowSizes = {} } = sheet.settings;
      console.log('🔄 Загружаем размеры из settings:', { savedColumnSizes, savedRowSizes });
      setColumnSizes(savedColumnSizes);
      setRowSizes(savedRowSizes);
    }
  }, [sheet?.settings]);
  
  // Дополнительная инициализация при первой загрузке sheet
  useEffect(() => {
    if (sheet && sheet.id) {
      console.log('📊 Инициализация таблицы:', sheet.name, 'ID:', sheet.id);
      console.log('⚙️ Settings таблицы:', sheet.settings);
    }
  }, [sheet]);
  
  // Состояние для буфера обмена
  const [clipboard, setClipboard] = useState<{
    data: Map<string, CellData>;
    range: CellSelection;
    operation: 'copy' | 'cut';
  } | null>(null);

  // Состояние для виртуализации
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  
  // Состояние для принудительного перерендера после сортировки
  const [renderKey, setRenderKey] = useState(0);

  // Дебаунсированная функция для обновления выделения (оптимизация производительности)
  const debouncedUpdateSelection = useMemo(
    () => debounce((startRow: number, endRow: number, startColumn: number, endColumn: number) => {
      setSelectedRange({ startRow, endRow, startColumn, endColumn });
    }, 16), // ~60fps
    []
  );

  // Дебаунсированная функция для обновления позиции скролла
  const debouncedScrollUpdate = useMemo(
    () => debounce((scrollTop: number) => {
      setScrollTop(scrollTop);
    }, 16), // ~60fps
    []
  );

  // Функции для виртуализации
  const getRowHeight = (row: number): number => {
    return rowSizes[row] || ROW_HEIGHT_DEFAULT;
  };

  // Рассчитываем общую высоту всех строк
  const getTotalHeight = useCallback(() => {
    const rowCount = sheet.rowCount || 100;
    let total = 0;
    for (let i = 0; i < rowCount; i++) {
      total += getRowHeight(i);
    }
    return total;
  }, [sheet.rowCount, rowSizes]);

  // Рассчитываем видимые строки на основе позиции скролла
  const getVisibleRows = useCallback(() => {
    const rowCount = sheet.rowCount || 100;
    
    if (containerHeight === 0) {
      return { startRow: 0, endRow: Math.min(20, rowCount - 1) }; // Показываем первые 20 строк по умолчанию
    }

    let currentHeight = 0;
    let startRow = 0;
    let endRow = 0;

    // Находим первую видимую строку
    for (let i = 0; i < rowCount; i++) {
      const rowHeight = getRowHeight(i);
      if (currentHeight + rowHeight > scrollTop) {
        startRow = Math.max(0, i - BUFFER_SIZE);
        break;
      }
      currentHeight += rowHeight;
    }

    // Находим последнюю видимую строку
    currentHeight = 0;
    for (let i = 0; i < rowCount; i++) {
      currentHeight += getRowHeight(i);
      if (currentHeight > scrollTop + containerHeight + BUFFER_SIZE * ROW_HEIGHT_DEFAULT) {
        endRow = Math.min(i, rowCount - 1);
        break;
      }
    }

    if (endRow === 0) endRow = rowCount - 1;

    return { startRow, endRow };
  }, [scrollTop, containerHeight, sheet.rowCount, rowSizes]);

  // Рассчитываем offset для первой видимой строки
  const getRowOffset = useCallback((targetRow: number) => {
    let offset = 0;
    for (let i = 0; i < targetRow; i++) {
      offset += getRowHeight(i);
    }
    return offset;
  }, [rowSizes]);

  // Детекция конкретного шаблона отчета DMD Cottage
  const isDMDCottageReport = useMemo(() => {
    return sheet?.template?.name === 'Отчет заселения/выселения DMD Cottage' ||
           sheet?.template?.name?.includes('Отчет заселения/выселения DMD Cottage');
  }, [sheet?.template?.name]);

  // Автоматический расчет доплаты для отчета DMD Cottage
  const calculateDoplataForReport = useCallback(async () => {
    if (!isDMDCottageReport || !sheet?.id) return;
    if (isSortingInProgressRef.current) {
      console.log('🚫 Пропускаем расчет доплаты - идет автосортировка');
      return;
    }

    console.log('💰 Запуск автоматического расчета доплаты для отчета DMD Cottage');
    
    const updatedCells = new Map(cells);
    const cellsToUpdate: Array<{row: number, column: number, value: string}> = [];
    
    // Проходим по всем строкам начиная с 2-й (0 - дата отчета, 1 - заголовки)
    for (let row = 2; row < 100; row++) {
      const totalAmountKey = `${row}-11`; // Общая сумма (колонка 11)
      const prepaymentKey = `${row}-12`;  // Предоплата (колонка 12)
      const doplataKey = `${row}-13`;     // Доплата (колонка 13)
      
      const totalAmountCell = updatedCells.get(totalAmountKey);
      const prepaymentCell = updatedCells.get(prepaymentKey);
      
      // Если есть данные в общей сумме или предоплате, рассчитываем доплату
      if (totalAmountCell?.value || prepaymentCell?.value) {
        const totalAmount = parseFloat(totalAmountCell?.value?.toString().replace(/[^\d.-]/g, '') || '0');
        const prepayment = parseFloat(prepaymentCell?.value?.toString().replace(/[^\d.-]/g, '') || '0');
        const calculatedDoplata = totalAmount - prepayment;
        
        // Обновляем ячейку доплаты только если значение изменилось
        const currentDoplata = updatedCells.get(doplataKey);
        const currentDoplataValue = parseFloat(currentDoplata?.value?.toString().replace(/[^\d.-]/g, '') || '0');
        
        if (Math.abs(calculatedDoplata - currentDoplataValue) > 0.01) { // Учитываем погрешность
          console.log(`💰 Расчет доплаты для строки ${row}: ${totalAmount} - ${prepayment} = ${calculatedDoplata}`);
          
          // Обновляем локальное состояние
          const updatedCell = {
            id: currentDoplata?.id || undefined,
            sheetId: sheet.id,
            row,
            column: 13,
            value: calculatedDoplata.toString(),
            format: currentDoplata?.format || null,
            formula: undefined
          };
          
          updatedCells.set(doplataKey, updatedCell);
          cellsToUpdate.push({
            row,
            column: 13,
            value: calculatedDoplata.toString()
          });
        }
      }
    }
    
    // Обновляем состояние ячеек
    if (cellsToUpdate.length > 0) {
      setCells(updatedCells);
      
      // Отправляем обновления на сервер
      if (cellsToUpdate.length > 0) {
        try {
          console.log(`💰 Сохраняем ${cellsToUpdate.length} ячеек доплаты`);
          for (const cellUpdate of cellsToUpdate) {
            await cellsApi.updateCell(sheet.id, cellUpdate.row, cellUpdate.column, {
              value: cellUpdate.value
            });
          }
          console.log(`💰 Обновлено ${cellsToUpdate.length} ячеек с доплатой`);
        } catch (error) {
          console.error('❌ Ошибка при обновлении ячеек доплаты:', error);
        }
      }
    }
  }, [isDMDCottageReport, sheet?.id, cells]);

  // Загрузка ячеек при инициализации
  useEffect(() => {
    if (sheet?.cells) {
      // Не перезагружаем ячейки если уже была выполнена автосортировка
      if (isDMDCottageReport && hasAutoSortedRef.current) {
        console.log('🚫 Пропускаем перезагрузку ячеек - автосортировка уже выполнена');
        return;
      }
      
      const cellsMap = new Map<string, CellData>();
      sheet.cells.forEach((cell: any) => {
        const key = `${cell.row}-${cell.column}`;
        cellsMap.set(key, cell);
      });
      setCells(cellsMap);
      
      // Сбрасываем флаг автосортировки при перезагрузке данных только если это не автосортировка
      if (isDMDCottageReport && !hasAutoSortedRef.current) {
        hasAutoSortedRef.current = false;
      }
    }
  }, [sheet, isDMDCottageReport]);

  // Автоматический расчет доплаты после загрузки данных
  useEffect(() => {
    if (isDMDCottageReport && cells.size > 0) {
      // Небольшая задержка для завершения других операций
      const timer = setTimeout(() => {
        calculateDoplataForReport();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isDMDCottageReport, cells.size, calculateDoplataForReport]);

  // Дебаунсированный пересчет доплаты при изменении даты отчета
  const debouncedCalculateDoplata = useMemo(
    () => debounce(() => {
      if (isDMDCottageReport && !isSortingInProgressRef.current) {
        console.log('📅 Дата отчета изменилась, пересчитываем доплату');
        calculateDoplataForReport();
      } else if (isSortingInProgressRef.current) {
        console.log('🚫 Пропускаем пересчет доплаты - идет автосортировка');
      }
    }, 2000), // Увеличиваем задержку до 2 секунд
    [isDMDCottageReport, calculateDoplataForReport]
  );

  // Пересчет доплаты при изменении даты отчета
  useEffect(() => {
    if (isDMDCottageReport && reportDate && cells.size > 0) {
      debouncedCalculateDoplata();
    }
    
    return () => {
      debouncedCalculateDoplata.cancel();
    };
  }, [isDMDCottageReport, reportDate, cells.size, debouncedCalculateDoplata]);

  // Загрузка размеров из настроек таблицы
  useEffect(() => {
    // Загружаем размеры из настроек таблицы
    if (sheet?.settings) {
      const columnSizes = sheet.settings.columnSizes || {};
      const rowSizes = sheet.settings.rowSizes || {};
      console.log('📏 Загружаем размеры из настроек таблицы:', { columnSizes, rowSizes });
      setColumnSizes(columnSizes);
      setRowSizes(rowSizes);
    } else {
      console.log('⚠️ Настройки таблицы отсутствуют, используем размеры по умолчанию');
      setColumnSizes({});
      setRowSizes({});
    }
  }, [sheet]);

  // Обновление размеров контейнера
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Обработчик скролла
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    debouncedScrollUpdate(target.scrollTop);
  }, [debouncedScrollUpdate]);

  // Функция для прокрутки к определенной ячейке
  const scrollToCell = useCallback((row: number) => {
    if (!containerRef.current) return;

    const targetOffset = getRowOffset(row);
    const containerHeight = containerRef.current.clientHeight;
    const rowHeight = getRowHeight(row);

    // Проверяем, видна ли ячейка
    const isVisible = targetOffset >= scrollTop && 
                     targetOffset + rowHeight <= scrollTop + containerHeight;

    if (!isVisible) {
      // Прокручиваем так, чтобы ячейка была видна
      let newScrollTop;
      if (targetOffset < scrollTop) {
        // Ячейка выше видимой области
        newScrollTop = targetOffset - BUFFER_SIZE * ROW_HEIGHT_DEFAULT;
      } else {
        // Ячейка ниже видимой области
        newScrollTop = targetOffset - containerHeight + rowHeight + BUFFER_SIZE * ROW_HEIGHT_DEFAULT;
      }

      containerRef.current.scrollTop = Math.max(0, newScrollTop);
    }
  }, [getRowOffset, getRowHeight, scrollTop]);

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
            scrollToCell(newRow);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (selectedCell.row < maxRows - 1) {
            const newRow = selectedCell.row + 1;
            setSelectedCell({ row: newRow, column: selectedCell.column });
            setSelectedRange({ startRow: newRow, endRow: newRow, startColumn: selectedCell.column, endColumn: selectedCell.column });
            scrollToCell(newRow);
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
          if (userPermissions !== 'read') {
            // Проверяем что есть выделенные ячейки
            if (selectedRange) {
              console.log('Удаляем содержимое диапазона:', selectedRange);
              
              // Создаем новую копию cells Map и удаляем все ячейки сразу
              const newCells = new Map(cells);
              let deletedCount = 0;
              
              for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
                for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
                  const key = getCellKey(row, col);
                  const existingCell = newCells.get(key);
                  
                  if (existingCell && existingCell.value !== '') {
                    // Создаем новую ячейку с пустым значением
                    const clearedCell: CellData = {
                      ...existingCell,
                      value: '',
                      formula: undefined
                    };
                    newCells.set(key, clearedCell);
                    deletedCount++;
                    
                    // Сохраняем в backend
                    debouncedSaveCell(row, col, '');
                    console.log(`Очищена ячейка [${row}, ${col}]`);
                  }
                }
              }
              
              // Обновляем состояние одним вызовом
              setCells(newCells);
              console.log(`Очищено ${deletedCount} ячеек`);
            } else if (selectedCell) {
              // Если выделена только одна ячейка
              console.log('Удаляем содержимое одной ячейки:', selectedCell);
              setCellValue(selectedCell.row, selectedCell.column, '');
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
          console.log('Вставляем данные из внешнего источника:', textData);
          
          // Разбираем данные по строкам и столбцам
          const rows = textData.split(/\r?\n/).filter(row => row.trim() !== '');
          const startRow = selectedCell.row;
          const startCol = selectedCell.column;

          let pastedCount = 0;
          
          // Создаем новую копию cells Map для массового обновления
          const newCells = new Map(cells);
          
          rows.forEach((rowText, rowIndex) => {
            console.log(`Обрабатываем строку ${rowIndex}: "${rowText}"`);
            
            // Пытаемся разделить по разным разделителям
            let cellValues = [];
            
            // Пробуем табуляцию (TSV) - приоритет
            if (rowText.includes('\t')) {
              cellValues = rowText.split('\t');
              console.log('Разделено по табуляции:', cellValues);
            } 
            // Пробуем запятую (CSV)
            else if (rowText.includes(',') && !rowText.includes(';')) {
              cellValues = rowText.split(',');
              console.log('Разделено по запятой:', cellValues);
            }
            // Пробуем точку с запятой
            else if (rowText.includes(';')) {
              cellValues = rowText.split(';');
              console.log('Разделено по точке с запятой:', cellValues);
            }
            // Если разделителей нет, считаем одной ячейкой
            else {
              cellValues = [rowText];
              console.log('Без разделителей, одна ячейка:', cellValues);
            }

            cellValues.forEach((cellText, colIndex) => {
              const targetRow = startRow + rowIndex;
              const targetCol = startCol + colIndex;

              console.log(`Вставляем в позицию [${targetRow}, ${targetCol}] значение: "${cellText}"`);

              if (targetRow < (sheet.rowCount || 100) && targetCol < (sheet.columnCount || 26)) {
                // Очищаем от кавычек и пробелов
                const cleanValue = cellText.replace(/^["']|["']$/g, '').trim();
                console.log(`Очищенное значение: "${cleanValue}"`);
                
                // Обновляем ячейку в Map
                const key = getCellKey(targetRow, targetCol);
                const existingCell = newCells.get(key);
                
                const updatedCell: CellData = {
                  row: targetRow,
                  column: targetCol,
                  value: cleanValue,
                  formula: existingCell?.formula,
                  format: existingCell?.format,
                };
                
                newCells.set(key, updatedCell);
                pastedCount++;
                
                // Сохраняем в backend
                debouncedSaveCell(targetRow, targetCol, cleanValue);
              } else {
                console.log(`Позиция [${targetRow}, ${targetCol}] за пределами таблицы`);
              }
            });
          });
          
          // Обновляем состояние одним вызовом
          setCells(newCells);

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

  // Функция немедленного сохранения ячейки (для массовых операций)
  const saveCell = useCallback(async (row: number, column: number, value: string, formula?: string) => {
    if (userPermissions === 'read') return;
    
    try {
      await cellsApi.updateCell(sheet.id, row, column, {
        value,
        formula: formula || undefined,
      });
      console.log(`Ячейка [${row}, ${column}] сохранена немедленно: "${value}"`);
    } catch (error) {
      console.error('Ошибка немедленного сохранения ячейки:', error);
    }
  }, [sheet.id, userPermissions]);

  // Функция пакетного сохранения ячеек (оптимизированная для больших объемов)
  const saveCellsBatchOptimized = useCallback(async (cellsToSave: CellUpdate[]) => {
    if (userPermissions === 'read' || cellsToSave.length === 0) return;
    
    try {
      console.log(`🚀 Начинаем пакетное сохранение ${cellsToSave.length} ячеек`);
      
      // Разбиваем на пакеты по BATCH_SIZE
      const batches = chunkCells(cellsToSave, BATCH_SIZE);
      console.log(`📦 Разбито на ${batches.length} пакетов по ${BATCH_SIZE} ячеек`);
      
      let totalProcessed = 0;
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Обрабатываем пакет ${i + 1}/${batches.length} (${batch.length} ячеек)`);
        
        try {
          await cellsApi.updateCellsBatchOptimized(sheet.id, batch);
          totalProcessed += batch.length;
          
          // Задержка между пакетами (кроме последнего)
          if (i < batches.length - 1) {
            await delay(BATCH_DELAY);
          }
        } catch (batchError) {
          console.error(`❌ Ошибка в пакете ${i + 1}:`, batchError);
          // Продолжаем обработку следующих пакетов
        }
      }
      
      console.log(`✅ Пакетное сохранение завершено: ${totalProcessed}/${cellsToSave.length} ячеек`);
    } catch (error) {
      console.error('Ошибка пакетного сохранения ячеек:', error);
    }
  }, [sheet.id, userPermissions]);

  // Функция массового сохранения ячеек (для операций вставки) - оставляем для совместимости
  const saveCellsBatch = useCallback(async (cellsToSave: Array<{
    row: number;
    column: number;
    value?: string;
    formula?: string;
  }>) => {
    // Конвертируем в формат CellUpdate и используем оптимизированную функцию
    const cellUpdates: CellUpdate[] = cellsToSave.map(cell => ({
      row: cell.row,
      column: cell.column,
      value: cell.value,
      formula: cell.formula
    }));
    
    await saveCellsBatchOptimized(cellUpdates);
  }, [saveCellsBatchOptimized]);

  const getCellKey = (row: number, column: number) => `${row}-${column}`;

  const getCellValue = (row: number, column: number): string => {
    const key = getCellKey(row, column);
    const cell = cells.get(key);
    if (!cell) return '';
    
    // Если ячейка содержит формулу, вычисляем и отображаем результат
    if (cell.formula && cell.formula.startsWith('=')) {
        const engine = new FormulaEngine(cells);
      const result = engine.evaluate(cell.formula);
      let out = result.toString();
      // Отчет: значения в колонке A (0) начиная с 3-й строки — UPPER CASE
      if (sheet?.templateId === 2 && column === 0 && row >= 2) {
        out = out.toString().toUpperCase();
      }
      return out;
      }
    
    let out = cell.value || '';
    // Отчет: значения в колонке A (0) начиная с 3-й строки — UPPER CASE
    if (sheet?.templateId === 2 && column === 0 && row >= 2) {
      out = out.toUpperCase();
    }
    return out;
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

    // Автоматический расчет доплаты в журнале заселения
    if (sheet.name?.includes('Журнал заселения')) {
      calculateAdditionalPayment(newCells, row, column);
    }

    // Сохраняем в backend только если есть изменения
    debouncedSaveCell(row, column, value, formula);
  };

  // Функция автоматического расчета доплаты (общая сумма - предоплата)
  const calculateAdditionalPayment = (cellsMap: Map<string, CellData>, row: number, column: number) => {
    // Проверяем, что изменили столбец "Общая сумма" (6) или "Предоплата" (7)
    if (column === 6 || column === 7) {
      const totalAmountKey = getCellKey(row, 6); // Общая сумма
      const prepaymentKey = getCellKey(row, 7);  // Предоплата
      const additionalPaymentKey = getCellKey(row, 8); // Доплата
      
      const totalAmount = cellsMap.get(totalAmountKey)?.value || '';
      const prepayment = cellsMap.get(prepaymentKey)?.value || '';
      
      if (totalAmount && prepayment) {
        // Очищаем значения от пробелов и запятых для расчета
        const totalNum = parseFloat(totalAmount.replace(/[\s,]/g, '').replace(',', '.'));
        const prepaymentNum = parseFloat(prepayment.replace(/[\s,]/g, '').replace(',', '.'));
        
        if (!isNaN(totalNum) && !isNaN(prepaymentNum)) {
          const additionalPayment = totalNum - prepaymentNum;
          
          // Форматируем результат с пробелами для тысяч
          const formattedValue = additionalPayment.toLocaleString('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
          
          // Устанавливаем значение доплаты
          cellsMap.set(additionalPaymentKey, { 
            row, 
            column: 8, 
            value: formattedValue 
          });
          
          // Сохраняем в базу данных асинхронно
          setTimeout(async () => {
            try {
              await cellsApi.updateCell(sheet.id, row, 8, {
                value: formattedValue
              });
              console.log(`✅ Автоматически рассчитана доплата: ${formattedValue} (общая: ${totalAmount}, предоплата: ${prepayment})`);
            } catch (error) {
              console.error('❌ Ошибка сохранения автоматически рассчитанной доплаты:', error);
            }
          }, 100);
        }
      }
    }
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

    // ✅ ДОБАВЛЕНО: Специальная логика для поля "Статус дома"
    const isHouseStatusField = sheet.name?.includes('Журнал заселения') && column === 9 && row > 0;
    
    // Если кликнули на уже выбранную ячейку - начинаем редактирование
    if (selectedCell && selectedCell.row === row && selectedCell.column === column) {
      setEditingCell({ row, column });
      
      // Для редактирования показываем формулу, если есть, иначе значение
      const key = getCellKey(row, column);
      const cell = cells.get(key);
      const editableValue = cell?.formula || cell?.value || '';
      setEditValue(editableValue);
    } 
    // ✅ ДОБАВЛЕНО: Для поля статуса дома сразу активируем режим редактирования
    else if (isHouseStatusField) {
      setSelectedCell({ row, column });
      setSelectedRange({ startRow: row, endRow: row, startColumn: column, endColumn: column });
      setEditingCell({ row, column });
      
      // Для редактирования показываем текущее значение
      const key = getCellKey(row, column);
      const cell = cells.get(key);
      const editableValue = cell?.formula || cell?.value || '';
      setEditValue(editableValue);
    } 
    else {
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
      
      // Используем дебаунсированную функцию для плавного выделения
      debouncedUpdateSelection(startRow, endRow, startColumn, endColumn);
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
    const newCells = new Map(cells);
    // Массив для сбора всех ячеек для массового сохранения
    const cellsToSave: Array<{row: number; column: number; value: string}> = [];
    
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
        const key = getCellKey(row, col);
        const existingCell = newCells.get(key);
        
        if (existingCell) {
          const clearedCell: CellData = {
            ...existingCell,
            value: '',
            formula: undefined
          };
          newCells.set(key, clearedCell);
          
          // Добавляем в массив для массового сохранения
          cellsToSave.push({
            row: row,
            column: col,
            value: ''
          });
        }
      }
    }
    
    // Обновляем состояние одним вызовом
    setCells(newCells);
    
    // Массово сохраняем все очищенные ячейки одним запросом
    if (cellsToSave.length > 0) {
      saveCellsBatch(cellsToSave);
    }
  };

  // Функция вставки из буфера обмена
  const pasteClipboard = async () => {
    if (!selectedCell || userPermissions === 'read') return;

    try {
      // Сначала проверяем системный буфер обмена (приоритет для внешних данных)
      const text = await navigator.clipboard.readText();
      if (text) {
        console.log('Вставляем из системного буфера:', text);
        
        // Разбираем данные по строкам и столбцам
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        const startRow = selectedCell.row;
        const startCol = selectedCell.column;

        let pastedCount = 0;
        
        // Создаем новую копию cells Map для массового обновления
        const newCells = new Map(cells);
        // Массив для сбора всех ячеек для массового сохранения
        const cellsToSave: Array<{row: number; column: number; value: string; formula?: string}> = [];

        rows.forEach((rowText, rowIndex) => {
          console.log(`Обрабатываем строку ${rowIndex}: "${rowText}"`);
          
          // Пытаемся разделить по разным разделителям
          let cellValues = [];
          
          // Пробуем табуляцию (TSV) - приоритет
          if (rowText.includes('\t')) {
            cellValues = rowText.split('\t');
            console.log('Разделено по табуляции:', cellValues);
          } 
          // Пробуем запятую (CSV)
          else if (rowText.includes(',') && !rowText.includes(';')) {
            cellValues = rowText.split(',');
            console.log('Разделено по запятой:', cellValues);
          }
          // Пробуем точку с запятой
          else if (rowText.includes(';')) {
            cellValues = rowText.split(';');
            console.log('Разделено по точке с запятой:', cellValues);
          }
          // Если разделителей нет, считаем одной ячейкой
          else {
            cellValues = [rowText];
            console.log('Без разделителей, одна ячейка:', cellValues);
          }

          cellValues.forEach((cellText, colIndex) => {
            const targetRow = startRow + rowIndex;
            const targetCol = startCol + colIndex;

            console.log(`Вставляем в позицию [${targetRow}, ${targetCol}] значение: "${cellText}"`);

            if (targetRow < (sheet.rowCount || 100) && targetCol < (sheet.columnCount || 26)) {
              // Очищаем от кавычек и пробелов
              const cleanValue = cellText.replace(/^["']|["']$/g, '').trim();
              console.log(`Очищенное значение: "${cleanValue}"`);
              
              // Обновляем ячейку в Map
              const key = getCellKey(targetRow, targetCol);
              const existingCell = newCells.get(key);
              
              const updatedCell: CellData = {
                row: targetRow,
                column: targetCol,
                value: cleanValue,
                formula: existingCell?.formula,
                format: existingCell?.format,
              };
              
              newCells.set(key, updatedCell);
              pastedCount++;
              
              // Добавляем в массив для массового сохранения
              cellsToSave.push({
                row: targetRow,
                column: targetCol,
                value: cleanValue
              });
            } else {
              console.log(`Позиция [${targetRow}, ${targetCol}] за пределами таблицы`);
            }
          });
        });
        
        // Обновляем состояние одним вызовом
        setCells(newCells);
        
        // Массово сохраняем все ячейки одним запросом
        if (cellsToSave.length > 0) {
          saveCellsBatch(cellsToSave);
        }

        console.log(`Успешно вставлено ${pastedCount} ячеек из системного буфера`);
        return; // Выходим, если успешно вставили из системного буфера
      }

      // Если в системном буфере нет данных, пытаемся использовать внутренний буфер
      if (clipboard) {
        console.log('Вставляем из внутреннего буфера:', clipboard);
        const startRow = selectedCell.row;
        const startCol = selectedCell.column;

        // Создаем новую копию cells Map для массового обновления
        const newCells = new Map(cells);
        let pastedCount = 0;
        // Массив для сбора всех ячеек для массового сохранения
        const cellsToSave: Array<{row: number; column: number; value: string; formula?: string}> = [];
        
        clipboard.data.forEach((cellData, relativeKey) => {
          const [relRow, relCol] = relativeKey.split('-').map(Number);
          const targetRow = startRow + relRow;
          const targetCol = startCol + relCol;

          console.log(`Вставляем из буфера в позицию [${targetRow}, ${targetCol}]:`, cellData.value);

          // Проверяем границы таблицы
          if (targetRow < (sheet.rowCount || 100) && targetCol < (sheet.columnCount || 26)) {
            const key = getCellKey(targetRow, targetCol);
            
            const updatedCell: CellData = {
              row: targetRow,
              column: targetCol,
              value: cellData.value,
              formula: cellData.formula,
              format: cellData.format,
            };
            
            newCells.set(key, updatedCell);
            pastedCount++;
            
            // Добавляем в массив для массового сохранения
            cellsToSave.push({
              row: targetRow,
              column: targetCol,
              value: cellData.value || '',
              formula: cellData.formula
            });
            
            // Если есть форматирование, применяем его
            if (cellData.format) {
              handleCellFormat(targetRow, targetCol, cellData.format);
            }
          }
        });

        // Обновляем состояние одним вызовом
        setCells(newCells);
        
        // Массово сохраняем все ячейки одним запросом
        if (cellsToSave.length > 0) {
          saveCellsBatch(cellsToSave);
        }
        console.log(`Успешно вставлено ${pastedCount} ячеек из внутреннего буфера`);

        // Если это была операция вырезания, очищаем буфер
        if (clipboard.operation === 'cut') {
          setClipboard(null);
        }
      } else {
        console.log('Нет данных в буферах обмена');
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

      // Автоматическая подстройка высоты строки при включении переноса текста
      if (format.textWrap === 'wrap') {
        for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
          // Рассчитываем оптимальную высоту на основе содержимого ячеек в строке
          let maxRequiredHeight = ROW_HEIGHT_DEFAULT;
          
          for (let col = selectedRange.startColumn; col <= selectedRange.endColumn; col++) {
            const cellValue = getCellValue(row, col);
            const columnWidth = getColumnWidth(col);
            
            if (cellValue && cellValue.length > 0) {
              // Простой алгоритм расчета высоты: 
              // ~10 символов на 100px ширины = 1 строка текста
              // каждая строка текста ~20px высоты
              const charWidth = 8; // примерная ширина символа в пикселях
              const charsPerLine = Math.floor((columnWidth - 16) / charWidth); // -16px для padding
              const linesNeeded = Math.ceil(cellValue.length / charsPerLine);
              const lineHeight = 20; // высота одной строки текста
              const requiredHeight = Math.max(ROW_HEIGHT_DEFAULT, linesNeeded * lineHeight + 8); // +8px padding
              
              maxRequiredHeight = Math.max(maxRequiredHeight, requiredHeight);
            }
          }
          
          const currentHeight = getRowHeight(row);
          // Увеличиваем высоту минимум до 60px или до рассчитанной высоты
          const newHeight = Math.max(currentHeight, maxRequiredHeight, 60);
          
          if (newHeight !== currentHeight) {
            setRowSizes(prev => ({ ...prev, [row]: newHeight }));
            
            // Сохраняем новую высоту в backend
            try {
              await sheetsExtendedApi.resizeRow(sheet.id.toString(), row, newHeight);
              console.log(`✅ Автоматически увеличена высота строки ${row} до ${newHeight}px для переноса текста (содержимое требует ${maxRequiredHeight}px)`);
            } catch (error) {
              console.error('❌ Ошибка автоматического изменения высоты строки:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Ошибка применения форматирования:', error);
    }
  };

  const handleAddRow = async (count: number = 1) => {
    try {
      // Используем массовое добавление строк
      await sheetsExtendedApi.addRowsBatch(sheet.id.toString(), count);
      window.location.reload(); // Простое обновление страницы
    } catch (error) {
      console.error('Ошибка массового добавления строк:', error);
    }
  };

  const handleAddColumn = async (count: number = 1) => {
    try {
      // Используем массовое добавление столбцов
      await sheetsExtendedApi.addColumnsBatch(sheet.id.toString(), count);
      window.location.reload(); // Простое обновление страницы
    } catch (error) {
      console.error('Ошибка массового добавления столбцов:', error);
    }
  };

  const handleShowHistory = (row: number, column: number) => {
    setHistoryCell({ row, column });
      setHistoryDialogOpen(true);
  };

  const isInSelectedRange = useCallback((row: number, column: number): boolean => {
    if (!selectedRange) return false;
    return row >= selectedRange.startRow && row <= selectedRange.endRow &&
           column >= selectedRange.startColumn && column <= selectedRange.endColumn;
  }, [selectedRange]);

  const isInClipboardRange = useCallback((row: number, column: number): boolean => {
    if (!clipboard) return false;
    const { range } = clipboard;
    return row >= range.startRow && row <= range.endRow &&
           column >= range.startColumn && column <= range.endColumn;
  }, [clipboard]);

  const getColumnWidth = (column: number): number => {
    const width = columnSizes[column] || 100;
    // Отладочный лог только для автонастройки
    if (process.env.NODE_ENV === 'development' && columnSizes[column]) {
      console.log(`🔍 getColumnWidth(${column}) = ${width} из columnSizes:`, columnSizes);
    }
    return width;
  };

  // Функция генерации названий столбцов в правильном формате A, B, Z, AA, AB
  const generateColumnName = (columnIndex: number): string => {
    let result = '';
    let num = columnIndex + 1; // Делаем 1-based для корректного алгоритма
    
    while (num > 0) {
      num--; // Переходим к 0-based для вычисления символа
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    
    return result;
  };

  // Проверяем, является ли таблица журналом заселения
  const isJournalSheet = useMemo(() => {
    return sheet?.name?.includes('Журнал заселения') || 
           sheet?.template?.name?.includes('Журнал заселения');
  }, [sheet?.name, sheet?.template?.name]);

  // Функция сортировки данных
  const sortCells = useCallback((column: number, direction: 'asc' | 'desc') => {
    if (!isJournalSheet) return;

    // Получаем все строки с данными (исключаем заголовок - строку 0)
    const dataRows: { [row: number]: Map<number, CellData> } = {};
    
    // Группируем ячейки по строкам
    for (let row = 1; row < (sheet.rowCount || 100); row++) {
      const rowCells = new Map<number, CellData>();
      let hasData = false;
      
      for (let col = 0; col < (sheet.columnCount || 26); col++) {
        // Пропускаем колонку 15 (Примечания) для шаблона отчета при сортировке
        if (sheet?.templateId === 2 && col === 15) continue;
        
        const key = getCellKey(row, col);
        const cell = cells.get(key);
        if (cell) {
          rowCells.set(col, cell);
          hasData = true;
        }
      }
      
      if (hasData) {
        dataRows[row] = rowCells;
      }
    }

    // Преобразуем данные в массив для сортировки
    const rowsArray = Object.entries(dataRows).map(([rowStr, rowCells]) => ({
      originalRow: parseInt(rowStr),
      cells: rowCells
    }));

    // Сортируем строки по указанному столбцу
    rowsArray.sort((a, b) => {
      const aCellKey = getCellKey(a.originalRow, column);
      const bCellKey = getCellKey(b.originalRow, column);
      const aCell = cells.get(aCellKey);
      const bCell = cells.get(bCellKey);
      
      let aValue = aCell?.value || '';
      let bValue = bCell?.value || '';

      // Специальная обработка для дат (столбцы 1 и 3)
      if (column === 1 || column === 3) {
        // Преобразуем даты из формата DD.MM.YYYY в Date объекты для сортировки
        const parseDate = (dateStr: string): Date => {
          if (!dateStr || typeof dateStr !== 'string') return new Date(0);
          const match = dateStr.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
          if (match) {
            const [, day, month, year] = match;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
          return new Date(0);
        };

        const aDate = parseDate(aValue);
        const bDate = parseDate(bValue);
        
        const comparison = aDate.getTime() - bDate.getTime();
        return direction === 'asc' ? comparison : -comparison;
      }

      // Обычная сортировка для других столбцов
      if (direction === 'asc') {
        return aValue.localeCompare(bValue, 'ru', { numeric: true });
      } else {
        return bValue.localeCompare(aValue, 'ru', { numeric: true });
      }
    });

    // Создаем новую карту ячеек с пересортированными данными
    const newCells = new Map(cells);
    
    // Очищаем данные в строках (кроме заголовка)
    for (let row = 1; row < (sheet.rowCount || 100); row++) {
      for (let col = 0; col < (sheet.columnCount || 26); col++) {
        // Не очищаем колонку 15 (Примечания) для шаблона отчета, так как она скрыта
        if (sheet?.templateId === 2 && col === 15) continue;
        
        const key = getCellKey(row, col);
        newCells.delete(key);
      }
    }

    // Заполняем отсортированными данными
    rowsArray.forEach((rowData, index) => {
      const newRow = index + 1; // +1 потому что строка 0 - заголовки
      
      rowData.cells.forEach((cell, col) => {
        const newKey = getCellKey(newRow, col);
        newCells.set(newKey, {
          ...cell,
          row: newRow // Обновляем номер строки
        });
      });
    });

    setCells(newCells);
    console.log(`🔄 Отсортировано по столбцу ${column} (${direction === 'asc' ? 'по возрастанию' : 'по убыванию'})`);
  }, [cells, sheet, isJournalSheet]);

  // Обработчик клика по кнопке сортировки
  const handleSort = (column: number) => {
    if (!isJournalSheet || (column !== 1 && column !== 3)) return;

    let newDirection: 'asc' | 'desc' = 'asc';
    
    if (sortConfig?.column === column) {
      // Переключаем направление сортировки
      newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    setSortConfig({ column, direction: newDirection });
    sortCells(column, newDirection);
  };

  const renderColumnHeaders = () => {
    const headers = [];
    for (let col = 0; col < (sheet.columnCount || 26); col++) {
      // Скрываем колонки 5 (Время выселения), 8 (Время заселения), 15 (Примечания) для шаблона отчета
      if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
      
      const width = getColumnWidth(col);
      const columnName = generateColumnName(col); // Используем правильную генерацию названий
      
      // Проверяем, нужна ли кнопка сортировки для данного столбца
      const needsSortButton = isJournalSheet && (col === 1 || col === 3);
      const isSorted = sortConfig?.column === col;
      const sortDirection = isSorted ? sortConfig.direction : null;
      
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {columnName}
            {needsSortButton && (
              <Tooltip title={`Сортировать по ${col === 1 ? 'дате заселения' : 'дате выселения'}`}>
                <IconButton
                  size="small"
                  onClick={() => handleSort(col)}
                  sx={{
                    padding: '2px',
                    color: isSorted ? '#1976d2' : '#666',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    },
                  }}
                >
                  {isSorted ? (
                    sortDirection === 'asc' ? (
                      <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                    )
                  ) : (
                    <SortIcon sx={{ fontSize: 14 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
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
              let finalWidth = startWidth; // Переменная для отслеживания финальной ширины
              
              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(50, startWidth + (e.clientX - startX));
                finalWidth = newWidth; // Сохраняем актуальную ширину
                setColumnSizes(prev => ({ ...prev, [col]: newWidth }));
              };
              
              const handleMouseUp = async () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                
                try {
                  console.log(`🔧 Сохраняем ширину столбца ${col}: ${finalWidth}px в таблице ${sheet.id}`);
                  const response = await sheetsExtendedApi.resizeColumn(sheet.id.toString(), col, finalWidth);
                  console.log(`✅ Сохранена ширина столбца ${col}: ${finalWidth}px`, response);
                  
                  // Проверяем что settings действительно обновились
                  if (response?.data?.settings?.columnSizes) {
                    console.log(`📊 Обновленные размеры столбцов:`, response.data.settings.columnSizes);
                    
                    // Обновляем локальное состояние вместо перезагрузки
                    setColumnSizes(prevSizes => ({
                      ...prevSizes,
                      ...response.data.settings.columnSizes
                    }));
                  } else {
                    console.warn(`⚠️ Settings не получены в ответе:`, response);
                    
                    // Если settings не получены, попробуем перезагрузить sheet
                    // НЕ перезагружаем если была выполнена автосортировка DMD Cottage
                    if (!(isDMDCottageReport && hasAutoSortedRef.current)) {
                      try {
                        console.log(`🔄 Перезагружаем sheet для получения актуальных settings`);
                        const sheetResponse = await sheetsApi.getSheet(sheet.id.toString());
                        if (sheetResponse.data?.sheet?.settings?.columnSizes) {
                          console.log(`📊 Загружены settings из getSheet:`, sheetResponse.data.sheet.settings.columnSizes);
                          setColumnSizes(sheetResponse.data.sheet.settings.columnSizes);
                        }
                      } catch (reloadError) {
                        console.error('❌ Ошибка перезагрузки sheet:', reloadError);
                      }
                    } else {
                      console.log('🚫 Пропускаем перезагрузку sheet - автосортировка DMD Cottage уже выполнена');
                    }
                  }
                } catch (error) {
                  console.error('❌ Ошибка сохранения размера столбца:', error);
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
            let finalHeight = startHeight; // Переменная для отслеживания финальной высоты
            
            const handleMouseMove = (e: MouseEvent) => {
              const newHeight = Math.max(20, startHeight + (e.clientY - startY));
              finalHeight = newHeight; // Сохраняем актуальную высоту
              setRowSizes(prev => ({ ...prev, [row]: newHeight }));
            };
            
            const handleMouseUp = async () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              
              try {
                console.log(`🔧 Сохраняем высоту строки ${row}: ${finalHeight}px в таблице ${sheet.id}`);
                const response = await sheetsExtendedApi.resizeRow(sheet.id.toString(), row, finalHeight);
                console.log(`✅ Сохранена высота строки ${row}: ${finalHeight}px`, response);
                
                // Проверяем что settings действительно обновились
                if (response?.data?.settings?.rowSizes) {
                  console.log(`📊 Обновленные размеры строк:`, response.data.settings.rowSizes);
                  
                  // Обновляем локальное состояние
                  setRowSizes(prevSizes => ({
                    ...prevSizes,
                    ...response.data.settings.rowSizes
                  }));
                } else {
                  console.warn(`⚠️ Settings для строк не получены в ответе:`, response);
                }
              } catch (error) {
                console.error('❌ Ошибка сохранения размера строки:', error);
              }
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </Box>
    );
  };

  // Определяем, нужно ли скрыть нумерацию строк для отчета DMD Cottage
  const hideRowNumbers = useMemo(() => {
    return isDMDCottageReport;
  }, [isDMDCottageReport]);

  // Предварительно вычисляем строки, которые являются концом группы вида ["29а", "29а дуль"] по колонке A (0)
  const groupEndRows = useMemo(() => {
    if (!hideRowNumbers) return new Set<number>();
    const result = new Set<number>();
    const maxRows = sheet.rowCount || 100;
    for (let r = 0; r < maxRows - 1; r++) {
      const v1 = (getCellValue(r, 0) || '').toString().trim().toLowerCase();
      const v2 = (getCellValue(r + 1, 0) || '').toString().trim().toLowerCase();
      if (!v1 || !v2) continue;
      if (v2 === `${v1} дубль`) {
        result.add(r + 1); // вторая строка пары — конец группы
      }
    }
    return result;
  }, [hideRowNumbers, sheet.rowCount, cells]);

  // Авто-сортировка по столбцу A для отчета DMD Cottage (с сохранением пар X / X дубль)
  const sortByColumnAForDMDCottage = useCallback(() => {
    if (!isDMDCottageReport) return;
    if (isSortingInProgressRef.current) {
      console.log('🚫 Автосортировка уже выполняется, пропускаем');
      return;
    }
    
    console.log('🚀 Начинаем автосортировку DMD Cottage');
    isSortingInProgressRef.current = true;
    const totalRows = sheet.rowCount || 100;
    const totalCols = sheet.columnCount || 26;

    // Данные начинаются с 3-й строки (индекс 2): 0 — заголовок, 1 — вторая строка шапки
    const dataStartRow = 2;

    // Нормализатор базы: число + литера (латиница/кириллица), пустая литера — приоритетная
    const parseBase = (raw: string): { num: number | null; suffix: string; norm: string } => {
      const s = (raw || '').toString().trim().toUpperCase();
      const m = s.match(/^(\d+)\s*([A-ZА-ЯЁ]*)$/i);
      if (m) {
        const num = parseInt(m[1], 10);
        const suffix = (m[2] || '').toUpperCase();
        return { num: Number.isFinite(num) ? num : null, suffix, norm: `${num}${suffix}` };
      }
      return { num: null, suffix: s, norm: s };
    };

    // Собираем строки с их ячейками
    type RowCells = { originalRow: number; cells: Map<number, CellData>; aRaw: string; aBase: string; isDub: boolean; parsed: { num: number | null; suffix: string; norm: string } };
    const rows: RowCells[] = [];
    for (let row = dataStartRow; row < totalRows; row++) {
      let hasData = false;
      const rowCells = new Map<number, CellData>();
      for (let col = 0; col < totalCols; col++) {
        const key = getCellKey(row, col);
        const cell = cells.get(key);
        if (cell) {
          rowCells.set(col, cell);
          if (cell.value && cell.value.toString().trim() !== '') hasData = true;
        }
      }
      if (!hasData) continue;
      const aVal = (getCellValue(row, 0) || '').toString();
      const lower = aVal.toLowerCase().trim();
      // Распознаём "дубль" с доп. пробелами/регистр/скрытые символы
      const isDub = /\s*дубль\s*$/i.test(lower);
      const baseText = isDub ? lower.replace(/\s*дубль\s*$/i, '').trim() : lower;
      const parsed = parseBase(baseText);
      rows.push({ originalRow: row, cells: rowCells, aRaw: aVal, aBase: baseText, isDub, parsed });
    }

    if (rows.length === 0) return;

    // Группируем пары: основной + дубль
    const groups = new Map<string, { base: string; parsed: { num: number | null; suffix: string; norm: string }; main?: RowCells; dub?: RowCells }>();
    for (const r of rows) {
      const key = r.parsed.norm || r.aBase;
      const existing = groups.get(key) || { base: r.aBase, parsed: r.parsed };
      if (r.isDub) existing.dub = r; else existing.main = r;
      // Если parsed у текущей записи более информативен (есть num), обновим
      if (existing.parsed.num === null && r.parsed.num !== null) existing.parsed = r.parsed;
      groups.set(key, existing);
    }

    // Сортируем группы: по числу, затем по литере (пустая — раньше), затем по алфавиту как fallback
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      const pa = a.parsed; const pb = b.parsed;
      if (pa.num !== null && pb.num !== null && pa.num !== pb.num) return pa.num - pb.num;
      if (pa.num !== null && pb.num === null) return -1;
      if (pa.num === null && pb.num !== null) return 1;
      // num равны или отсутствуют — сравниваем суффиксы (пустой раньше)
      const sa = pa.suffix || '';
      const sb = pb.suffix || '';
      if (sa === '' && sb !== '') return -1;
      if (sa !== '' && sb === '') return 1;
      const sufCmp = sa.localeCompare(sb, 'ru', { numeric: true, sensitivity: 'base' });
      if (sufCmp !== 0) return sufCmp;
      // Fallback: по нормализованной строке
      return (pa.norm || a.base).localeCompare(pb.norm || b.base, 'ru', { numeric: true, sensitivity: 'base' });
    });

    // Пересобираем карту ячеек
    const newCells = new Map(cells);
    // Очищаем старые позиции данных
    for (let row = dataStartRow; row < totalRows; row++) {
      for (let col = 0; col < totalCols; col++) {
        const key = getCellKey(row, col);
        newCells.delete(key);
      }
    }

    // Записываем в новом порядке: сначала main, затем dub (если есть)
    let writeRow = dataStartRow;
    for (const g of sortedGroups) {
      const order: RowCells[] = [];
      if (g.main) order.push(g.main);
      if (g.dub) order.push(g.dub);
      for (const item of order) {
        item.cells.forEach((cell, col) => {
          const newKey = getCellKey(writeRow, col);
          newCells.set(newKey, { ...cell, row: writeRow });
        });
        writeRow++;
      }
    }

    setCells(newCells);
    console.log('🔄 Автосортировка DMD Cottage по столбцу A выполнена (число+литера, группы с дублем)');
    
    // Принудительно обновляем компонент для отображения изменений
    setTimeout(() => {
      console.log('🔄 Принудительное обновление компонента после автосортировки');
      setRenderKey(prev => prev + 1); // Принудительный перерендер
      setCells(new Map(newCells)); // Создаем новую Map для принудительного рендера
      
      // Дополнительно обновляем состояние виртуализации
      setScrollTop(prev => prev + 1);
      setTimeout(() => {
        setScrollTop(prev => prev - 1);
      }, 50);
    }, 100);
    
    // Сохраняем отсортированные ячейки на сервер
    const cellsToSave = Array.from(newCells.values())
      .filter(cell => cell.row >= dataStartRow && cell.row < writeRow) // только строки с данными
      .map(cell => ({
        row: cell.row,
        column: cell.column,
        value: cell.value,
        format: cell.format
      }));
    
    if (cellsToSave.length > 0) {
      console.log(`💾 Сохраняем ${cellsToSave.length} отсортированных ячеек на сервер`);
      saveCellsBatchOptimized(cellsToSave).finally(() => {
        // Сбрасываем флаг после завершения сохранения
        setTimeout(() => {
          isSortingInProgressRef.current = false;
          console.log('✅ Автосортировка завершена, флаг сброшен');
        }, 1000); // Даем время для завершения всех операций
      });
    } else {
      // Сбрасываем флаг если нет данных для сохранения
      setTimeout(() => {
        isSortingInProgressRef.current = false;
        console.log('✅ Автосортировка завершена (нет данных), флаг сброшен');
      }, 500);
    }
  }, [cells, sheet, isDMDCottageReport, getCellValue, saveCellsBatchOptimized, setRenderKey, setScrollTop]);

  // Функция автоматического расчета доплаты для DMD Cottage (Общая сумма - Предоплата)
  const calculateDoplataForDMDCottage = useCallback(() => {
    if (!isDMDCottageReport) return;
    if (isSortingInProgressRef.current) {
      console.log('🚫 Пропускаем расчет доплаты DMD - идет автосортировка');
      return;
    }
    
    const totalRows = sheet.rowCount || 100;
    const dataStartRow = 2; // Данные начинаются с 3-й строки (индекс 2)
    
    // Индексы колонок для шаблона DMD Cottage
    const TOTAL_SUM_COL = 11;     // Общая сумма
    const PREPAYMENT_COL = 12;    // Предоплата  
    const DOPLATA_COL = 13;       // Доплата
    
    const newCells = new Map(cells);
    let updatedCount = 0;

    for (let row = dataStartRow; row < totalRows; row++) {
      const totalSumKey = getCellKey(row, TOTAL_SUM_COL);
      const prepaymentKey = getCellKey(row, PREPAYMENT_COL);
      const doplataKey = getCellKey(row, DOPLATA_COL);
      
      const totalSumCell = newCells.get(totalSumKey);
      const prepaymentCell = newCells.get(prepaymentKey);
      
      // Проверяем есть ли данные в строке (по колонке A)
      const rowAKey = getCellKey(row, 0);
      const rowACell = newCells.get(rowAKey);
      if (!rowACell?.value || !rowACell.value.toString().trim()) continue;
      
      // Получаем числовые значения
      const totalSum = parseFloat((totalSumCell?.value || '0').toString().replace(/[^\d.-]/g, '')) || 0;
      const prepayment = parseFloat((prepaymentCell?.value || '0').toString().replace(/[^\d.-]/g, '')) || 0;
      
      // Рассчитываем доплату только если есть общая сумма
      if (totalSum > 0) {
        const doplata = totalSum - prepayment;
        const existingDoplataCell = newCells.get(doplataKey);
        
        // Обновляем ячейку доплаты
        newCells.set(doplataKey, {
          ...existingDoplataCell,
          row,
          column: DOPLATA_COL,
          value: doplata.toString(),
          format: existingDoplataCell?.format || {}
        });
        
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      setCells(newCells);
      console.log(`💰 Автоматический расчет доплаты DMD Cottage выполнен для ${updatedCount} строк`);
      
      // Принудительно обновляем компонент для отображения изменений
      setTimeout(() => {
        console.log('💰 Принудительное обновление компонента после расчета доплаты');
        setRenderKey(prev => prev + 1); // Принудительный перерендер
        setCells(new Map(newCells)); // Создаем новую Map для принудительного рендера
      }, 150);
      
      // Сохраняем обновленные ячейки на сервер
      const cellsToSave = Array.from(newCells.values())
        .filter(cell => cell.column === DOPLATA_COL && cell.row >= dataStartRow)
        .map(cell => ({
          row: cell.row,
          column: cell.column,
          value: cell.value,
          format: cell.format
        }));

      if (cellsToSave.length > 0) {
        saveCellsBatchOptimized(cellsToSave);
      }
    }
  }, [cells, sheet, isDMDCottageReport, saveCellsBatchOptimized, setRenderKey]);

  // Выполняем автосортировку один раз после загрузки ячеек для отчета DMD Cottage
  const hasAutoSortedRef = useRef(false);
  
  // После первой автосортировки запускаем авторазмеры один раз
  const needsResizeAfterSortRef = useRef(false);
  
  // Флаг для блокировки операций во время автосортировки
  const isSortingInProgressRef = useRef(false);
  useEffect(() => {
    if (!isDMDCottageReport) return;
    if (cells.size === 0) return;
    if (hasAutoSortedRef.current) return;
    
    const timer = setTimeout(() => {
      sortByColumnAForDMDCottage();
      
      hasAutoSortedRef.current = true;
      needsResizeAfterSortRef.current = true;
      calculateDoplataForDMDCottage();
      // Запускаем расчет доплаты после автосортировки
      // setTimeout(() => {
        
      // }, 2000);

    }, 1000);
    return () => clearTimeout(timer);
  }, [isDMDCottageReport, cells, sortByColumnAForDMDCottage, calculateDoplataForDMDCottage]);

  // Эффект ниже handleAutoResize: триггерит авторазмер один раз после сортировки


  // Сбрасываем флаг при смене таблицы
  useEffect(() => {
    hasAutoSortedRef.current = false;
  }, [sheet?.id]);

  const renderGrid = () => {
    const { startRow, endRow } = getVisibleRows();
    const rows = [];
    const totalHeight = getTotalHeight();
    const startOffset = getRowOffset(startRow);
    
    // Создаем виртуальный контейнер с полной высотой
    const virtualContainer = (
      <Box
        sx={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {/* Контейнер для видимых строк */}
        <Box
          sx={{
            position: 'absolute',
            top: startOffset,
            left: 0,
            right: 0,
          }}
        >
          {(() => {
            const visibleRows = [];
            
            for (let row = startRow; row <= endRow; row++) {
              // Пропускаем строку 0 для отчетов (шапка)
              if (sheet?.template?.name?.includes('Отчет') && row === 0) continue;
              const cells = [];
              const rowHeight = getRowHeight(row);
      
              for (let col = 0; col < (sheet.columnCount || 26); col++) {
                // Скрываем колонки 5 (Время выселения), 8 (Время заселения), 15 (Примечания) для шаблона отчета
                if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
                
                const isSelected = selectedCell?.row === row && selectedCell?.column === col;
                const isEditing = editingCell?.row === row && editingCell?.column === col;
                const isInRange = isInSelectedRange(row, col);
                const isInClipboard = isInClipboardRange(row, col);
                const cellFormat = getCellFormat(row, col);
                // Увеличиваем шрифт для второй строки отчета в UI
                const effectiveFormat = (sheet?.templateId === 2 && row === 1)
                  ? { ...cellFormat, fontSize: Math.max(Number(cellFormat?.fontSize || 0), 16) }
                  : cellFormat;
                const columnWidth = getColumnWidth(col);
                
                const isGroupEnd = groupEndRows.has(row);
                cells.push(
                  <Cell
                    key={`${row}-${col}`}
                    row={row}
                    column={col}
                    value={getCellValue(row, col)}
                    format={effectiveFormat}
                    isSelected={isSelected}
                    isInRange={isInRange}
                    isInClipboard={isInClipboard}
                    isEditing={isEditing}
                    editValue={editValue}
                    width={columnWidth}
                    height={rowHeight}
                    isGroupEndRow={isGroupEnd}
                    onEditValueChange={setEditValue}
                    onClick={() => handleCellClick(row, col)}
                    onMouseDown={() => handleCellMouseDown(row, col)}
                    onMouseEnter={() => handleCellMouseEnter(row, col)}
                    onDoubleClick={() => handleCellDoubleClick(row, col)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={handleEditBlur}
                    readOnly={userPermissions === 'read'}
                    sheetTitle={sheet.name || ''}
                    templateName={sheet.template?.name || ''}
                  />
                );
              }
      
              visibleRows.push(
                <Box key={row} sx={{ display: 'flex' }}>
                  {!hideRowNumbers && renderRowHeader(row)}
                  {cells}
                </Box>
              );
            }
            
            return visibleRows;
          })()}
        </Box>
      </Box>
    );
    
    return virtualContainer;
  };

  // Очистка дебаунсированных функций при размонтировании
  useEffect(() => {
    return () => {
      debouncedSaveCell.cancel();
      debouncedUpdateSelection.cancel();
      debouncedScrollUpdate.cancel();
      debouncedCalculateDoplata.cancel();
    };
  }, [debouncedSaveCell, debouncedUpdateSelection, debouncedScrollUpdate, debouncedCalculateDoplata]);

  const isReportSheet = useMemo(() => {
    const result = sheet?.name?.toLowerCase().includes('отчет') ||
                   sheet?.template?.name?.toLowerCase().includes('отчет');
    console.log('🔍 isReportSheet проверка:', {
      sheetName: sheet?.name,
      templateName: sheet?.template?.name,
      result
    });
    return result;
  }, [sheet?.name, sheet?.template?.name]);

  // Функция для расчета оптимальной ширины столбца на основе содержимого
  const calculateOptimalColumnWidth = useCallback((column: number): number => {
    // Для шаблона DMD Cottage используем фиксированные ширины для определенных столбцов
    if (isDMDCottageReport && DMD_COTTAGE_FIXED_COLUMN_WIDTHS[column]) {
      return DMD_COTTAGE_FIXED_COLUMN_WIDTHS[column];
    }

    const MIN_WIDTH = 100;
    const MAX_WIDTH = 400;
    const PADDING = 24; // горизонтальные отступы ячейки

    // Ленивая инициализация canvas для точного измерения текста
    const getTextWidth = (() => {
      let canvas: HTMLCanvasElement | null = null;
      let ctx: CanvasRenderingContext2D | null = null;
      return (text: string) => {
        if (!canvas) {
          canvas = document.createElement('canvas');
          ctx = canvas.getContext('2d');
        }
        if (!ctx) return text.length * 9 + PADDING; // fallback
        ctx.font = '14px Arial';
        return ctx.measureText(text).width + PADDING;
      };
    })();

    let maxWidth = MIN_WIDTH;
    const rowLimit = Math.min(sheet.rowCount || 100, 200);
    for (let row = 0; row < rowLimit; row++) {
      const cell = cells.get(`${row}-${column}`);
      const text = cell?.value || '';
      if (text) {
        maxWidth = Math.max(maxWidth, Math.ceil(getTextWidth(text)));
      }
    }
    return Math.min(maxWidth, MAX_WIDTH);
  }, [cells, sheet.rowCount, isDMDCottageReport]);

  // Функция для расчета оптимальной высоты строки с учетом переноса текста
  const calculateOptimalRowHeight = useCallback((row: number): number => {
    const MIN_HEIGHT = 30;
    const MAX_HEIGHT = 280;
    const LINE_HEIGHT = 20;
    const CHAR_WIDTH = 8;

    let maxHeight = MIN_HEIGHT;
    const maxCols = Math.min(sheet.columnCount || 26, 50);
    for (let col = 0; col < maxCols; col++) {
      // Пропускаем колонки 5, 8, 15 для шаблона отчета
      if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
      
      const cell = cells.get(`${row}-${col}`);
      if (!cell?.value) continue;
      const columnWidth = getColumnWidth(col);
      const availableWidth = Math.max(40, columnWidth - 16);
      const charsPerLine = Math.max(1, Math.floor(availableWidth / CHAR_WIDTH));
      const lines = Math.ceil(cell.value.length / charsPerLine);
      const cellHeight = lines * LINE_HEIGHT + 8; // +8 padding
      maxHeight = Math.max(maxHeight, cellHeight);
    }
    return Math.min(maxHeight, MAX_HEIGHT);
  }, [cells, getColumnWidth, sheet.columnCount]);

  // Флаг для предотвращения повторных вызовов автонастройки
  const isAutoResizeRunningRef = useRef(false);

  // Функция автонастройки размеров для отчетов
  const handleAutoResize = useCallback(async () => {
    if (!isReportSheet || userPermissions === 'read') {
      console.log('⚠️ Автонастройка пропущена:', { isReportSheet, userPermissions });
      return;
    }

    // Предотвращаем повторные вызовы
    if (isAutoResizeRunningRef.current) {
      console.log('⚠️ Автонастройка уже выполняется, пропускаем');
      return;
    }

    isAutoResizeRunningRef.current = true;
    
    console.log('🔧 Автонастройка размеров для отчета заселения/выселения');
    console.log('📊 Текущие размеры - columnSizes:', columnSizes, 'rowSizes:', rowSizes);
    console.log('📋 Текущие настройки таблицы:', sheet.settings);
    
    try {
      const newColumnSizes: { [key: number]: number } = {};
      const newRowSizes: { [key: number]: number } = {};

      // Полный охват столбцов
      const maxCols = sheet.columnCount || 26;
      for (let col = 0; col < maxCols; col++) {
        // Пропускаем колонки 5, 8, 15 для шаблона отчета
        if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
        
        const optimalWidth = calculateOptimalColumnWidth(col);
        const currentWidth = getColumnWidth(col);
        
        // Добавляем только если ширина действительно отличается (с учетом погрешности)
        if (Math.abs(optimalWidth - currentWidth) > 1) {
          newColumnSizes[col] = optimalWidth;
        }
      }

      // Для шаблона DMD Cottage принудительно устанавливаем фиксированные ширины
      if (isDMDCottageReport) {
        let hasFixedChanges = false;
        Object.entries(DMD_COTTAGE_FIXED_COLUMN_WIDTHS).forEach(([col, width]) => {
          const columnIndex = parseInt(col);
          const currentWidth = getColumnWidth(columnIndex);
          
          // Устанавливаем только если ширина отличается
          if (Math.abs(width - currentWidth) > 1) {
            newColumnSizes[columnIndex] = width;
            hasFixedChanges = true;
            console.log(`🔧 Устанавливаем фиксированную ширину для столбца ${columnIndex}: ${width}px (было ${currentWidth}px)`);
          }
        });
        
        // Если нет изменений в фиксированных ширинах, очищаем newColumnSizes от них
        if (!hasFixedChanges) {
          Object.keys(DMD_COTTAGE_FIXED_COLUMN_WIDTHS).forEach(col => {
            const columnIndex = parseInt(col);
            delete newColumnSizes[columnIndex];
          });
        }
      }

      // Пересчет высот строк с учетом НОВЫХ ширин столбцов
      const effectiveWidth = (col: number) => newColumnSizes[col] ?? getColumnWidth(col);
      const maxRows = Math.min(sheet.rowCount || 100, 500);
      for (let row = 0; row < maxRows; row++) {
        const MIN_HEIGHT = 30;
        const MAX_HEIGHT = 280;
        const LINE_HEIGHT = 20;
        const CHAR_WIDTH = 8;
        let maxHeight = MIN_HEIGHT;
        for (let col = 0; col < maxCols; col++) {
          const cell = cells.get(`${row}-${col}`);
          if (!cell?.value) continue;
          const availableWidth = Math.max(40, effectiveWidth(col) - 16);
          const charsPerLine = Math.max(1, Math.floor(availableWidth / CHAR_WIDTH));
          const lines = Math.ceil(cell.value.length / charsPerLine);
          const cellHeight = lines * LINE_HEIGHT + 8;
          maxHeight = Math.max(maxHeight, cellHeight);
        }
        const optimalHeight = Math.min(maxHeight, MAX_HEIGHT);
        const currentHeight = getRowHeight(row);
        
        // Добавляем только если высота действительно отличается (с учетом погрешности)
        if (Math.abs(optimalHeight - currentHeight) > 1) {
          newRowSizes[row] = optimalHeight;
        }
      }

      const hasChanges = Object.keys(newColumnSizes).length > 0 || Object.keys(newRowSizes).length > 0;
      
      if (hasChanges) {
        console.log(`📏 Найдены изменения: столбцы ${Object.keys(newColumnSizes).length}, строки ${Object.keys(newRowSizes).length}`);
        
        const currentSettings = sheet.settings || { columnSizes: {}, rowSizes: {} };
        const updatedSettings = {
          ...currentSettings,
          columnSizes: { ...(currentSettings.columnSizes || {}), ...newColumnSizes },
          rowSizes: { ...(currentSettings.rowSizes || {}), ...newRowSizes }
        };

        const response = await sheetsExtendedApi.updateSettings(sheet.id.toString(), updatedSettings);
        console.log('✅ Автонастройка: настройки сохранены в backend', response.data);
        
        if (response.data?.settings) {
          const { columnSizes: savedColumnSizes = {}, rowSizes: savedRowSizes = {} } = response.data.settings;
          console.log('🔄 Ответ от сервера - настройки:', response.data.settings);
          if (Object.keys(newColumnSizes).length > 0) setColumnSizes(savedColumnSizes);
          if (Object.keys(newRowSizes).length > 0) setRowSizes(savedRowSizes);
        }
      } else {
        console.log('ℹ️ Автонастройка: изменений размеров нет, запрос к backend не отправлен');
      }
      
      // Применяем форматирование переноса текста только если есть изменения размеров
      if (hasChanges) {
        // Собираем ячейки для применения переноса текста
        const cellsToUpdate: Array<{ row: number; column: number; format: any }> = [];
        cells.forEach((cell) => {
          // Для фиксированных столбцов DMD Cottage применяем перенос ко всем ячейкам
          const isFixedColumn = isDMDCottageReport && DMD_COTTAGE_FIXED_COLUMN_WIDTHS[cell.column];
          const needsWrap = isFixedColumn || (cell.value && cell.value.length > 9);
          
          if (needsWrap) {
            const currentFormat = cell.format || {};
            const hasWrapFormat = currentFormat.whiteSpace === 'normal' && 
                                 currentFormat.wordWrap === 'break-word';
            
            // Применяем форматирование только если его еще нет
            if (!hasWrapFormat) {
              const format = {
                ...currentFormat,
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                overflow: 'hidden'
              };
              cellsToUpdate.push({ row: cell.row, column: cell.column, format });
            }
          }
        });
        
        if (cellsToUpdate.length > 0) {
          console.log(`🎨 Применяем форматирование переноса текста к ${cellsToUpdate.length} ячейкам`);
          
          // Конвертируем в формат CellUpdate для пакетного обновления
          const formatUpdates: CellUpdate[] = cellsToUpdate.map(cellUpdate => ({
            row: cellUpdate.row,
            column: cellUpdate.column,
            format: cellUpdate.format
          }));
          
          // Используем пакетное обновление
          await saveCellsBatchOptimized(formatUpdates);
          
          // Обновляем локальное состояние ячеек
          const newCells = new Map(cells);
          cellsToUpdate.forEach((cellUpdate) => {
            const key = `${cellUpdate.row}-${cellUpdate.column}`;
            const cell = newCells.get(key);
            if (cell) {
              newCells.set(key, { ...cell, format: cellUpdate.format });
            }
          });
          setCells(newCells);
        }
      }
      
      console.log('✅ Автонастройка размеров завершена');
      
    } catch (error) {
      console.error('❌ Ошибка при автонастройке размеров:', error);
    } finally {
      // Сбрасываем флаг в любом случае
      isAutoResizeRunningRef.current = false;
    }
  }, [isReportSheet, userPermissions, calculateOptimalColumnWidth, cells, getColumnWidth, getRowHeight, sheet, columnSizes, rowSizes, isDMDCottageReport, saveCellsBatchOptimized]);

  // Отладочный лог для диагностики
  // useEffect(() => {
  //   // if (sheet?.template?.name) {
  //   //   console.log(`Sheet template name: "${sheet.template.name}"`);
  //   // } else {
  //   //   console.log(`Sheet template is missing:`, sheet?.template);
  //   // }
    
  //   // if (sheet) {
  //   //   console.log(`Full sheet object:`, {
  //   //     id: sheet.id,
  //   //     name: sheet.name,
  //   //     template: sheet.template,
  //   //     templateId: sheet.templateId
  //   //   });
  //   // }
  // }, [sheet?.template?.name, sheet]);

  // Триггер авторазмера после сортировки (объявлен ниже handleAutoResize для корректного порядка зависимостей)
  useEffect(() => {
    if (!isDMDCottageReport) return;
    if (!hasAutoSortedRef.current) return;
    if (!needsResizeAfterSortRef.current) return;
    needsResizeAfterSortRef.current = false;
    // Пытаемся кликнуть по кнопке по предоставленному XPath; если не найдена — вызываем напрямую
    try {
      const toolbarButton = document.evaluate(
        '//*[@id="root"]/div/div/div/div[1]/button[7]',
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue as HTMLElement | null;
      if (toolbarButton) {
        toolbarButton.click();
      } else {
        void handleAutoResize();
      }
    } catch (e) {
      console.warn('⚠️ Не удалось кликнуть по XPath, вызываю авторазмер напрямую:', e);
      void handleAutoResize();
    }
  }, [isDMDCottageReport, handleAutoResize]);

  // Функция для экспорта в Excel с сохранением ширин/высот/границ/форматирования
  const handleExportExcel = async () => {
    // Хелперы преобразований и стилей
    const hexToARGB = (hex?: string): string | undefined => {
      if (!hex) return undefined;
      const cleaned = hex.replace('#', '');
      if (cleaned.length === 3) {
        const r = cleaned[0];
        const g = cleaned[1];
        const b = cleaned[2];
        return `FF${r}${r}${g}${g}${b}${b}`.toUpperCase();
      }
      if (cleaned.length === 6) return `FF${cleaned}`.toUpperCase();
      return undefined;
    };
    const pxToExcelColWidth = (px: number): number => {
      const val = (px - 5) / 7; // приближенно
      return Math.max(2, Math.round(val * 100) / 100);
    };
    const pxToPoints = (px: number): number => Math.round(px * 0.75 * 100) / 100;
    const parseFontSize = (v: any): number | undefined => {
      if (typeof v === 'number' && isFinite(v)) return v;
      if (typeof v === 'string') {
        const m = v.trim().match(/^(\d+)(px)?$/i);
        if (m) return parseInt(m[1], 10);
      }
      return undefined;
    };
    const getReportDateString = (): string => {
      const raw = (reportDate || sheet?.reportDate || (cells.get('0-0')?.value ?? '')).toString();
      if (!raw) return '';
      // Поддержка форматов YYYY-MM-DD и DD.MM.YYYY
      const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
      const dotted = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (dotted) return `${dotted[1]}.${dotted[2]}.${dotted[3]}`;
      return raw;
    };

    const workbook = new ExcelJS.Workbook();
    const wsName = (sheet.name || 'Report')
      .replace(/[\\/?*\[\]:]/g, '')
      .trim()
      .slice(0, 31) || 'Report';
    const worksheet = workbook.addWorksheet(wsName);

    const totalRows = sheet.rowCount || 100;
    const totalCols = sheet.columnCount || 26;

    // Установка ширин столбцов с учетом смещения для скрытых колонок
    let excelCol = 1; // Позиция в Excel (1-based)
    for (let col = 0; col < totalCols; col++) {
      // Пропускаем скрытые колонки для шаблона отчета
      if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
      
      let sourceCol = col;
      // Для шаблона отчета: колонка 16 записывается на место колонки 15
      if (sheet?.templateId === 2 && col === 16) {
        sourceCol = 16;
      }
      
      const widthPx = Math.max(20, getColumnWidth(sourceCol));
      const width = pxToExcelColWidth(widthPx);
      const colRef = worksheet.getColumn(excelCol);
      colRef.width = Math.max(2, width);
      excelCol++;
    }

    // Установка высот строк (Row.height в поинтах)
    for (let row = 0; row < totalRows; row++) {
      const heightPx = Math.max(16, getRowHeight(row));
      worksheet.getRow(row + 1).height = pxToPoints(heightPx);
    }

    const isDMDCottageReport = sheet?.template?.name === 'Отчет заселения/выселения DMD Cottage' ||
                               sheet?.template?.name?.includes('Отчет заселения/выселения DMD Cottage');

    // Заполнение значений и применение форматирования с учетом смещения
    for (let row = 0; row < totalRows; row++) {
      let excelCol = 1; // Позиция в Excel (1-based)
      for (let col = 0; col < totalCols; col++) {
        // Пропускаем скрытые колонки для шаблона отчета
        if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
        
        let sourceCol = col;
        // Для шаблона отчета: колонка 16 записывается на место колонки 15
        if (sheet?.templateId === 2 && col === 16) {
          sourceCol = 16;
        }
        
        const cellRef = worksheet.getCell(row + 1, excelCol);
        // Не записываем значения в первую строку для отчета — она будет задаться вручную ниже
        if (sheet?.template?.name?.includes('Отчет') && row === 0) {
          cellRef.value = null;
        } else {
          cellRef.value = getCellValue(row, sourceCol) as any;
        }

        // Для столбца A в Excel делаем шрифт жирным
        const baseFmt: any = getCellFormat(row, sourceCol) || {};
        // Увеличиваем шрифт для второй строки отчета в экспорте (минимум 14)
        const withRow2Inc = (sheet?.templateId === 2 && row === 1)
          ? { ...baseFmt, fontSize: Math.max(parseFontSize(baseFmt.fontSize || 0) || 0, 14) }
          : baseFmt;
        // Применяем жирное форматирование для:
        // - столбца A (col === 0)
        // - колонок "Общая сумма" (11) и "Доплата" (13) в отчете DMD Cottage для строк данных (row >= 2)
        const shouldBeBold = col === 0 || (isDMDCottageReport && (sourceCol === 11 || sourceCol === 13) && row >= 2);
        const fmt: any = shouldBeBold ? { ...withRow2Inc, fontWeight: 'bold' } : withRow2Inc;
        // Шрифт
        cellRef.font = {
          name: fmt.fontFamily || undefined,
          size: parseFontSize(fmt.fontSize),
          bold: fmt.fontWeight === 'bold' ? true : undefined,
          italic: fmt.fontStyle === 'italic' ? true : undefined,
          underline: fmt.textDecoration === 'underline' ? true : undefined,
          color: fmt.textColor ? { argb: hexToARGB(fmt.textColor) } : undefined,
        } as any;

        // Выравнивание + перенос текста
        cellRef.alignment = {
          horizontal: fmt.textAlign || 'left',
          vertical: 'middle',
          wrapText: !!(fmt.whiteSpace === 'normal' || fmt.textWrap === 'wrap'),
        } as any;

        // Заливка
        if (fmt.backgroundColor) {
          const argb = hexToARGB(fmt.backgroundColor);
          if (argb) {
            cellRef.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb }
            } as any;
          }
        }

        // Границы (упрощенно: 'all' и 'outer' → все стороны)
        const makeBorder = (width?: number, style?: string, color?: string) => {
          const s: any = style === 'double' ? 'double' : (width && width >= 2 ? 'medium' : 'thin');
          const c = color ? { argb: hexToARGB(color) } : { argb: 'FF000000' };
          const side: any = { style: s, color: c };
          return { top: side, left: side, bottom: side, right: side } as any;
        };
        if (fmt.border) {
          const b = fmt.border;
          if (b.type === 'all' || b.type === 'outer' || b.type === undefined) {
            cellRef.border = makeBorder(b.width, b.style, b.color);
          }
          // 'inner' пропускаем в экспорте, т.к. требует диапазонной логики
        }

        // Толстая левая граница для столбцов C(2) и G(6) в отчете DMD Cottage
        if (isDMDCottageReport && (col === 2 || col === 6)) {
          cellRef.border = {
            ...(cellRef.border || {}),
            left: { style: 'medium', color: { argb: 'FF000000' } }
          } as any;
        }
        
        excelCol++;
      }
    }

    // Объединения ячеек
    const normalizeRange = (r1: number, c1: number, r2: number, c2: number) => {
      const rr1 = Math.max(0, Math.min(r1, r2));
      const rr2 = Math.max(0, Math.max(r1, r2));
      const cc1 = Math.max(0, Math.min(c1, c2));
      const cc2 = Math.max(0, Math.max(c1, c2));
      return { r1: rr1, c1: cc1, r2: rr2, c2: cc2 };
    };
    const mergeKey = (r1: number, c1: number, r2: number, c2: number) => `${r1}-${c1}-${r2}-${c2}`;
    const existingMerges = new Set<string>();
    const mergeRanges: Array<{ r1: number; c1: number; r2: number; c2: number }> = [];
    const addMerge = (r1: number, c1: number, r2: number, c2: number) => {
      const { r1: nr1, c1: nc1, r2: nr2, c2: nc2 } = normalizeRange(r1, c1, r2, c2);
      // Валидируем границы по размеру листа
      if (nr1 < 0 || nr2 < 0 || nc1 < 0 || nc2 < 0) return;
      if (nr1 >= totalRows || nr2 >= totalRows) return;
      if (nc1 >= totalCols || nc2 >= totalCols) return;
      if (nr1 === nr2 && nc1 === nc2) return; // нет смысла
      const key = mergeKey(nr1, nc1, nr2, nc2);
      if (existingMerges.has(key)) return;
      try {
        worksheet.mergeCells(nr1 + 1, nc1 + 1, nr2 + 1, nc2 + 1);
        existingMerges.add(key);
        mergeRanges.push({ r1: nr1, c1: nc1, r2: nr2, c2: nc2 });
      } catch {}
    };
    // Собираем merges из данных (временно отключено из-за потенциальных конфликтов источника данных)
    // if (sheet?.cells && Array.isArray(sheet.cells)) {
    //   const visited = new Set<string>();
    //   for (const cell of sheet.cells) {
    //     if (cell && cell.mergedWith && !visited.has(`${cell.row}-${cell.column}`)) {
    //       const [srStr, scStr] = String(cell.mergedWith).split('-');
    //       const sr = parseInt(srStr, 10);
    //       const sc = parseInt(scStr, 10);
    //       const er = Number(cell.row);
    //       const ec = Number(cell.column);
    //       if (!Number.isNaN(sr) && !Number.isNaN(sc) && !Number.isNaN(er) && !Number.isNaN(ec)) {
    //         for (let r = sr; r <= er; r++) {
    //           for (let c = sc; c <= ec; c++) visited.add(`${r}-${c}`);
    //         }
    //         addMerge(sr, sc, er, ec);
    //       }
    //     }
    //   }
    // }
    const overlaps = (a: {r1:number;c1:number;r2:number;c2:number}, b: {r1:number;c1:number;r2:number;c2:number}) => {
      return !(a.r2 < b.r1 || a.r1 > b.r2 || a.c2 < b.c1 || a.c1 > b.c2);
    };
    // Явные merges для шапки отчета с учетом смещения колонок
    if (sheet?.template?.name?.includes('Отчет')) {
      // Рассчитываем новые позиции с учетом скрытых колонок
      // Исходные: A1:B1 (0-1), C1:E1 (2-4), F1:P1 (6-13 после исключения 5,8,15)
      const visibleCols = [];
      for (let col = 0; col < totalCols; col++) {
        if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
        visibleCols.push(col);
      }
      
      if (visibleCols.length > 0) {
        // A1:B1 остается 0:1
        const r1 = { r1: 0, c1: 0, r2: 0, c2: Math.min(1, visibleCols.length - 1) };
        // C1:E1 становится 2:4 (колонки 2,3,4 - исключена 5)
        const r2 = { r1: 0, c1: 2, r2: 0, c2: Math.min(4, visibleCols.length - 1) };
        // F1:... начинается с колонки 5 в экспорте (была 6, но 5 исключена)
        const r3 = { r1: 0, c1: 5, r2: 0, c2: visibleCols.length - 1 };
        
        const ranges = [r1, r2, r3];
        for (const r of ranges) {
          if (r.c1 <= r.c2 && r.r1 <= r.r2 && r.c2 < visibleCols.length) {
            const conflict = mergeRanges.some((m) => overlaps(m, r));
            if (!conflict) addMerge(r.r1, r.c1, r.r2, r.c2);
          }
        }
      }
    }

    // Очищаем значения во всех слитых диапазонах, кроме мастер-ячейки (верхняя левая)
    for (const mr of mergeRanges) {
      for (let r = mr.r1; r <= mr.r2; r++) {
        for (let c = mr.c1; c <= mr.c2; c++) {
          if (r === mr.r1 && c === mr.c1) continue; // мастер-ячейка сохраняет значение
          const cell = worksheet.getCell(r + 1, c + 1);
          cell.value = null;
        }
      }
    }

    // Специальная дата отчета в A1 — после мерджей с учетом смещения
    if (sheet?.template?.name?.includes('Отчет')) {
      const a1 = worksheet.getCell(1, 1);
      a1.value = getReportDateString();
      
      // Устанавливаем значения заголовков для слитых блоков с учетом смещения
      // C1 теперь на позиции 3 (колонка 2 исходная + 1)
      const c1 = worksheet.getCell(1, 3);
      c1.value = 'Выселение';
      
      // G1 теперь на позиции 6 (была колонка 6, но после исключения 5 стала позицией 6)
      const g1 = worksheet.getCell(1, 6);
      g1.value = 'Заселение';
      
      // Выравнивание шапки по центру для мастер-ячейки каждого слитого заголовка
      const headerMasters: Array<[number, number]> = [[1, 1], [1, 3], [1, 6]];
      headerMasters.forEach(([r, c]) => {
        try {
          const cell = worksheet.getCell(r, c);
          cell.alignment = { ...(cell.alignment || {}), horizontal: 'center', vertical: 'middle' } as any;
          cell.font = { ...(cell.font || {}), bold: true, size: 16 } as any;
        } catch (e) {
          // Игнорируем ошибки если ячейка не существует
        }
      });
    }

    // Дополнительно: принудительно задать A1 перед сохранением, если вдруг осталось пусто
    if (sheet?.template?.name?.includes('Отчет')) {
      const enforcedDate = getReportDateString();
      const a1v = worksheet.getCell(1, 1).value;
      if (!a1v || (typeof a1v === 'string' && a1v.trim() === '')) {
        worksheet.getCell(1, 1).value = enforcedDate;
      }
    }

    // Границы второй строки с учетом смещения колонок
    if (sheet?.template?.name?.includes('Отчет') && totalRows > 1) {
      const thin = { style: 'thin', color: { argb: 'FF000000' } } as any;
      // Рассчитываем количество видимых колонок
      let visibleColCount = 0;
      for (let col = 0; col < totalCols; col++) {
        if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
        visibleColCount++;
      }
      
      for (let c = 1; c <= visibleColCount; c++) {
        const cell = worksheet.getCell(2, c);
        cell.border = {
          top: thin,
          left: thin,
          bottom: thin,
          right: thin
        } as any;
      }
    }

    // Жирная нижняя граница для концов групп ("X" и следующая строка "X дубль") по колонке A
    if (isDMDCottageReport) {
      // Собираем видимые колонки
      const visibleCols: number[] = [];
      for (let col = 0; col < totalCols; col++) {
        if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
        visibleCols.push(col);
      }
      const medium = { style: 'medium', color: { argb: 'FF000000' } } as any;
      for (let r = 0; r < totalRows - 1; r++) {
        const v1 = (getCellValue(r, 0) || '').toString().trim().toLowerCase();
        const v2 = (getCellValue(r + 1, 0) || '').toString().trim().toLowerCase();
        if (!v1 || !v2) continue;
        if (v2 === `${v1} дубль`) {
          // Применяем нижнюю границу для второй строки пары (r+1) по всем видимым колонкам
          let excelC = 1;
          for (let col = 0; col < totalCols; col++) {
            if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
            const cell = worksheet.getCell((r + 1) + 1, excelC); // r+1 (вторая строка) + 1 для 1-based
            const existing = cell.border || {};
            cell.border = { ...existing, bottom: medium } as any;
            excelC++;
          }
        }
      }
    }

    // Запись файла
    const safeName = (sheet.name || 'Report').replace(/[\\/?*\[\]:]/g, '').trim().slice(0, 31) || 'Report';
    const dateForName = getReportDateString();
    const fileName = dateForName ? `${safeName} ${dateForName}` : safeName;
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Ошибка генерации XLSX через ExcelJS.writeBuffer:', err);
    }
  };

  // Функция для экспорта в CSV (только данные; форматирование в CSV не поддерживается)
  const handleExportCSV = () => {
    const data: any[][] = [];
    for (let row = 0; row < (sheet.rowCount || 100); row++) {
      const rowData: any[] = [];
      for (let col = 0; col < (sheet.columnCount || 26); col++) {
        // Пропускаем скрытые колонки для шаблона отчета
        if (sheet?.templateId === 2 && (col === 5 || col === 8 || col === 15)) continue;
        
        let sourceCol = col;
        // Для шаблона отчета: колонка 16 записывается на место колонки 15
        if (sheet?.templateId === 2 && col === 16) {
          sourceCol = 16;
        }
        
        rowData.push(getCellValue(row, sourceCol));
      }
      data.push(rowData);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const csvBody = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
    const csvContent = `sep=;\n${csvBody}`;
    // Добавляем BOM для корректного открытия в Excel с UTF-8
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${sheet.name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Автоматически применять автонастройку после изменения даты отчета (один раз на значение даты)
  const lastAutoResizedDateRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!isReportSheet) return;
    if (!reportDate) return;
    if (lastAutoResizedDateRef.current === reportDate) return;
    if (cells.size === 0) return; // ждем загрузку ячеек
    if (isAutoResizeRunningRef.current) return; // предотвращаем конфликт
    
    // Сбрасываем флаг автосортировки при изменении даты для DMD Cottage отчетов
    if (isDMDCottageReport) {
      console.log('🔄 Сброс флага автосортировки при изменении даты отчета');
      hasAutoSortedRef.current = false;
      needsResizeAfterSortRef.current = false;
    }
    
    console.log('📅 Запуск автонастройки при изменении даты отчета:', reportDate);
    
    Promise.resolve(handleAutoResize()).finally(() => {
      lastAutoResizedDateRef.current = reportDate;
      
      // Запускаем автосортировку после завершения автонастройки размеров
      if (isDMDCottageReport && !hasAutoSortedRef.current) {
        console.log('🚀 Запуск автосортировки после изменения даты отчета');
        setTimeout(() => {
          sortByColumnAForDMDCottage();
          hasAutoSortedRef.current = true;
          needsResizeAfterSortRef.current = true;
          calculateDoplataForDMDCottage();
        }, 500);
      }
    });
  }, [reportDate, isReportSheet, cells.size, handleAutoResize, isDMDCottageReport, sortByColumnAForDMDCottage, calculateDoplataForDMDCottage]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Панель инструментов */}
      <FormatToolbar
        selectedCells={selectedRange}
        onFormat={handleFormat}
        onAddRow={handleAddRow}
        onAddColumn={handleAddColumn}
        onShowHistory={handleShowHistory}
        onAutoResize={handleAutoResize}
        userPermissions={userPermissions}
        isReportSheet={isReportSheet}
      />

      {/* Кнопки экспорта только для отчетов */}
      {isReportSheet && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={handleExportExcel}>Экспорт в Excel</Button>
          <Button variant="outlined" onClick={handleExportCSV}>Экспорт в CSV</Button>
        </Stack>
      )}

      {/* Таблица */}
      <Paper 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          outline: 'none', // Убираем стандартный outline при фокусе
          '&:focus': {
            outline: 'none'
          }
        }} 
        onMouseUp={handleMouseUp}
        onScroll={handleScroll}
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
        <Box ref={gridContainerRef} sx={{ display: 'inline-block', minWidth: '100%' }} key={renderKey}>
          {/* Headers */}
          <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 1 }}>
            {!hideRowNumbers && <Box sx={{ width: 50, height: 30 }} />}{/* Corner cell */}
            {renderColumnHeaders()}
          </Box>
          {/* Кастомная шапка для отчетов */}
          {sheet?.template?.name?.includes('Отчет') && (
            <Box sx={{ display: 'flex', position: 'sticky', top: 30, zIndex: 1 }}>
              {!hideRowNumbers && <Box sx={{ width: 50, height: 30 }} />}
              {/* A1:B1 - только дата */}
              <Box
                sx={{
                  width: (getColumnWidth(0) + getColumnWidth(1)),
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              >
                {reportDate ? reportDate.split('-').reverse().join('.') : ''}
              </Box>
              {/* C1:F1 - Выселение (исключая колонку 5) */}
              <Box
                sx={{
                  width: [2,3,4,5].filter(col => !(sheet?.templateId === 2 && col === 5)).reduce((acc, col) => acc + getColumnWidth(col), 0),
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderLeft: sheet?.template?.name === 'Отчет заселения/выселения DMD Cottage' ? '2px solid #000000' : '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              >
                Выселение
              </Box>
              {/* G1:Q1 (6-16) - Заселение, исключая колонки 8 и 15 */}
              <Box
                sx={{
                  width: Array.from({length: 11}, (_, i) => i+6).filter(col => !(sheet?.templateId === 2 && (col === 8 || col === 15))).map(col => getColumnWidth(col)).reduce((a,b)=>a+b,0),
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderLeft: sheet?.template?.name === 'Отчет заселения/выселения DMD Cottage' ? '2px solid #000000' : '1px solid #e0e0e0',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              >
                Заселение
              </Box>
            </Box>
          )}
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