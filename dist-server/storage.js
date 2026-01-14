import fs from 'fs';
import path from 'path';
export class Storage {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const indexesDir = path.join(dataDir, 'indexes');
        if (!fs.existsSync(indexesDir)) {
            fs.mkdirSync(indexesDir, { recursive: true });
        }
    }
    saveTable(tableName, schema, rows) {
        const filePath = path.join(this.dataDir, `${tableName}.table.json`);
        const data = {
            schema,
            rows
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    loadTable(tableName) {
        const filePath = path.join(this.dataDir, `${tableName}.table.json`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    tableExists(tableName) {
        const filePath = path.join(this.dataDir, `${tableName}.table.json`);
        return fs.existsSync(filePath);
    }
    deleteTable(tableName) {
        const filePath = path.join(this.dataDir, `${tableName}.table.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    listTables() {
        const files = fs.readdirSync(this.dataDir);
        return files
            .filter(f => f.endsWith('.table.json'))
            .map(f => f.replace('.table.json', ''));
    }
    saveIndex(tableName, columnName, indexMap) {
        const indexPath = path.join(this.dataDir, 'indexes', `${tableName}_${columnName}.idx.json`);
        const indexData = Array.from(indexMap.entries());
        fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    }
    loadIndex(tableName, columnName) {
        const indexPath = path.join(this.dataDir, 'indexes', `${tableName}_${columnName}.idx.json`);
        if (!fs.existsSync(indexPath)) {
            return null;
        }
        const data = fs.readFileSync(indexPath, 'utf-8');
        const indexData = JSON.parse(data);
        return new Map(indexData);
    }
}
