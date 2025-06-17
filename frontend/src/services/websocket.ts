import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private currentSheetId: string | null = null;

  connect(token: string) {
    // В продакшене используем текущий домен, в разработке - localhost
    const SOCKET_URL = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('WebSocket подключен');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket отключен');
    });

    this.socket.on('error', (error: any) => {
      console.error('WebSocket ошибка:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSheet(sheetId: string) {
    if (this.socket && sheetId !== this.currentSheetId) {
      if (this.currentSheetId) {
        this.leaveSheet(this.currentSheetId);
      }
      
      this.socket.emit('joinSheet', { sheetId });
      this.currentSheetId = sheetId;
    }
  }

  leaveSheet(sheetId: string) {
    if (this.socket && this.currentSheetId === sheetId) {
      this.socket.emit('leaveSheet', { sheetId });
      this.currentSheetId = null;
    }
  }

  updateCell(sheetId: string, row: number, column: number, value: string, formula?: string) {
    if (this.socket) {
      this.socket.emit('updateCell', {
        sheetId,
        row,
        column,
        value,
        formula
      });
    }
  }

  onCellUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('cellUpdated', callback);
    }
  }

  onUserJoined(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('userJoined', callback);
    }
  }

  onUserLeft(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('userLeft', callback);
    }
  }

  onCellsMerged(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('cellsMerged', callback);
    }
  }

  sendCursorPosition(sheetId: string, row: number, column: number) {
    if (this.socket) {
      this.socket.emit('cursorMove', { sheetId, row, column });
    }
  }

  onUserCursor(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('userCursor', callback);
    }
  }

  lockCell(sheetId: string, row: number, column: number) {
    if (this.socket) {
      this.socket.emit('lockCell', { sheetId, row, column });
    }
  }

  unlockCell(sheetId: string, row: number, column: number) {
    if (this.socket) {
      this.socket.emit('unlockCell', { sheetId, row, column });
    }
  }

  onCellLocked(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('cellLocked', callback);
    }
  }

  onCellUnlocked(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('cellUnlocked', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new WebSocketService(); 