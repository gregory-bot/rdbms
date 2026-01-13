import fs from 'fs';
import path from 'path';
import { TableSchema, Row } from './types';

export class Storage {
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const indexesDir = path.join(dataDir, 'indexes');
    if (!fs.existsSync(indexesDir)) {
      fs.mkdirSync(indexesDir, { recursive: true });
    }
  }

  saveTable(tableName: string, schema: TableSchema, rows: Row[]): void {
    const filePath = path.join(this.dataDir, `${tableName}.table.json`);
    const data = {
      schema,
      rows
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  loadTable(tableName: string): { schema: TableSchema; rows: Row[] } | null {
    const filePath = path.join(this.dataDir, `${tableName}.table.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }

  tableExists(tableName: string): boolean {
    const filePath = path.join(this.dataDir, `${tableName}.table.json`);
    return fs.existsSync(filePath);
  }

  deleteTable(tableName: string): void {
    const filePath = path.join(this.dataDir, `${tableName}.table.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  listTables(): string[] {
    const files = fs.readdirSync(this.dataDir);
    return files
      .filter(f => f.endsWith('.table.json'))
      .map(f => f.replace('.table.json', ''));
  }

  saveIndex(tableName: string, columnName: string, indexMap: Map<any, number[]>): void {
    const indexPath = path.join(this.dataDir, 'indexes', `${tableName}_${columnName}.idx.json`);
    const indexData = Array.from(indexMap.entries());
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  }

  loadIndex(tableName: string, columnName: string): Map<any, number[]> | null {
    const indexPath = path.join(this.dataDir, 'indexes', `${tableName}_${columnName}.idx.json`);
    if (!fs.existsSync(indexPath)) {
      return null;
    }
    const data = fs.readFileSync(indexPath, 'utf-8');
    const indexData = JSON.parse(data);
    return new Map(indexData);
  }
}
