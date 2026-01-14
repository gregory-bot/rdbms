import { Table } from './table.js';
import { Storage } from './storage.js';
import { SQLParser } from './parser.js';
export class Database {
    constructor(dataDir) {
        this.tables = new Map();
        this.storage = new Storage(dataDir);
        this.parser = new SQLParser();
        this.loadExistingTables();
    }
    execute(sql) {
        const startTime = Date.now();
        try {
            const query = this.parser.parse(sql);
            let result;
            switch (query.type) {
                case 'CREATE_TABLE':
                    result = this.executeCreateTable(query);
                    break;
                case 'INSERT':
                    result = this.executeInsert(query);
                    break;
                case 'SELECT':
                    result = this.executeSelect(query);
                    break;
                case 'UPDATE':
                    result = this.executeUpdate(query);
                    break;
                case 'DELETE':
                    result = this.executeDelete(query);
                    break;
                case 'DROP_TABLE':
                    result = this.executeDropTable(query);
                    break;
                default:
                    result = {
                        success: false,
                        error: 'Unknown query type'
                    };
            }
            result.executionTime = Date.now() - startTime;
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }
    executeCreateTable(query) {
        if (!query.tableName || !query.columns) {
            return { success: false, error: 'Invalid CREATE TABLE query' };
        }
        if (this.tables.has(query.tableName)) {
            return { success: false, error: `Table ${query.tableName} already exists` };
        }
        const primaryKey = query.columns.find((c) => c.primaryKey)?.name;
        const uniqueKeys = query.columns
            .filter((c) => c.unique || c.primaryKey)
            .map((c) => c.name);
        const schema = {
            name: query.tableName,
            columns: query.columns,
            primaryKey,
            uniqueKeys
        };
        const table = new Table(schema, this.storage);
        this.tables.set(query.tableName, table);
        return {
            success: true,
            message: `Table ${query.tableName} created successfully`
        };
    }
    executeInsert(query) {
        const table = this.tables.get(query.tableName);
        if (!table) {
            return { success: false, error: `Table ${query.tableName} does not exist` };
        }
        const result = table.insert(query.values);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        return {
            success: true,
            rowsAffected: result.rowsAffected,
            message: `Inserted ${result.rowsAffected} row(s)`
        };
    }
    executeSelect(query) {
        const table = this.tables.get(query.tableName);
        if (!table) {
            return { success: false, error: `Table ${query.tableName} does not exist` };
        }
        if (query.joinClause) {
            return this.executeJoin(query);
        }
        const result = table.select(query.selectColumns, query.whereClause);
        return {
            success: true,
            rows: result.rows,
            rowsScanned: result.rowsScanned,
            indexUsed: result.indexUsed
        };
    }
    executeJoin(query) {
        const leftTable = this.tables.get(query.tableName);
        const rightTable = this.tables.get(query.joinClause.table);
        if (!leftTable || !rightTable) {
            return { success: false, error: 'One or both tables in JOIN do not exist' };
        }
        const leftRows = leftTable.getAllRows();
        const rightRows = rightTable.getAllRows();
        const joinedRows = [];
        let rowsScanned = 0;
        leftRows.forEach(leftRow => {
            rightRows.forEach(rightRow => {
                rowsScanned++;
                const leftValue = leftRow[query.joinClause.on.leftColumn];
                const rightValue = rightRow[query.joinClause.on.rightColumn];
                if (leftValue === rightValue) {
                    const joined = {};
                    Object.keys(leftRow).forEach(key => {
                        joined[`${query.tableName}.${key}`] = leftRow[key];
                        joined[key] = leftRow[key];
                    });
                    Object.keys(rightRow).forEach(key => {
                        joined[`${query.joinClause.table}.${key}`] = rightRow[key];
                        if (!joined.hasOwnProperty(key)) {
                            joined[key] = rightRow[key];
                        }
                    });
                    joinedRows.push(joined);
                }
            });
        });
        let resultRows = joinedRows;
        if (query.selectColumns && !query.selectColumns.includes('*')) {
            resultRows = joinedRows.map(row => {
                const projected = {};
                query.selectColumns.forEach((col) => {
                    if (row.hasOwnProperty(col)) {
                        projected[col] = row[col];
                    }
                });
                return projected;
            });
        }
        return {
            success: true,
            rows: resultRows,
            rowsScanned
        };
    }
    executeUpdate(query) {
        const table = this.tables.get(query.tableName);
        if (!table) {
            return { success: false, error: `Table ${query.tableName} does not exist` };
        }
        const result = table.update(query.setClause, query.whereClause);
        if (!result.success) {
            return { success: false, error: result.error };
        }
        return {
            success: true,
            rowsAffected: result.rowsAffected,
            message: `Updated ${result.rowsAffected} row(s)`
        };
    }
    executeDelete(query) {
        const table = this.tables.get(query.tableName);
        if (!table) {
            return { success: false, error: `Table ${query.tableName} does not exist` };
        }
        const result = table.delete(query.whereClause);
        return {
            success: true,
            rowsAffected: result.rowsAffected,
            message: `Deleted ${result.rowsAffected} row(s)`
        };
    }
    executeDropTable(query) {
        if (!this.tables.has(query.tableName)) {
            return { success: false, error: `Table ${query.tableName} does not exist` };
        }
        this.tables.delete(query.tableName);
        this.storage.deleteTable(query.tableName);
        return {
            success: true,
            message: `Table ${query.tableName} dropped successfully`
        };
    }
    listTables() {
        return Array.from(this.tables.keys());
    }
    getTableSchema(tableName) {
        const table = this.tables.get(tableName);
        return table ? table.schema : null;
    }
    getTableIndexes(tableName) {
        const table = this.tables.get(tableName);
        if (!table)
            return [];
        const indexes = [];
        if (table.schema.primaryKey) {
            indexes.push(`${tableName}_${table.schema.primaryKey}_idx (PRIMARY KEY)`);
        }
        const uniqueKeys = table.schema.uniqueKeys || [];
        uniqueKeys.forEach(key => {
            if (key !== table.schema.primaryKey) {
                indexes.push(`${tableName}_${key}_idx (UNIQUE)`);
            }
        });
        return indexes;
    }
    loadExistingTables() {
        const tableNames = this.storage.listTables();
        tableNames.forEach(tableName => {
            const data = this.storage.loadTable(tableName);
            if (data) {
                // Ensure schema has required properties
                const schema = data.schema;
                if (!schema.uniqueKeys) {
                    schema.uniqueKeys = [];
                }
                const table = new Table(schema, this.storage, data.rows);
                this.tables.set(tableName, table);
            }
        });
    }
}
