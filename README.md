# MiniRDBMS

A custom relational database management system (RDBMS) built from scratch in TypeScript, featuring SQL parsing, query execution, indexing, and a web-based interface.

## Features

### Core Database Engine
- **SQL Parser**: Supports CREATE TABLE, INSERT, SELECT, UPDATE, DELETE, DROP TABLE
- **Query Executor**: Full implementation of basic SQL operations
- **Indexing System**: Automatic indexes on primary and unique keys for optimized queries
- **Constraints**: Primary keys, unique keys, NOT NULL constraints
- **JOIN Operations**: Support for INNER JOIN queries
- **File-based Storage**: Persistent storage using JSON files

### Web Interface
- **SQL Console**: Interactive query editor with real-time execution
- **Table Explorer**: View database schema, columns, and indexes
- **CRUD Panel**: User-friendly interface for managing records
- **Query Execution Log**: Real-time performance metrics and query history

### REPL (Interactive Console)
- Command-line interface for database operations
- Built-in help and introspection commands

## Supported SQL Syntax

```sql
-- Create a table
CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

-- Insert data
INSERT INTO users VALUES (1, 'Alice', 'alice@example.com');
INSERT INTO users VALUES (2, 'Bob', 'bob@example.com');

-- Query data
SELECT * FROM users;
SELECT name, email FROM users WHERE id = 1;

-- Update records
UPDATE users SET name = 'Alice Smith' WHERE id = 1;

-- Delete records
DELETE FROM users WHERE id = 2;

-- Join tables
SELECT users.name, orders.amount
FROM users
JOIN orders ON users.id = orders.user_id;

-- Drop table
DROP TABLE users;
```

## Architecture

### Backend Components

1. **Storage Layer** (`server/storage.ts`)
   - File-based persistence
   - JSON serialization
   - Index management

2. **Table** (`server/table.ts`)
   - Row storage and manipulation
   - Index maintenance
   - Constraint enforcement

3. **SQL Parser** (`server/parser.ts`)
   - Tokenization and parsing
   - AST generation
   - Syntax validation

4. **Database Engine** (`server/database.ts`)
   - Query execution
   - Table management
   - JOIN operations

5. **REPL** (`server/repl.ts`)
   - Interactive command-line interface
   - Query history
   - Schema introspection

### Frontend Components

- **SQLConsole**: Execute SQL queries with real-time results
- **TableExplorer**: Browse database schema and structure
- **CRUDPanel**: Manage table records visually
- **QueryLog**: Track query performance and execution

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run the Web Application

Start the backend server:
```bash
npm run dev:server
```

In a separate terminal, start the frontend:
```bash
npm run dev
```

Open your browser to `http://localhost:5173`

### Run the REPL

```bash
npm run repl
```

Available REPL commands:
- `help` - Show available commands
- `show tables` - List all tables
- `describe <table>` - Show table schema
- `exit` or `quit` - Exit the REPL

## Example Usage

### Via Web Interface

1. Open the SQL Console
2. Create a table:
```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN
);
```
3. Insert data using the CRUD panel or SQL Console
4. View execution metrics in the Query Log
5. Explore the schema in the Table Explorer

### Via REPL

```bash
$ npm run repl

mydb> CREATE TABLE products (id INT PRIMARY KEY, name TEXT, price FLOAT);
✓ Table products created successfully

mydb> INSERT INTO products VALUES (1, 'Laptop', 999.99);
✓ Inserted 1 row(s)

mydb> SELECT * FROM products;
┌─────────┬────────┬──────────┬────────┐
│ (index) │   id   │   name   │  price │
├─────────┼────────┼──────────┼────────┤
│    0    │   1    │ 'Laptop' │ 999.99 │
└─────────┴────────┴──────────┴────────┘

✓ 1 row(s) returned
⏱ Execution time: 2ms
📊 Rows scanned: 1
🔍 Index used: products_id_idx
```

## Performance Features

- **Index Usage**: Automatic index selection for WHERE clauses with equality operators
- **Query Metrics**: Execution time and rows scanned tracking
- **Optimized Lookups**: Hash-based indexing for O(1) lookups on indexed columns

## Data Types

- `INT` - Integer numbers
- `FLOAT` - Floating-point numbers
- `TEXT` - String values
- `BOOLEAN` - True/false values

## Constraints

- `PRIMARY KEY` - Unique identifier for rows (automatically indexed)
- `UNIQUE` - Ensures column values are unique (automatically indexed)
- `NOT NULL` - Prevents null values

## Technical Stack

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Storage**: File-based JSON
- **Parsing**: Custom SQL parser

## Project Structure

```
├── server/
│   ├── database.ts     # Main database engine
│   ├── table.ts        # Table operations
│   ├── storage.ts      # File-based storage
│   ├── parser.ts       # SQL parser
│   ├── repl.ts         # Interactive REPL
│   ├── index.ts        # API server
│   └── types.ts        # Type definitions
├── src/
│   ├── components/     # React components
│   ├── App.tsx         # Main application
│   ├── api.ts          # API client
│   └── types.ts        # Frontend types
└── data/               # Database files (created at runtime)
```

## Limitations

- No support for complex JOINs (LEFT, RIGHT, FULL OUTER)
- Single WHERE clause condition (no AND/OR)
- No ORDER BY, GROUP BY, LIMIT clauses
- No transactions
- No concurrent access control
- In-memory index structures (rebuilt on load)

## Future Enhancements

- Advanced JOIN types
- Complex WHERE clauses with AND/OR
- ORDER BY and GROUP BY support
- Aggregate functions (COUNT, SUM, AVG, etc.)
- B-Tree indexes for range queries
- Transaction support
- Multi-user concurrency control
