import { QueryResult, TableInfo } from './types';

export const api = {
  async executeQuery(sql: string): Promise<QueryResult> {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });
    return response.json();
  },

  async getTables(): Promise<TableInfo[]> {
    const response = await fetch('/api/tables');
    const data = await response.json();
    return data.tables || [];
  },

  async getTable(tableName: string): Promise<TableInfo | null> {
    const response = await fetch(`/api/tables/${tableName}`);
    const data = await response.json();
    return data.table || null;
  },
};
