export class FormulaEngine {
  private cells: Map<string, any>;

  constructor(cells: Map<string, any>) {
    this.cells = cells;
  }

  // Основные математические функции
  private functions: { [key: string]: (...args: any[]) => any } = {
    SUM: (...args: any[]) => {
      return args.flat().reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    },
    
    AVERAGE: (...args: any[]) => {
      const values = args.flat().filter(val => !isNaN(parseFloat(val)));
      return values.length > 0 ? values.reduce((sum, val) => sum + parseFloat(val), 0) / values.length : 0;
    },
    
    MIN: (...args: any[]) => {
      const values = args.flat().map(val => parseFloat(val)).filter(val => !isNaN(val));
      return values.length > 0 ? Math.min(...values) : 0;
    },
    
    MAX: (...args: any[]) => {
      const values = args.flat().map(val => parseFloat(val)).filter(val => !isNaN(val));
      return values.length > 0 ? Math.max(...values) : 0;
    },
    
    COUNT: (...args: any[]) => {
      return args.flat().filter(val => !isNaN(parseFloat(val))).length;
    },
    
    IF: (condition: any, trueValue: any, falseValue: any) => {
      return condition ? trueValue : falseValue;
    },
    
    ROUND: (number: any, digits: number = 0) => {
      const num = parseFloat(number);
      return isNaN(num) ? 0 : Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
    },
    
    ABS: (number: any) => {
      const num = parseFloat(number);
      return isNaN(num) ? 0 : Math.abs(num);
    },
    
    SQRT: (number: any) => {
      const num = parseFloat(number);
      return isNaN(num) || num < 0 ? 0 : Math.sqrt(num);
    },
    
    POWER: (base: any, exponent: any) => {
      const b = parseFloat(base);
      const e = parseFloat(exponent);
      return isNaN(b) || isNaN(e) ? 0 : Math.pow(b, e);
    }
  };

  // Преобразование адреса ячейки (A1) в координаты
  private cellAddressToCoords(address: string): { row: number; column: number } | null {
    const match = address.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const columnStr = match[1];
    const rowStr = match[2];
    
    let column = 0;
    for (let i = 0; i < columnStr.length; i++) {
      column = column * 26 + (columnStr.charCodeAt(i) - 64);
    }
    column -= 1; // Преобразуем в 0-based index
    
    const row = parseInt(rowStr) - 1; // Преобразуем в 0-based index
    
    return { row, column };
  }

  // Получение значения ячейки по адресу
  private getCellValue(address: string): number | string {
    const coords = this.cellAddressToCoords(address);
    if (!coords) return 0;
    
    const key = `${coords.row}-${coords.column}`;
    const cell = this.cells.get(key);
    
    if (!cell) return 0;
    
    // Если ячейка содержит формулу, вычисляем её
    if (cell.formula && cell.formula.startsWith('=')) {
      return this.evaluate(cell.formula);
    }
    
    const value = cell.value || '';
    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
  }

  // Разбор диапазона ячеек (A1:B5)
  private parseRange(range: string): any[] {
    const rangeParts = range.split(':');
    if (rangeParts.length !== 2) {
      // Одиночная ячейка
      return [this.getCellValue(range)];
    }
    
    const start = this.cellAddressToCoords(rangeParts[0]);
    const end = this.cellAddressToCoords(rangeParts[1]);
    
    if (!start || !end) return [];
    
    const values = [];
    for (let row = start.row; row <= end.row; row++) {
      for (let col = start.column; col <= end.column; col++) {
        const address = this.coordsToAddress(row, col);
        values.push(this.getCellValue(address));
      }
    }
    
    return values;
  }

  // Преобразование координат в адрес ячейки
  private coordsToAddress(row: number, column: number): string {
    let columnStr = '';
    let col = column + 1; // Преобразуем в 1-based
    
    while (col > 0) {
      col--;
      columnStr = String.fromCharCode(65 + (col % 26)) + columnStr;
      col = Math.floor(col / 26);
    }
    
    return columnStr + (row + 1);
  }

  // Основная функция вычисления формулы
  public evaluate(formula: string): any {
    if (!formula.startsWith('=')) {
      return formula;
    }
    
    try {
      // Убираем знак =
      let expression = formula.substring(1);
      
      // Заменяем ссылки на ячейки и диапазоны
      expression = expression.replace(/([A-Z]+\d+(?::[A-Z]+\d+)?)/g, (match) => {
        if (match.includes(':')) {
          // Диапазон ячеек
          const values = this.parseRange(match);
          return JSON.stringify(values);
        } else {
          // Одиночная ячейка
          const value = this.getCellValue(match);
          return typeof value === 'string' ? `"${value}"` : value.toString();
        }
      });
      
      // Заменяем функции
      expression = expression.replace(/(\w+)\(([^)]*)\)/g, (match, funcName, args) => {
        const upperFuncName = funcName.toUpperCase();
        if (this.functions[upperFuncName]) {
          // Парсим аргументы
          const parsedArgs = this.parseArguments(args);
          const result = this.functions[upperFuncName](...parsedArgs);
          return result.toString();
        }
        return match;
      });
      
      // Вычисляем математическое выражение
      const result = this.evaluateMathExpression(expression);
      return result;
      
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR!';
    }
  }

  // Парсинг аргументов функции
  private parseArguments(argsString: string): any[] {
    if (!argsString.trim()) return [];
    
    const args = [];
    let current = '';
    let depth = 0;
    let inString = false;
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      
      if (char === '"' && argsString[i-1] !== '\\') {
        inString = !inString;
        current += char;
      } else if (!inString) {
        if (char === ',' && depth === 0) {
          args.push(this.parseValue(current.trim()));
          current = '';
        } else {
          if (char === '(' || char === '[') depth++;
          if (char === ')' || char === ']') depth--;
          current += char;
        }
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      args.push(this.parseValue(current.trim()));
    }
    
    return args;
  }

  // Парсинг отдельного значения
  private parseValue(value: string): any {
    // Удаляем кавычки из строк
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    
    // Парсим массивы (диапазоны)
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    // Парсим числа
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue;
    }
    
    // Логические значения
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    return value;
  }

  // Безопасное вычисление математических выражений
  private evaluateMathExpression(expression: string): any {
    try {
      // Простая замена для безопасности - разрешаем только основные операции
      const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
      
      if (safeExpression !== expression.replace(/\s/g, '')) {
        // Если выражение содержит недопустимые символы, возвращаем как есть
        return expression;
      }
      
      // Используем Function constructor для безопасного вычисления
      const result = new Function('return ' + expression)();
      return isNaN(result) ? expression : result;
    } catch {
      return expression;
    }
  }
} 