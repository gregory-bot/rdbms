export type DataType = 'INT' | 'TEXT' | 'BOOLEAN' | 'FLOAT';

export interface ColumnDefinition {
  name: string;
  type: DataType;
  primaryKey?: boolean;
  unique?: boolean;
  notNull?: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string;
  uniqueKeys: string[];
}

export interface Row {
  [key: string]: any;
}

export interface QueryResult {
  success: boolean;
  rows?: Row[];
  rowsAffected?: number;
  message?: string;
  error?: string;
  executionTime?: number;
  rowsScanned?: number;
  indexUsed?: string;
}

export interface TableInfo {
  name: string;
  schema: TableSchema;
  indexes: string[];
}

export interface QueryLog {
  id: number;
  sql: string;
  result: QueryResult;
  timestamp: Date;
}
