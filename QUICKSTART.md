# Quick Start Guide

## Installation

```bash
npm install
```

## Running the Application

### Option 1: Web Interface (Recommended)

1. **Start the backend server** (in one terminal):
```bash
npm run dev:server
```

2. **Start the frontend** (in another terminal):
```bash
npm run dev
```

3. **Open your browser** to `http://localhost:5173`

You'll see a complete web interface with:
- SQL Console for executing queries
- Table Explorer to view database schema
- CRUD Panel for managing data visually
- Query Execution Log showing performance metrics

### Option 2: Command Line REPL

```bash
npm run repl
```

This starts an interactive command-line interface where you can type SQL queries directly.

## Quick Demo

### Using the Web Interface

1. **Create a table** - In the SQL Console, paste:
```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);
```

2. **Insert data** - Click the "Add Row" button in the CRUD Panel or use SQL:
```sql
INSERT INTO users VALUES (1, 'Alice', 'alice@example.com');
```

3. **Query data**:
```sql
SELECT * FROM users;
```

4. **Watch the metrics** - Check the Query Execution Log to see:
   - Execution time
   - Rows scanned
   - Index usage

### Using the REPL

```bash
$ npm run repl

mydb> CREATE TABLE tasks (id INT PRIMARY KEY, title TEXT, done BOOLEAN);
✓ Table tasks created successfully

mydb> INSERT INTO tasks VALUES (1, 'Learn SQL', true);
✓ Inserted 1 row(s)

mydb> SELECT * FROM tasks;
┌─────────┬────┬─────────────┬──────┐
│ (index) │ id │    title    │ done │
├─────────┼────┼─────────────┼──────┤
│    0    │ 1  │ 'Learn SQL' │ true │
└─────────┴────┴─────────────┴──────┘

mydb> show tables
Tables:
  • tasks

mydb> describe tasks
Table: tasks
Columns:
  • id (INT) [PRIMARY KEY]
  • title (TEXT)
  • done (BOOLEAN)

mydb> exit
```

## Demo Queries

See `demo-queries.sql` for a comprehensive set of example queries including:
- Table creation
- Data insertion
- SELECT queries
- JOIN operations
- UPDATE and DELETE statements
- Index usage examples

## Features to Try

1. **Indexing** - Create tables with PRIMARY KEY or UNIQUE constraints and watch the Query Log show when indexes are used

2. **JOINs** - Create multiple related tables and use JOIN to combine them

3. **CRUD Operations** - Use the visual CRUD panel to add, edit, and delete records

4. **Schema Exploration** - Use the Table Explorer to see your database structure

5. **Performance Metrics** - Execute queries and check the Query Execution Log for timing and optimization details

## Troubleshooting

- Make sure both frontend and backend servers are running for the web interface
- The backend runs on port 3001, frontend on 5173
- Database files are stored in the `data/` directory (created automatically)
- Check the console for any error messages

## Next Steps

1. Explore the supported SQL syntax in the README
2. Try creating your own tables and relationships
3. Experiment with the CRUD interface
4. Test query performance with and without indexes

Enjoy exploring your custom RDBMS!
