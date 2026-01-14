import {
  ParsedQuery,
  ColumnDefinition,
  WhereClause,
  JoinClause,
  DataType
} from './types';

export class SQLParser {

  parse(sql: string): ParsedQuery {
    const trimmed = sql.trim().replace(/;$/, '');
    const upperSQL = trimmed.toUpperCase();

    if (upperSQL.startsWith('CREATE TABLE')) return this.parseCreateTable(trimmed);
    if (upperSQL.startsWith('INSERT INTO')) return this.parseInsert(trimmed);
    if (upperSQL.startsWith('SELECT')) return this.parseSelect(trimmed);
    if (upperSQL.startsWith('UPDATE')) return this.parseUpdate(trimmed);
    if (upperSQL.startsWith('DELETE FROM')) return this.parseDelete(trimmed);
    if (upperSQL.startsWith('DROP TABLE')) return this.parseDropTable(trimmed);

    throw new Error(`Unsupported SQL statement: ${sql}`);
  }

  // =========================
  // CREATE TABLE
  // =========================
  private parseCreateTable(sql: string): ParsedQuery {
    const match = sql.match(/CREATE TABLE\s+(\w+)\s*\(([\s\S]+)\)/i);
    if (!match) {
      throw new Error('Invalid CREATE TABLE syntax');
    }

    const tableName = match[1];
    const columnsDef = match[2];

    const columns: ColumnDefinition[] = [];
    let tablePrimaryKey: string | undefined;

    const parts = this.splitByComma(columnsDef);

    for (const part of parts) {
      const trimmed = part.trim();
      const upper = trimmed.toUpperCase();

      // ✅ SKIP table-level constraints
      if (
        upper.startsWith('UNIQUE') ||
        upper.startsWith('FOREIGN KEY') ||
        upper.startsWith('CHECK')
      ) {
        continue;
      }

      // ✅ Handle table-level PRIMARY KEY
      if (upper.startsWith('PRIMARY KEY')) {
        const pkMatch = trimmed.match(/PRIMARY KEY\s*\((\w+)\)/i);
        if (!pkMatch) {
          throw new Error('Invalid PRIMARY KEY definition');
        }
        tablePrimaryKey = pkMatch[1];
        continue;
      }

      // ✅ Column definition
      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 2) {
        throw new Error(`Invalid column definition: ${trimmed}`);
      }

      const name = tokens[0];
      const type = tokens[1].toUpperCase() as DataType;

      const column: ColumnDefinition = { name, type };

      const modifiers = tokens.slice(2).join(' ').toUpperCase();

      if (modifiers.includes('PRIMARY KEY')) {
        column.primaryKey = true;
        tablePrimaryKey = name;
      }

      if (modifiers.includes('UNIQUE')) {
        column.unique = true;
      }

      if (modifiers.includes('NOT NULL')) {
        column.notNull = true;
      }

      columns.push(column);
    }

    // ✅ Apply table-level PRIMARY KEY
    if (tablePrimaryKey) {
      const pkColumn = columns.find(c => c.name === tablePrimaryKey);
      if (!pkColumn) {
        throw new Error(`Primary key column '${tablePrimaryKey}' not found`);
      }
      pkColumn.primaryKey = true;
    }

    return {
      type: 'CREATE_TABLE',
      tableName,
      columns
    };
  }

  // =========================
  // INSERT
  // =========================
  private parseInsert(sql: string): ParsedQuery {
    const match = sql.match(/INSERT INTO\s+(\w+)\s+VALUES\s*\(([\s\S]+)\)/i);
    if (!match) {
      throw new Error('Invalid INSERT syntax');
    }

    return {
      type: 'INSERT',
      tableName: match[1],
      values: this.parseValues(match[2])
    };
  }

  // =========================
  // SELECT
  // =========================
  private parseSelect(sql: string): ParsedQuery {
    const match = sql.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)/i);
    if (!match) throw new Error('Invalid SELECT syntax');

    const columnsStr = match[1].trim();
    const tableName = match[2];

    const selectColumns =
      columnsStr === '*'
        ? ['*']
        : columnsStr.split(',').map(c => c.trim().split('.').pop()!);

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:$|JOIN|ORDER BY|GROUP BY|LIMIT)/i);
    const joinMatch = sql.match(
      /(?:INNER\s+)?JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i
    );

    return {
      type: 'SELECT',
      tableName,
      selectColumns,
      whereClause: whereMatch ? this.parseWhere(whereMatch[1].trim()) : undefined,
      joinClause: joinMatch
        ? {
            type: 'INNER',
            table: joinMatch[1],
            on: {
              leftTable: joinMatch[2],
              leftColumn: joinMatch[3],
              rightTable: joinMatch[4],
              rightColumn: joinMatch[5]
            }
          }
        : undefined
    };
  }

  // =========================
  // UPDATE
  // =========================
  private parseUpdate(sql: string): ParsedQuery {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) throw new Error('Invalid UPDATE syntax');

    const setClause: Record<string, any> = {};
    match[2].split(',').forEach(pair => {
      const [col, val] = pair.split('=').map(s => s.trim());
      setClause[col] = this.parseValue(val);
    });

    return {
      type: 'UPDATE',
      tableName: match[1],
      setClause,
      whereClause: match[3] ? this.parseWhere(match[3]) : undefined
    };
  }

  // =========================
  // DELETE
  // =========================
  private parseDelete(sql: string): ParsedQuery {
    const match = sql.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) throw new Error('Invalid DELETE syntax');

    return {
      type: 'DELETE',
      tableName: match[1],
      whereClause: match[2] ? this.parseWhere(match[2]) : undefined
    };
  }

  // =========================
  // DROP TABLE
  // =========================
  private parseDropTable(sql: string): ParsedQuery {
    const match = sql.match(/DROP TABLE\s+(\w+)/i);
    if (!match) throw new Error('Invalid DROP TABLE syntax');

    return { type: 'DROP_TABLE', tableName: match[1] };
  }

  // =========================
  // WHERE
  // =========================
  private parseWhere(wherePart: string): WhereClause {
    const operators = ['>=', '<=', '!=', '=', '>', '<'];

    for (const op of operators) {
      if (wherePart.includes(op)) {
        const [col, val] = wherePart.split(op).map(s => s.trim());
        return {
          column: col.split('.').pop()!,
          operator: op as any,
          value: this.parseValue(val)
        };
      }
    }

    throw new Error(`Invalid WHERE clause: ${wherePart}`);
  }

  // =========================
  // VALUES
  // =========================
  private parseValues(valuesPart: string): any[] {
    return this.splitByComma(valuesPart).map(v => this.parseValue(v.trim()));
  }

  private parseValue(value: string): any {
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1);
    }

    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (value.toLowerCase() === 'null') return null;
    if (!isNaN(Number(value))) return Number(value);

    return value;
  }

  // =========================
  // UTIL
  // =========================
  private splitByComma(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (const char of str) {
      if ((char === "'" || char === '"') && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      }

      if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }
}
