import { useEffect, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { TableInfo } from '../types';

export function TableExplorer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTables = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getTables();
      setTables(data || []);

      if (data?.length && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch (err: any) {
      setError(err.message);
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const table = tables.find(t => t.name === selectedTable);

  return (
    <div className="bg-white rounded-lg border border-green-200 shadow-sm">
      <div className="p-4 border-b bg-green-50 flex justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-2 text-green-600" />
          <h2 className="font-semibold">Table Explorer</h2>
        </div>
        <button onClick={loadTables}>
          <RefreshCw className="w-4 h-4 text-green-600" />
        </button>
      </div>

      <div className="p-4">
        {loading && <p className="text-gray-500">Loading tables...</p>}

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && tables.length === 0 && (
          <p className="text-gray-500 text-center">
            No tables found. Create one using the SQL Console.
          </p>
        )}

        {table && (
          <>
            <select
              value={selectedTable ?? ''}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="mb-4 w-full border p-2 rounded"
            >
              {tables.map(t => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>

            <h3 className="font-semibold mb-2">Columns</h3>
            {table.schema.columns.map(col => (
              <div key={col.name} className="border p-2 rounded mb-2">
                <div className="font-medium">{col.name}</div>
                <div className="text-sm text-gray-600">{col.type}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
