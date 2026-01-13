import express from 'express';
import cors from 'cors';
import { Database } from './database';
import { REPL } from './repl';

const app = express();
const db = new Database('./data');

app.use(cors());
app.use(express.json());

app.post('/api/query', (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ success: false, error: 'SQL query required' });
    }

    const result = db.execute(sql);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tables', (req, res) => {
  try {
    const tables = db.listTables();
    const tablesInfo = tables.map(tableName => {
      const schema = db.getTableSchema(tableName);
      const indexes = db.getTableIndexes(tableName);
      return {
        name: tableName,
        schema,
        indexes
      };
    });
    res.json({ success: true, tables: tablesInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tables/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    const schema = db.getTableSchema(tableName);
    if (!schema) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    const indexes = db.getTableIndexes(tableName);
    res.json({
      success: true,
      table: {
        name: tableName,
        schema,
        indexes
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

if (process.argv.includes('--repl')) {
  const repl = new REPL(db);
  repl.start();
} else {
  app.listen(PORT, () => {
    console.log(`MiniRDBMS API Server running on port ${PORT}`);
    console.log(`Run with --repl flag for interactive console`);
  });
}

export { db };
