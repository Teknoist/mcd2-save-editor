// History/undo-redo service for save editor
import type { SaveFile } from './types';

export interface HistoryRecord {
  id: number;
  timestamp: number;
  description: string;
  data: string; // JSON snapshot
}

class HistoryService {
  private stack: HistoryRecord[] = [];
  private pointer: number = -1;
  private idCounter: number = 0;
  private maxSize: number = 50;

  push(description: string, data: SaveFile): void {
    // Remove any redo history after current pointer
    this.stack = this.stack.slice(0, this.pointer + 1);
    
    this.stack.push({
      id: ++this.idCounter,
      timestamp: Date.now(),
      description,
      data: JSON.stringify(data)
    });
    
    // Keep max size
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    } else {
      this.pointer = this.stack.length - 1;
    }
    
    if (this.stack.length <= this.maxSize) {
      this.pointer = this.stack.length - 1;
    }
  }

  canUndo(): boolean {
    return this.pointer > 0;
  }

  canRedo(): boolean {
    return this.pointer < this.stack.length - 1;
  }

  undo(): { data: SaveFile; description: string } | null {
    if (!this.canUndo()) return null;
    this.pointer--;
    const record = this.stack[this.pointer];
    return { data: JSON.parse(record.data), description: record.description };
  }

  redo(): { data: SaveFile; description: string } | null {
    if (!this.canRedo()) return null;
    this.pointer++;
    const record = this.stack[this.pointer];
    return { data: JSON.parse(record.data), description: record.description };
  }

  getCurrentDescription(): string {
    if (this.pointer >= 0) return this.stack[this.pointer].description;
    return '';
  }

  getHistory(): HistoryRecord[] {
    return [...this.stack];
  }

  clear(): void {
    this.stack = [];
    this.pointer = -1;
  }
}

export const historyService = new HistoryService();
