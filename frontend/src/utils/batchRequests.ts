// Утилита для пакетной обработки запросов ячеек
export const BATCH_SIZE = 50;
export const BATCH_DELAY = 100; // мс между пакетами

export interface CellUpdate {
  row: number;
  column: number;
  value?: string;
  formula?: string;
  format?: any;
}

export interface BatchResult {
  success: boolean;
  processed: number;
  errors: string[];
}

// Группировка ячеек в пакеты по размеру
export function chunkCells(cells: CellUpdate[], batchSize: number = BATCH_SIZE): CellUpdate[][] {
  const chunks: CellUpdate[][] = [];
  for (let i = 0; i < cells.length; i += batchSize) {
    chunks.push(cells.slice(i, i + batchSize));
  }
  return chunks;
}

// Задержка между пакетами для избежания перегрузки сервера
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Дебаунсинг для группировки быстро следующих друг за другом обновлений
export class BatchDebouncer {
  private pendingUpdates: Map<string, CellUpdate> = new Map();
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly debounceTime: number;
  private readonly onFlush: (cells: CellUpdate[]) => Promise<void>;

  constructor(debounceTime: number = 300, onFlush: (cells: CellUpdate[]) => Promise<void>) {
    this.debounceTime = debounceTime;
    this.onFlush = onFlush;
  }

  // Добавление ячейки в очередь обновления
  addUpdate(cellUpdate: CellUpdate): void {
    const key = `${cellUpdate.row}-${cellUpdate.column}`;
    
    // Объединяем обновления для одной и той же ячейки
    const existing = this.pendingUpdates.get(key);
    if (existing) {
      this.pendingUpdates.set(key, {
        ...existing,
        ...cellUpdate
      });
    } else {
      this.pendingUpdates.set(key, cellUpdate);
    }

    // Перезапускаем таймер дебаунсинга
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.debounceTime);
  }

  // Принудительная отправка всех накопленных обновлений
  async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.pendingUpdates.size === 0) {
      return;
    }

    const updates = Array.from(this.pendingUpdates.values());
    this.pendingUpdates.clear();

    await this.onFlush(updates);
  }

  // Очистка без отправки
  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingUpdates.clear();
  }
}

// Создание ключа для уникальной идентификации ячейки
export function getCellKey(row: number, column: number): string {
  return `${row}-${column}`;
}
