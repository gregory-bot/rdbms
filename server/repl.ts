import * as readline from 'readline';
import { Database } from './database.js';

export class REPL {
  private db: Database;
  private rl: readline.Interface;

  constructor(db: Database) {
    this.db = db;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'mydb> '
    });
  }

  start(): void {
    console.log('='.repeat(50));
    console.log('Welcome to MiniRDBMS - Interactive SQL Console');
    console.log('='.repeat(50));
    console.log('Type your SQL queries or "help" for commands');
    console.log('Type "exit" or "quit" to exit\n');

    this.rl.prompt();

    this.rl.on('line', (line: string) => {
      const trimmed = line.trim();

      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        console.log('Goodbye!');
        this.rl.close();
        process.exit(0);
      }

      if (trimmed.toLowerCase() === 'help') {
        this.showHelp();
        this.rl.prompt();
        return;
      }

      if (trimmed.toLowerCase() === 'show tables') {
        this.showTables();
        this.rl.prompt();
        return;
      }

      if (trimmed.toLowerCase().startsWith('describe ')) {
        const tableName = trimmed.substring(9).trim();
        this.describeTable(tableName);
        this.rl.prompt();
        return;
      }

      this.executeQuery(trimmed);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye!');
      process.exit(0);
    });
  }

  private executeQuery(sql: string): void {
    const result = this.db.execute(sql);

    if (!result.success) {
      console.log(`\n❌ Error: ${result.error}\n`);
      return;
    }

    if (result.rows && result.rows.length > 0) {
      console.log('');
      console.table(result.rows);
      console.log(`\n✓ ${result.rows.length} row(s) returned`);
    } else if (result.message) {
      console.log(`\n✓ ${result.message}`);
    }

    if (result.executionTime !== undefined) {
      console.log(`⏱  Execution time: ${result.executionTime}ms`);
    }

    if (result.rowsScanned !== undefined) {
      console.log(`📊 Rows scanned: ${result.rowsScanned}`);
    }

    if (result.indexUsed) {
      console.log(`🔍 Index used: ${result.indexUsed}`);
    }

    console.log('');
  }

  private showTables(): void {
    const tables = this.db.listTables();
    if (tables.length === 0) {
      console.log('\nNo tables found.\n');
      return;
    }

    console.log('\nTables:');
    tables.forEach(table => {
      console.log(`  • ${table}`);
    });
    console.log('');
  }

  private describeTable(tableName: string): void {
    const schema = this.db.getTableSchema(tableName);
    if (!schema) {
      console.log(`\n❌ Table ${tableName} does not exist\n`);
      return;
    }

    console.log(`\nTable: ${tableName}`);
    console.log('Columns:');
    schema.columns.forEach(col => {
      let line = `  • ${col.name} (${col.type})`;
      const flags = [];
      if (col.primaryKey) flags.push('PRIMARY KEY');
      if (col.unique) flags.push('UNIQUE');
      if (col.notNull) flags.push('NOT NULL');
      if (flags.length > 0) {
        line += ` [${flags.join(', ')}]`;
      }
      console.log(line);
    });

    const indexes = this.db.getTableIndexes(tableName);
    if (indexes.length > 0) {
      console.log('\nIndexes:');
      indexes.forEach(idx => {
        console.log(`  • ${idx}`);
      });
    }
    console.log('');
  }

  private showHelp(): void {
    console.log('\nAvailable Commands:');
    console.log('  help                 - Show this help message');
    console.log('  show tables          - List all tables');
    console.log('  describe <table>     - Show table schema');
    console.log('  exit / quit          - Exit the REPL');
    console.log('\nSupported SQL:');
    console.log('  CREATE TABLE ...');
    console.log('  INSERT INTO ...');
    console.log('  SELECT ... FROM ...');
    console.log('  UPDATE ... SET ...');
    console.log('  DELETE FROM ...');
    console.log('  DROP TABLE ...');
    console.log('');
  }
}
