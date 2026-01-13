import { useState } from 'react';
import { Database } from 'lucide-react';
import { SQLConsole } from './components/SQLConsole';
import { TableExplorer } from './components/TableExplorer';
import { CRUDPanel } from './components/CRUDPanel';
import { QueryLog } from './components/QueryLog';
import { QueryResult, QueryLog as QueryLogType } from './types';

function App() {
  const [queryLogs, setQueryLogs] = useState<QueryLogType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleQueryExecuted = (sql: string, result: QueryResult) => {
    const newLog: QueryLogType = {
      id: Date.now(),
      sql,
      result,
      timestamp: new Date(),
    };
    setQueryLogs((prev) => [...prev, newLog]);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCRUDQuery = (sql: string) => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <Database className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">gregory RDBMS</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <SQLConsole onQueryExecuted={handleQueryExecuted} />
          </div>

          <div>
            <TableExplorer key={refreshKey} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CRUDPanel key={refreshKey} onQueryExecuted={handleCRUDQuery} />
          <QueryLog logs={queryLogs} />
        </div>
      </main>
    </div>
  );
}

export default App;
