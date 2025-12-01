import pg from 'pg';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { config } from './config.js';

const { Pool: PgPool } = pg;

/**
 * Database connector class
 * Handles connections to PostgreSQL, MySQL, and SQLite
 */
class DatabaseConnector {
    constructor() {
        this.pool = null;
        this.db = null;
        this.type = config.database.type;
        this.schemaCache = new Map();
    }

    /**
     * Initialize database connection
     */
    async connect() {
        try {
            switch (this.type) {
                case 'postgres':
                    await this.connectPostgres();
                    break;
                case 'mysql':
                    await this.connectMySQL();
                    break;
                case 'sqlite':
                    await this.connectSQLite();
                    break;
                default:
                    throw new Error(`Unsupported database type: ${this.type}`);
            }
            console.log(`✓ Connected to ${this.type} database`);
        } catch (error) {
            console.error(`✗ Failed to connect to database:`, error.message);
            throw error;
        }
    }

    /**
     * Connect to PostgreSQL
     */
    async connectPostgres() {
        this.pool = new PgPool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            min: config.database.pool.min,
            max: config.database.pool.max,
        });

        // Test connection
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();
    }

    /**
     * Connect to MySQL
     */
    async connectMySQL() {
        this.pool = mysql.createPool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            waitForConnections: true,
            connectionLimit: config.database.pool.max,
            queueLimit: 0,
        });

        // Test connection
        const connection = await this.pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
    }

    /**
     * Connect to SQLite
     */
    async connectSQLite() {
        this.db = new Database(config.database.path);
        this.db.pragma('journal_mode = WAL');
    }

    /**
     * Execute a query
     */
    async executeQuery(sql, params = []) {
        const startTime = Date.now();

        try {
            let result;

            switch (this.type) {
                case 'postgres':
                    result = await this.executePostgresQuery(sql, params);
                    break;
                case 'mysql':
                    result = await this.executeMySQLQuery(sql, params);
                    break;
                case 'sqlite':
                    result = await this.executeSQLiteQuery(sql, params);
                    break;
            }

            const duration = Date.now() - startTime;

            if (config.logging.logQueries) {
                console.log(`Query executed in ${duration}ms:`, sql.substring(0, 100));
            }

            return result;
        } catch (error) {
            console.error('Query execution error:', error.message);
            throw error;
        }
    }

    /**
     * Execute PostgreSQL query
     */
    async executePostgresQuery(sql, params) {
        const result = await this.pool.query(sql, params);
        return {
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields?.map(f => ({ name: f.name, type: f.dataTypeID })),
        };
    }

    /**
     * Execute MySQL query
     */
    async executeMySQLQuery(sql, params) {
        const [rows, fields] = await this.pool.execute(sql, params);
        return {
            rows: Array.isArray(rows) ? rows : [],
            rowCount: Array.isArray(rows) ? rows.length : 0,
            fields: fields?.map(f => ({ name: f.name, type: f.type })),
        };
    }

    /**
     * Execute SQLite query
     */
    async executeSQLiteQuery(sql, params) {
        const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

        if (isSelect) {
            const stmt = this.db.prepare(sql);
            const rows = stmt.all(...params);
            return {
                rows,
                rowCount: rows.length,
                fields: stmt.columns().map(c => ({ name: c.name, type: c.type })),
            };
        } else {
            const stmt = this.db.prepare(sql);
            const info = stmt.run(...params);
            return {
                rows: [],
                rowCount: info.changes,
                lastInsertId: info.lastInsertRowid,
            };
        }
    }

    /**
     * Get database schema
     */
    async getSchema(tableName = null) {
        const cacheKey = tableName || '__all__';

        if (config.features.enableSchemaCache && this.schemaCache.has(cacheKey)) {
            return this.schemaCache.get(cacheKey);
        }

        let schema;

        switch (this.type) {
            case 'postgres':
                schema = await this.getPostgresSchema(tableName);
                break;
            case 'mysql':
                schema = await this.getMySQLSchema(tableName);
                break;
            case 'sqlite':
                schema = await this.getSQLiteSchema(tableName);
                break;
        }

        if (config.features.enableSchemaCache) {
            this.schemaCache.set(cacheKey, schema);
        }

        return schema;
    }

    /**
     * Get PostgreSQL schema
     */
    async getPostgresSchema(tableName) {
        const query = tableName
            ? `SELECT table_name, column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY table_name, ordinal_position`
            : `SELECT table_name, column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public'
         ORDER BY table_name, ordinal_position`;

        const result = await this.executeQuery(query, tableName ? [tableName] : []);
        return this.formatSchemaResult(result.rows);
    }

    /**
     * Get MySQL schema
     */
    async getMySQLSchema(tableName) {
        const query = tableName
            ? `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, 
         DATA_TYPE as data_type, IS_NULLABLE as is_nullable
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
         ORDER BY TABLE_NAME, ORDINAL_POSITION`
            : `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name,
         DATA_TYPE as data_type, IS_NULLABLE as is_nullable
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ?
         ORDER BY TABLE_NAME, ORDINAL_POSITION`;

        const params = tableName
            ? [config.database.name, tableName]
            : [config.database.name];

        const result = await this.executeQuery(query, params);
        return this.formatSchemaResult(result.rows);
    }

    /**
     * Get SQLite schema
     */
    async getSQLiteSchema(tableName) {
        const tables = tableName
            ? [{ name: tableName }]
            : this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

        const schema = {};

        for (const table of tables) {
            const columns = this.db.prepare(`PRAGMA table_info(${table.name})`).all();
            schema[table.name] = columns.map(col => ({
                column_name: col.name,
                data_type: col.type,
                is_nullable: col.notnull === 0 ? 'YES' : 'NO',
                primary_key: col.pk === 1,
            }));
        }

        return schema;
    }

    /**
     * Format schema result into structured object
     */
    formatSchemaResult(rows) {
        const schema = {};

        for (const row of rows) {
            const tableName = row.table_name;
            if (!schema[tableName]) {
                schema[tableName] = [];
            }
            schema[tableName].push({
                column_name: row.column_name,
                data_type: row.data_type,
                is_nullable: row.is_nullable,
            });
        }

        return schema;
    }

    /**
     * Close database connection
     */
    async close() {
        try {
            if (this.pool) {
                await this.pool.end();
            }
            if (this.db) {
                this.db.close();
            }
            console.log('✓ Database connection closed');
        } catch (error) {
            console.error('Error closing database connection:', error.message);
        }
    }
}

export default DatabaseConnector;
