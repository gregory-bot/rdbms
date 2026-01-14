import { useEffect, useState } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { TableInfo } from '../types';
import { api } from '../api';

interface TableExplorerProps {
  onRefresh?: () => void;
}

export function TableExplorer({ onRefresh }: TableExplorerProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await api.getTables();
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].name);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleRefresh = () => {
    loadTables();
    onRefresh?.();
  };

  const selectedTableInfo = tables.find((t) => t.name === selectedTable);

  return (
    <div className="bg-white rounded-lg border border-green-200 shadow-sm">
      <div className="p-4 border-b border-green-200 bg-green-50 flex items-center justify-between">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-2 text-green-600" />
          <h2 className="text-lg font-semibold text-green-900">Table Explorer</h2>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 hover:bg-green-100 rounded-md transition-colors"
          title="Refresh tables"
        >
          <RefreshCw className="w-4 h-4 text-green-600" />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-gray-500">Loading tables...</p>
        ) : tables.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No tables found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a table using the SQL Console
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Table
              </label>
              <select
                value={selectedTable || ''}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {tables.map((table) => (
                  <option key={table.name} value={table.name}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedTableInfo && (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Columns
                  </h3>
                  <div className="space-y-2">
                    {selectedTableInfo.schema.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {col.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {col.type}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {col.primaryKey && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                              PK
                            </span>
                          )}
                          {col.unique && !col.primaryKey && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                              UNIQUE
                            </span>
                          )}
                          {col.notNull && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              NOT NULL
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTableInfo.indexes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Indexes
                    </h3>
                    <div className="space-y-1">
                      {selectedTableInfo.indexes.map((idx, i) => (
                        <div
                          key={i}
                          className="text-sm text-gray-600 px-3 py-2 bg-green-50 rounded border border-green-100"
                        >
                          {idx}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
