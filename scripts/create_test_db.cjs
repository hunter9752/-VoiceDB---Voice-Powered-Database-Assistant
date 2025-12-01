// Create a test SQLite database for quick testing
// Run with: node scripts/create_test_db.cjs

const Database = require('better-sqlite3');

console.log('Creating test SQLite database...');

const db = new Database('./test.sqlite');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert sample data
const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
insert.run('Alice Johnson', 'alice@example.com');
insert.run('Bob Smith', 'bob@example.com');
insert.run('Charlie Davis', 'charlie@example.com');

// Verify data
const count = db.prepare('SELECT COUNT(*) as count FROM users').get();

db.close();

console.log('✅ Test database created successfully!');
console.log(`   File: test.sqlite`);
console.log(`   Users created: ${count.count}`);
console.log('');
console.log('Now update your .env file:');
console.log('   DB_TYPE=sqlite');
console.log('   DB_PATH=./test.sqlite');
console.log('');
console.log('Then start the MCP server:');
console.log('   npm start');
