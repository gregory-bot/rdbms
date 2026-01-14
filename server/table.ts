import { TableSchema, Row, ColumnDefinition, Index, WhereClause } from './types';
import { Storage } from './storage';

export class Table {
  public schema: TableSchema;
  private rows: Row[];
  private indexes: Map<string, Index>;
  private storage: Storage;
  private nextRowId: number;

  constructor(schema: TableSchema, storage: Storage, existingRows?: Row[]) {
    this.schema = schema;
    // Ensure uniqueKeys is initialized
    if (!this.schema.uniqueKeys) {
      this.schema.uniqueKeys = [];
    }
    this.rows = existingRows || [];
    this.indexes = new Map();
    this.storage = storage;
    this.nextRowId = this.rows.length;

    this.schema.uniqueKeys.forEach(colName => {
      this.createIndex(colName);
    });

    if (this.schema.primaryKey) {
      this.createIndex(this.schema.primaryKey);
    }
  }

  createIndex(columnName: string): void {
    const index: Index = {
      columnName,
      map: new Map()
    };

    this.rows.forEach((row, rowId) => {
      const value = row[columnName];
      if (value !== undefined && value !== null) {
        if (!index.map.has(value)) {
          index.map.set(value, []);
        }
        index.map.get(value)!.push(rowId);
      }
    });

    this.indexes.set(columnName, index);
    this.storage.saveIndex(this.schema.name, columnName, index.map);
  }

  insert(values: any[]): { success: boolean; error?: string; rowsAffected: number } {
    if (values.length !== this.schema.columns.length) {
      return {
        success: false,
        error: `Column count mismatch. Expected ${this.schema.columns.length}, got ${values.length}`,
        rowsAffected: 0
      };
    }

    const row: Row = {};
    for (let i = 0; i < this.schema.columns.length; i++) {
      const col = this.schema.columns[i];
      const value = values[i];

      if (col.notNull && (value === null || value === undefined)) {
        return {
          success: false,
          error: `Column ${col.name} cannot be null`,
          rowsAffected: 0
        };
      }

      if (!this.validateType(value, col.type)) {
        return {
          success: false,
          error: `Invalid type for column ${col.name}. Expected ${col.type}`,
          rowsAffected: 0
        };
      }

      row[col.name] = value;
    }

    if (this.schema.primaryKey) {
      const pkValue = row[this.schema.primaryKey];
      const existingRows = this.findByIndex(this.schema.primaryKey, pkValue);
      if (existingRows.length > 0) {
        return {
          success: false,
          error: `Duplicate primary key: ${pkValue}`,
          rowsAffected: 0
        };
      }
    }

    for (const uniqueKey of this.schema.uniqueKeys) {
      const uniqueValue = row[uniqueKey];
      const existingRows = this.findByIndex(uniqueKey, uniqueValue);
      if (existingRows.length > 0) {
        return {
          success: false,
          error: `Duplicate unique key ${uniqueKey}: ${uniqueValue}`,
          rowsAffected: 0
        };
      }
    }

    const rowId = this.nextRowId++;
    this.rows.push(row);

    this.indexes.forEach((index, colName) => {
      const value = row[colName];
      if (value !== undefined && value !== null) {
        if (!index.map.has(value)) {
          index.map.set(value, []);
        }
        index.map.get(value)!.push(rowId);
      }
    });

    this.persist();
    return { success: true, rowsAffected: 1 };
  }

  select(columns: string[], whereClause?: WhereClause): { rows: Row[]; rowsScanned: number; indexUsed?: string } {
    let resultRows: Row[];
    let rowsScanned = 0;
    let indexUsed: string | undefined;

    if (whereClause && whereClause.operator === '=' && this.indexes.has(whereClause.column)) {
      const index = this.indexes.get(whereClause.column)!;
      const rowIds = index.map.get(whereClause.value) || [];
      resultRows = rowIds.map(id => this.rows[id]).filter(r => r !== undefined);
      rowsScanned = rowIds.length;
      indexUsed = `${this.schema.name}_${whereClause.column}_idx`;
    } else {
      resultRows = this.rows.filter(row => {
        rowsScanned++;
        if (!whereClause) return true;
        return this.evaluateWhere(row, whereClause);
      });
    }

    if (columns.includes('*')) {
      return { rows: resultRows, rowsScanned, indexUsed };
    }

    const projectedRows = resultRows.map(row => {
      const projected: Row = {};
      columns.forEach(col => {
        if (row.hasOwnProperty(col)) {
          projected[col] = row[col];
        }
      });
      return projected;
    });

    return { rows: projectedRows, rowsScanned, indexUsed };
  }

