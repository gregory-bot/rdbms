import { QueryResult, TableInfo } from './types';

const BASE_URL = 'https://rdbms-1.onrender.com'; // <-- your live backend

export const api = {
  async executeQuery(sql: string): Promise<QueryResult> {
    const response = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Server error: ${error}`);
    }
    return response.json();
  },

  async getTables(): Promise<TableInfo[]> {
    const response = await fetch(`${BASE_URL}/api/tables`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch tables: ${error}`);
    }
    const data = await response.json();
    return data.tables || [];
  },

  async getTable(tableName: string): Promise<TableInfo | null> {
    const response = await fetch(`${BASE_URL}/api/tables/${tableName}`);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch table: ${error}`);
    }
    const data = await response.json();
    return data.table || null;
  },
};
