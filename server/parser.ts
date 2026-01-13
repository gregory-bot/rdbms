import { ParsedQuery, ColumnDefinition, WhereClause, JoinClause, DataType } from './types';

export class SQLParser {
  parse(sql: string): ParsedQuery {
    const trimmed = sql.trim().replace(/;$/, '');
    const upperSQL = trimmed.toUpperCase();

    if (upperSQL.startsWith('CREATE TABLE')) {
      return this.parseCreateTable(trimmed);
    } else if (upperSQL.startsWith('INSERT INTO')) {
      return this.parseInsert(trimmed);
    } else if (upperSQL.startsWith('SELECT')) {
      return this.parseSelect(trimmed);
    } else if (upperSQL.startsWith('UPDATE')) {
      return this.parseUpdate(trimmed);
    } else if (upperSQL.startsWith('DELETE FROM')) {
      return this.parseDelete(trimmed);
    } else if (upperSQL.startsWith('DROP TABLE')) {
      return this.parseDropTable(trimmed);
    }

    throw new Error(`Unsupported SQL statement: ${sql}`);
  }

  private parseCreateTable(sql: string): ParsedQuery {
    const match = sql.match(/CREATE TABLE\s+(\w+)\s*\((.*)\)/i);
    if (!match) {
      throw new Error('Invalid CREATE TABLE syntax');
    }

    const tableName = match[1];
    const columnsDef = match[2];

    const columns: ColumnDefinition[] = [];
    let primaryKey: string | undefined;

    const parts = this.splitByComma(columnsDef);

    parts.forEach(part => {
      const trimmed = part.trim();
      const upperPart = trimmed.toUpperCase();

      if (upperPart.startsWith('PRIMARY KEY')) {
        const pkMatch = trimmed.match(/PRIMARY KEY\s*\((\w+)\)/i);
        if (pkMatch) {
          primaryKey = pkMatch[1];
        }
        return;
      }

      const tokens = trimmed.split(/\s+/);
      if (tokens.length < 2) return;

      const colName = tokens[0];
      const colType = tokens[1].toUpperCase() as DataType;

      const column: ColumnDefinition = {
        name: colName,
        type: colType
      };

      const restUpper = tokens.slice(2).join(' ').toUpperCase();

      if (restUpper.includes('PRIMARY KEY')) {
        column.primaryKey = true;
        primaryKey = colName;
      }

      if (restUpper.includes('UNIQUE')) {
        column.unique = true;
      }

      if (restUpper.includes('NOT NULL')) {
        column.notNull = true;
      }

      columns.push(column);
    });

    return {
      type: 'CREATE_TABLE',
      tableName,
      columns
    };
  }

  private parseInsert(sql: string): ParsedQuery {
    const match = sql.match(/INSERT INTO\s+(\w+)\s+VALUES\s*\((.*)\)/i);
    if (!match) {
      throw new Error('Invalid INSERT syntax');
    }

    const tableName = match[1];
    const valuesPart = match[2];

    const values = this.parseValues(valuesPart);

    return {
      type: 'INSERT',
      tableName,
      values
    };
  }

  private parseSelect(sql: string): ParsedQuery {
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)/i);
    if (!selectMatch) {
      throw new Error('Invalid SELECT syntax');
    }

    const columnsStr = selectMatch[1].trim();
    const tableName = selectMatch[2];

    const selectColumns = columnsStr === '*'
      ? ['*']
      : columnsStr.split(',').map(c => c.trim().split('.').pop() || c.trim());

    let whereClause: WhereClause | undefined;
    let joinClause: JoinClause | undefined;

    const whereMatch = sql.match(/WHERE\s+(.+?)(?:$|JOIN|ORDER BY|GROUP BY|LIMIT)/i);
    if (whereMatch) {
      whereClause = this.parseWhere(whereMatch[1].trim());
    }

    const joinMatch = sql.match(/(?:INNER\s+)?JOIN\s+(\w+)\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
    if (joinMatch) {
      joinClause = {
        type: 'INNER',
        table: joinMatch[1],
        on: {
          leftTable: joinMatch[2],
          leftColumn: joinMatch[3],
          rightTable: joinMatch[4],
          rightColumn: joinMatch[5]
        }
      };
    }

    return {
      type: 'SELECT',
      tableName,
      selectColumns,
      whereClause,
      joinClause
    };
  }

  private parseUpdate(sql: string): ParsedQuery {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) {
      throw new Error('Invalid UPDATE syntax');
    }

    const tableName = match[1];
    const setPart = match[2];
    const wherePart = match[3];

    const setClause: { [key: string]: any } = {};
    const setPairs = setPart.split(',');
    setPairs.forEach(pair => {
      const [col, val] = pair.split('=').map(s => s.trim());
      setClause[col] = this.parseValue(val);
    });

    let whereClause: WhereClause | undefined;
    if (wherePart) {
      whereClause = this.parseWhere(wherePart);
    }

    return {
      type: 'UPDATE',
      tableName,
      setClause,
      whereClause
    };
  }

  private parseDelete(sql: string): ParsedQuery {
    const match = sql.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
    if (!match) {
      throw new Error('Invalid DELETE syntax');
    }

    const tableName = match[1];
    const wherePart = match[2];

    let whereClause: WhereClause | undefined;
    if (wherePart) {
      whereClause = this.parseWhere(wherePart);
    }

    return {
      type: 'DELETE',
      tableName,
      whereClause
    };
  }

  private parseDropTable(sql: string): ParsedQuery {
    const match = sql.match(/DROP TABLE\s+(\w+)/i);
    if (!match) {
      throw new Error('Invalid DROP TABLE syntax');
    }

    return {
      type: 'DROP_TABLE',
      tableName: match[1]
    };
  }

  private parseWhere(wherePart: string): WhereClause {
    const operators = ['>=', '<=', '!=', '=', '>', '<'];

    for (const op of operators) {
      if (wherePart.includes(op)) {
        const [col, val] = wherePart.split(op).map(s => s.trim());
        return {
          column: col.split('.').pop() || col,
          operator: op as any,
          value: this.parseValue(val)
        };
      }
    }

    throw new Error(`Invalid WHERE clause: ${wherePart}`);
  }

  private parseValues(valuesPart: string): any[] {
    return this.splitByComma(valuesPart).map(v => this.parseValue(v.trim()));
  }

  private parseValue(value: string): any {
    value = value.trim();

    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }

    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    if (value.toLowerCase() === 'null') return null;

    if (!isNaN(Number(value))) {
      return Number(value);
    }

    return value;
  }

  private splitByComma(str: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if ((char === "'" || char === '"') && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        current += char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
        current += char;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }
}