  update(setClause: { [key: string]: any }, whereClause?: WhereClause): { success: boolean; rowsAffected: number; error?: string } {
    let rowsAffected = 0;

    for (let i = 0; i < this.rows.length; i++) {
      const row = this.rows[i];
      if (!whereClause || this.evaluateWhere(row, whereClause)) {
        const oldRow = { ...row };

        for (const [colName, value] of Object.entries(setClause)) {
          const col = this.schema.columns.find(c => c.name === colName);
          if (!col) {
            return {
              success: false,
              rowsAffected: 0,
              error: `Column ${colName} does not exist`
            };
          }

          if (!this.validateType(value, col.type)) {
            return {
              success: false,
              rowsAffected: 0,
              error: `Invalid type for column ${colName}. Expected ${col.type}`
            };
          }

          row[colName] = value;
        }

        this.updateIndexes(i, oldRow, row);
        rowsAffected++;
      }
    }

    if (rowsAffected > 0) {
      this.persist();
    }

    return { success: true, rowsAffected };
  }

  delete(whereClause?: WhereClause): { success: boolean; rowsAffected: number } {
    const rowsToDelete: number[] = [];

    for (let i = 0; i < this.rows.length; i++) {
      if (!whereClause || this.evaluateWhere(this.rows[i], whereClause)) {
        rowsToDelete.push(i);
      }
    }

    rowsToDelete.reverse().forEach(i => {
      const row = this.rows[i];
      this.indexes.forEach((index, colName) => {
        const value = row[colName];
        if (value !== undefined && value !== null && index.map.has(value)) {
          const rowIds = index.map.get(value)!;
          const idx = rowIds.indexOf(i);
          if (idx > -1) {
            rowIds.splice(idx, 1);
          }
          if (rowIds.length === 0) {
            index.map.delete(value);
          }
        }
      });
      this.rows.splice(i, 1);
    });

    if (rowsToDelete.length > 0) {
      this.persist();
    }

    return { success: true, rowsAffected: rowsToDelete.length };
  }

  getAllRows(): Row[] {
    return [...this.rows];
  }

  private findByIndex(columnName: string, value: any): Row[] {
    const index = this.indexes.get(columnName);
    if (!index) return [];
    const rowIds = index.map.get(value) || [];
    return rowIds.map(id => this.rows[id]).filter(r => r !== undefined);
  }

  private evaluateWhere(row: Row, where: WhereClause): boolean {
    const value = row[where.column];
    const compareValue = where.value;

    switch (where.operator) {
      case '=': return value == compareValue;
      case '!=': return value != compareValue;
      case '>': return value > compareValue;
      case '<': return value < compareValue;
      case '>=': return value >= compareValue;
      case '<=': return value <= compareValue;
      default: return false;
    }
  }

  private validateType(value: any, type: string): boolean {
    if (value === null || value === undefined) return true;

    switch (type) {
      case 'INT':
        return Number.isInteger(value);
      case 'FLOAT':
        return typeof value === 'number';
      case 'TEXT':
        return typeof value === 'string';
      case 'BOOLEAN':
        return typeof value === 'boolean';
      default:
        return false;
    }
  }

  private updateIndexes(rowId: number, oldRow: Row, newRow: Row): void {
    this.indexes.forEach((index, colName) => {
      const oldValue = oldRow[colName];
      const newValue = newRow[colName];

      if (oldValue !== newValue) {
        if (oldValue !== undefined && oldValue !== null && index.map.has(oldValue)) {
          const rowIds = index.map.get(oldValue)!;
          const idx = rowIds.indexOf(rowId);
          if (idx > -1) {
            rowIds.splice(idx, 1);
          }
          if (rowIds.length === 0) {
            index.map.delete(oldValue);
          }
        }

        if (newValue !== undefined && newValue !== null) {
          if (!index.map.has(newValue)) {
            index.map.set(newValue, []);
          }
          index.map.get(newValue)!.push(rowId);
        }
      }
    });
  }

  private persist(): void {
    this.storage.saveTable(this.schema.name, this.schema, this.rows);
    this.indexes.forEach((index, colName) => {
      this.storage.saveIndex(this.schema.name, colName, index.map);
    });
  }
}
