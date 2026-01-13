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

export interface Index {
  columnName: string;
  map: Map<any, number[]>;
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

export interface ParsedQuery {
  type: 'CREATE_TABLE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'DROP_TABLE';
  tableName?: string;
  columns?: ColumnDefinition[];
  values?: any[];
  selectColumns?: string[];
  whereClause?: WhereClause;
  setClause?: { [key: string]: any };
  joinClause?: JoinClause;
}

export interface WhereClause {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=';
  value: any;
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  table: string;
  on: {
    leftTable: string;
    leftColumn: string;
    rightTable: string;
    rightColumn: string;
  };
}
