import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { QueryResult } from '../types';
import { api } from '../api';

interface SQLConsoleProps {
  onQueryExecuted: (sql: string, result: QueryResult) => void;
}

export function SQLConsole({ onQueryExecuted }: SQLConsoleProps) {
  const [sql, setSql] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  const handleExecute = async () => {
    if (!sql.trim()) return;

    setLoading(true);
    try {
      const queryResult = await api.executeQuery(sql);
      setResult(queryResult);
      onQueryExecuted(sql, queryResult);
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Failed to execute query',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-green-200 shadow-sm">
      <div className="p-4 border-b border-green-200 bg-green-50">
        <h2 className="text-lg font-semibold text-green-900">SQL Console</h2>
        <p className="text-sm text-green-600 mt-1">
          Enter your SQL queries below (Cmd/Ctrl + Enter to execute)
        </p>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="SELECT * FROM users WHERE id = 1;"
            className="w-full h-32 px-3 py-2 border border-green-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={loading || !sql.trim()}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Query
            </>
          )}
        </button>

        {result && (
          <div className="mt-6">
            {result.success ? (
              <>
                {result.rows && result.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-green-200 border border-green-200 rounded-lg">
                      <thead className="bg-green-50">
                        <tr>
                          {Object.keys(result.rows[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-left text-xs font-medium text-green-900 uppercase tracking-wider"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-green-100">
                        {result.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-green-50">
                            {Object.values(row).map((value, i) => (
                              <td
                                key={i}
                                className="px-4 py-3 text-sm text-gray-700"
                              >
                                {value === null ? (
                                  <span className="text-gray-400 italic">null</span>
                                ) : typeof value === 'boolean' ? (
                                  value.toString()
                                ) : (
                                  value
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-sm text-green-600 mt-2">
                      {result.rows.length} row(s) returned
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-green-800">{result.message || 'Query executed successfully'}</p>
                    {result.rowsAffected !== undefined && (
                      <p className="text-sm text-green-600 mt-1">
                        Rows affected: {result.rowsAffected}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
