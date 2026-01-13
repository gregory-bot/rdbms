import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { QueryLog as QueryLogType } from '../types';

interface QueryLogProps {
  logs: QueryLogType[];
}

export function QueryLog({ logs }: QueryLogProps) {
  return (
    <div className="bg-white rounded-lg border border-green-200 shadow-sm">
      <div className="p-4 border-b border-green-200 bg-green-50">
        <h2 className="text-lg font-semibold text-green-900">Query Execution Log</h2>
        <p className="text-sm text-green-600 mt-1">
          Recent query history and performance metrics
        </p>
      </div>

      <div className="p-4">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No queries executed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-md border ${
                  log.result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {log.result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                    )}
                    <code className="text-sm font-mono text-gray-800 break-all">
                      {log.sql}
                    </code>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs ml-6">
                  {log.result.executionTime !== undefined && (
                    <span className="text-gray-600">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {log.result.executionTime}ms
                    </span>
                  )}

                  {log.result.rowsScanned !== undefined && (
                    <span className="text-gray-600">
                      Rows scanned: {log.result.rowsScanned}
                    </span>
                  )}

                  {log.result.indexUsed && (
                    <span className="text-green-700 font-medium">
                      Index: {log.result.indexUsed}
                    </span>
                  )}

                  {log.result.rowsAffected !== undefined && (
                    <span className="text-gray-600">
                      Rows affected: {log.result.rowsAffected}
                    </span>
                  )}

                  {!log.result.success && log.result.error && (
                    <span className="text-red-600">
                      Error: {log.result.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
