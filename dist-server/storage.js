"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class Storage {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        if (!fs_1.default.existsSync(dataDir)) {
            fs_1.default.mkdirSync(dataDir, { recursive: true });
        }
        const indexesDir = path_1.default.join(dataDir, 'indexes');
        if (!fs_1.default.existsSync(indexesDir)) {
            fs_1.default.mkdirSync(indexesDir, { recursive: true });
        }
    }
    saveTable(tableName, schema, rows) {
        const filePath = path_1.default.join(this.dataDir, `${tableName}.table.json`);
        const data = {
            schema,
            rows
        };
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    loadTable(tableName) {
        const filePath = path_1.default.join(this.dataDir, `${tableName}.table.json`);
        if (!fs_1.default.existsSync(filePath)) {
            return null;
        }
        const data = fs_1.default.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    tableExists(tableName) {
        const filePath = path_1.default.join(this.dataDir, `${tableName}.table.json`);
        return fs_1.default.existsSync(filePath);
    }
    deleteTable(tableName) {
        const filePath = path_1.default.join(this.dataDir, `${tableName}.table.json`);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
    listTables() {
        const files = fs_1.default.readdirSync(this.dataDir);
        return files
            .filter(f => f.endsWith('.table.json'))
            .map(f => f.replace('.table.json', ''));
    }
    saveIndex(tableName, columnName, indexMap) {
        const indexPath = path_1.default.join(this.dataDir, 'indexes', `${tableName}_${columnName}.idx.json`);
        const indexData = Array.from(indexMap.entries());
        fs_1.default.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    }
    loadIndex(tableName, columnName) {
        const indexPath = path_1.default.join(this.dataDir, 'indexes', `${tableName}_${columnName}.idx.json`);
        if (!fs_1.default.existsSync(indexPath)) {
            return null;
        }
        const data = fs_1.default.readFileSync(indexPath, 'utf-8');
        const indexData = JSON.parse(data);
        return new Map(indexData);
    }
}
exports.Storage = Storage;
