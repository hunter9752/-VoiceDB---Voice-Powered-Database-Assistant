import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Create a sample SQLite database for testing
 */
function createSampleDatabase() {
    const dbPath = join(__dirname, '..', 'sample.sqlite');

    console.log('Creating sample database...');

    const db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create users table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // Create orders table
    db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

    // Create products table
    db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      in_stock INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

    // Insert sample users
    const insertUser = db.prepare(`
    INSERT INTO users (name, email, status, created_at) 
    VALUES (?, ?, ?, ?)
  `);

    const users = [
        ['Alice Johnson', 'alice@example.com', 'active', "datetime('now')"],
        ['Bob Smith', 'bob@example.com', 'active', "datetime('now', '-5 days')"],
        ['Charlie Brown', 'charlie@example.com', 'inactive', "datetime('now', '-10 days')"],
        ['Diana Prince', 'diana@example.com', 'active', "datetime('now', '-2 days')"],
        ['Eve Adams', 'eve@example.com', 'active', "datetime('now', '-1 day')"],
    ];

    for (const user of users) {
        db.exec(`INSERT INTO users (name, email, status, created_at) VALUES ('${user[0]}', '${user[1]}', '${user[2]}', ${user[3]})`);
    }

    // Insert sample orders
    const orders = [
        [1, 'Laptop', 999.99, 'completed'],
        [1, 'Mouse', 29.99, 'completed'],
        [2, 'Keyboard', 79.99, 'pending'],
        [2, 'Monitor', 299.99, 'completed'],
        [4, 'Headphones', 149.99, 'pending'],
        [4, 'Webcam', 89.99, 'shipped'],
        [5, 'Desk', 399.99, 'pending'],
    ];

    for (const order of orders) {
        db.exec(`INSERT INTO orders (user_id, product, amount, status) VALUES (${order[0]}, '${order[1]}', ${order[2]}, '${order[3]}')`);
    }

    // Insert sample products
    const products = [
        ['Laptop Pro', 1299.99, 'Electronics', 1],
        ['Wireless Mouse', 29.99, 'Electronics', 1],
        ['Mechanical Keyboard', 79.99, 'Electronics', 1],
        ['4K Monitor', 399.99, 'Electronics', 1],
        ['Noise-Canceling Headphones', 149.99, 'Electronics', 1],
        ['HD Webcam', 89.99, 'Electronics', 0],
        ['Standing Desk', 499.99, 'Furniture', 1],
        ['Office Chair', 299.99, 'Furniture', 1],
    ];

    for (const product of products) {
        db.exec(`INSERT INTO products (name, price, category, in_stock) VALUES ('${product[0]}', ${product[1]}, '${product[2]}', ${product[3]})`);
    }

    // Get counts
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();

    console.log('✓ Sample database created successfully!');
    console.log(`  Location: ${dbPath}`);
    console.log(`  Users: ${userCount.count}`);
    console.log(`  Orders: ${orderCount.count}`);
    console.log(`  Products: ${productCount.count}`);
    console.log('');
    console.log('To use this database, update your .env file:');
    console.log('  DB_TYPE=sqlite');
    console.log(`  DB_PATH=${dbPath}`);
    console.log('');
    console.log('Example queries to try:');
    console.log('  - "Show me all users"');
    console.log('  - "Find active users"');
    console.log('  - "Count orders by status"');
    console.log('  - "Show me all orders with user names"');
    console.log('  - "Find products in Electronics category"');

    db.close();
}

// Run the script
createSampleDatabase();
