import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { api } from '../api';
import { TableInfo, Row } from '../types';

interface CRUDPanelProps {
  onQueryExecuted: (sql: string) => void;
}

export function CRUDPanel({ onQueryExecuted }: CRUDPanelProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Row>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRowValues, setNewRowValues] = useState<Row>({});

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    const data = await api.getTables();
    setTables(data);
    if (data.length > 0 && !selectedTable) {
      setSelectedTable(data[0].name);
    }
  };

  const loadTableData = async (tableName: string) => {
    const result = await api.executeQuery(`SELECT * FROM ${tableName}`);
    if (result.success && result.rows) {
      setRows(result.rows);
    }
  };

  const handleAdd = async () => {
    if (!selectedTable) return;

    const tableInfo = tables.find((t) => t.name === selectedTable);
    if (!tableInfo) return;

    const values = tableInfo.schema.columns.map((col) => {
      const val = newRowValues[col.name];
      if (val === undefined || val === '') return null;
      if (col.type === 'INT' || col.type === 'FLOAT') return Number(val);
      if (col.type === 'BOOLEAN') return val === 'true';
      return `'${val}'`;
    });

    const sql = `INSERT INTO ${selectedTable} VALUES (${values.join(', ')})`;
    await api.executeQuery(sql);
    onQueryExecuted(sql);
    setShowAddForm(false);
    setNewRowValues({});
    loadTableData(selectedTable);
  };

  const handleEdit = (index: number) => {
    setEditingRow(index);
    setEditValues({ ...rows[index] });
  };

  const handleSave = async (index: number) => {
    if (!selectedTable) return;

    const tableInfo = tables.find((t) => t.name === selectedTable);
    if (!tableInfo) return;

    const setClauses = Object.entries(editValues)
      .map(([key, value]) => {
        const col = tableInfo.schema.columns.find((c) => c.name === key);
        if (!col) return null;
        if (col.type === 'INT' || col.type === 'FLOAT' || col.type === 'BOOLEAN') {
          return `${key} = ${value}`;
        }
        return `${key} = '${value}'`;
      })
      .filter(Boolean)
      .join(', ');

    const pkCol = tableInfo.schema.primaryKey;
    if (!pkCol) return;

    const pkValue = rows[index][pkCol];
    const whereClause = typeof pkValue === 'string' ? `${pkCol} = '${pkValue}'` : `${pkCol} = ${pkValue}`;

    const sql = `UPDATE ${selectedTable} SET ${setClauses} WHERE ${whereClause}`;
    await api.executeQuery(sql);
    onQueryExecuted(sql);
    setEditingRow(null);
    loadTableData(selectedTable);
  };

  const handleDelete = async (index: number) => {
    if (!selectedTable) return;

    const tableInfo = tables.find((t) => t.name === selectedTable);
    if (!tableInfo) return;

    const pkCol = tableInfo.schema.primaryKey;
    if (!pkCol) return;

    const pkValue = rows[index][pkCol];
    const whereClause = typeof pkValue === 'string' ? `${pkCol} = '${pkValue}'` : `${pkCol} = ${pkValue}`;

    const sql = `DELETE FROM ${selectedTable} WHERE ${whereClause}`;
    await api.executeQuery(sql);
    onQueryExecuted(sql);
    loadTableData(selectedTable);
  };

  const selectedTableInfo = tables.find((t) => t.name === selectedTable);

  return (
    <div className="bg-white rounded-lg border border-green-200 shadow-sm">
      <div className="p-4 border-b border-green-200 bg-green-50">
        <h2 className="text-lg font-semibold text-green-900">CRUD Operations</h2>
        <p className="text-sm text-green-600 mt-1">
          Manage your data with Create, Read, Update, Delete operations
        </p>
      </div>

      <div className="p-4">
        {tables.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tables available</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <select
                value={selectedTable || ''}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {tables.map((table) => (
                  <option key={table.name} value={table.name}>
                    {table.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Row
              </button>
            </div>

            {showAddForm && selectedTableInfo && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-medium text-gray-900 mb-3">Add New Row</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {selectedTableInfo.schema.columns.map((col) => (
                    <div key={col.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {col.name} ({col.type})
                      </label>
                      <input
                        type={col.type === 'INT' || col.type === 'FLOAT' ? 'number' : 'text'}
                        value={newRowValues[col.name] || ''}
                        onChange={(e) =>
                          setNewRowValues({ ...newRowValues, [col.name]: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRowValues({});
                    }}
                    className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {rows.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-green-200 border border-green-200 rounded-lg">
                  <thead className="bg-green-50">
                    <tr>
                      {selectedTableInfo &&
                        selectedTableInfo.schema.columns.map((col) => (
                          <th
                            key={col.name}
                            className="px-4 py-3 text-left text-xs font-medium text-green-900 uppercase tracking-wider"
                          >
                            {col.name}
                          </th>
                        ))}
                      <th className="px-4 py-3 text-right text-xs font-medium text-green-900 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-100">
                    {rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-green-50">
                        {selectedTableInfo &&
                          selectedTableInfo.schema.columns.map((col) => (
                            <td key={col.name} className="px-4 py-3 text-sm text-gray-700">
                              {editingRow === idx ? (
                                <input
                                  type={col.type === 'INT' || col.type === 'FLOAT' ? 'number' : 'text'}
                                  value={editValues[col.name] || ''}
                                  onChange={(e) =>
                                    setEditValues({ ...editValues, [col.name]: e.target.value })
                                  }
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span>
                                  {row[col.name] === null ? (
                                    <span className="text-gray-400 italic">null</span>
                                  ) : (
                                    String(row[col.name])
                                  )}
                                </span>
                              )}
                            </td>
                          ))}
                        <td className="px-4 py-3 text-sm text-right">
                          {editingRow === idx ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSave(idx)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRow(null)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEdit(idx)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(idx)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
