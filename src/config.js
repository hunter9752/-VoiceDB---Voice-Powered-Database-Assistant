import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration
 */
export const config = {
    // Database configuration
    database: {
        type: process.env.DB_TYPE || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || '',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        path: process.env.DB_PATH || './database.sqlite',
        pool: {
            min: parseInt(process.env.DB_POOL_MIN || '2', 10),
            max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        },
    },

    // Security settings
    security: {
        allowDestructiveQueries: process.env.ALLOW_DESTRUCTIVE_QUERIES === 'true',
        maxQueryComplexity: parseInt(process.env.MAX_QUERY_COMPLEXITY || '100', 10),
        enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',
        queryTimeout: parseInt(process.env.QUERY_TIMEOUT || '30000', 10),
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        logQueries: process.env.LOG_QUERIES !== 'false',
    },

    // Feature flags
    features: {
        enableSchemaCache: process.env.ENABLE_SCHEMA_CACHE !== 'false',
        enableQuerySuggestions: process.env.ENABLE_QUERY_SUGGESTIONS !== 'false',
    },
};

/**
 * Validate configuration
 */
export function validateConfig() {
    const errors = [];

    // Validate database type
    const validDbTypes = ['postgres', 'mysql', 'sqlite'];
    if (!validDbTypes.includes(config.database.type)) {
        errors.push(`Invalid DB_TYPE: ${config.database.type}. Must be one of: ${validDbTypes.join(', ')}`);
    }

    // Validate database connection details (except for SQLite)
    if (config.database.type !== 'sqlite') {
        if (!config.database.name) {
            errors.push('DB_NAME is required');
        }
        if (!config.database.user) {
            errors.push('DB_USER is required');
        }
    } else {
        if (!config.database.path) {
            errors.push('DB_PATH is required for SQLite');
        }
    }

    // Validate numeric values
    if (config.security.maxQueryComplexity < 1) {
        errors.push('MAX_QUERY_COMPLEXITY must be greater than 0');
    }

    if (config.security.queryTimeout < 1000) {
        errors.push('QUERY_TIMEOUT must be at least 1000ms');
    }

    if (errors.length > 0) {
        throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    return true;
}

/**
 * Get database connection string
 */
export function getConnectionString() {
    const { type, host, port, name, user, password, path } = config.database;

    switch (type) {
        case 'postgres':
            return `postgresql://${user}:${password}@${host}:${port}/${name}`;
        case 'mysql':
            return `mysql://${user}:${password}@${host}:${port}/${name}`;
        case 'sqlite':
            return path;
        default:
            throw new Error(`Unsupported database type: ${type}`);
    }
}

export default config;
