import { config } from './config.js';

/**
 * Query validator class
 * Validates SQL queries for safety and security
 */
class QueryValidator {
    constructor() {
        // Destructive SQL keywords
        this.destructiveKeywords = [
            'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'
        ];

        // Dangerous patterns
        this.dangerousPatterns = [
            /;\s*DROP/i,
            /;\s*DELETE/i,
            /--/,  // SQL comments
            /\/\*/,  // Multi-line comments
            /xp_/i,  // SQL Server extended procedures
            /exec\s*\(/i,
            /execute\s*\(/i,
        ];
    }

    /**
     * Validate a SQL query
     */
    validate(sql, options = {}) {
        const errors = [];
        const warnings = [];

        // Check for empty query
        if (!sql || sql.trim().length === 0) {
            errors.push('Query cannot be empty');
            return { valid: false, errors, warnings };
        }

        // Check for SQL injection patterns
        const injectionCheck = this.checkSQLInjection(sql);
        if (!injectionCheck.safe) {
            errors.push(...injectionCheck.issues);
        }

        // Check for destructive operations
        const destructiveCheck = this.checkDestructiveOperation(sql);
        if (destructiveCheck.isDestructive) {
            if (!config.security.allowDestructiveQueries && !options.confirmDestructive) {
                errors.push(
                    `Destructive operation detected: ${destructiveCheck.operation}. ` +
                    'Set confirmDestructive=true to execute.'
                );
            } else {
                warnings.push(`Destructive operation: ${destructiveCheck.operation}`);
            }
        }

        // Check query complexity
        const complexityCheck = this.checkComplexity(sql);
        if (complexityCheck.score > config.security.maxQueryComplexity) {
            warnings.push(
                `Query complexity (${complexityCheck.score}) exceeds recommended limit ` +
                `(${config.security.maxQueryComplexity})`
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            isDestructive: destructiveCheck.isDestructive,
            complexity: complexityCheck.score,
        };
    }

    /**
     * Check for SQL injection patterns
     */
    checkSQLInjection(sql) {
        const issues = [];

        // Check for dangerous patterns
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(sql)) {
                issues.push(`Potentially dangerous pattern detected: ${pattern.source}`);
            }
        }

        // Check for multiple statements (basic check)
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        if (statements.length > 1) {
            issues.push('Multiple SQL statements detected. Only single statements are allowed.');
        }

        return {
            safe: issues.length === 0,
            issues,
        };
    }

    /**
     * Check if query is destructive
     */
    checkDestructiveOperation(sql) {
        const upperSQL = sql.toUpperCase().trim();

        for (const keyword of this.destructiveKeywords) {
            if (upperSQL.startsWith(keyword)) {
                return {
                    isDestructive: true,
                    operation: keyword,
                };
            }
        }

        // Check for DELETE without WHERE clause
        if (upperSQL.startsWith('DELETE') && !upperSQL.includes('WHERE')) {
            return {
                isDestructive: true,
                operation: 'DELETE without WHERE clause',
            };
        }

        // Check for UPDATE without WHERE clause
        if (upperSQL.startsWith('UPDATE') && !upperSQL.includes('WHERE')) {
            return {
                isDestructive: true,
                operation: 'UPDATE without WHERE clause',
            };
        }

        return {
            isDestructive: false,
            operation: null,
        };
    }

    /**
     * Calculate query complexity score
     */
    checkComplexity(sql) {
        let score = 0;

        // Count JOINs
        const joinCount = (sql.match(/\bJOIN\b/gi) || []).length;
        score += joinCount * 10;

        // Count subqueries
        const subqueryCount = (sql.match(/\(\s*SELECT\b/gi) || []).length;
        score += subqueryCount * 15;

        // Count aggregations
        const aggCount = (sql.match(/\b(COUNT|SUM|AVG|MAX|MIN|GROUP BY)\b/gi) || []).length;
        score += aggCount * 5;

        // Count UNION operations
        const unionCount = (sql.match(/\bUNION\b/gi) || []).length;
        score += unionCount * 10;

        // Count wildcards in LIKE
        const likeWildcards = (sql.match(/LIKE\s+['"]%/gi) || []).length;
        score += likeWildcards * 5;

        // Base complexity
        score += 10;

        return {
            score,
            factors: {
                joins: joinCount,
                subqueries: subqueryCount,
                aggregations: aggCount,
                unions: unionCount,
                likeWildcards,
            },
        };
    }

    /**
     * Sanitize table/column names
     */
    sanitizeIdentifier(identifier) {
        // Remove any characters that aren't alphanumeric or underscore
        return identifier.replace(/[^a-zA-Z0-9_]/g, '');
    }

    /**
     * Validate table name against schema
     */
    validateTableName(tableName, schema) {
        const sanitized = this.sanitizeIdentifier(tableName);

        if (!schema[sanitized]) {
            return {
                valid: false,
                error: `Table '${sanitized}' does not exist in the database`,
            };
        }

        return {
            valid: true,
            sanitized,
        };
    }

    /**
     * Validate column names against schema
     */
    validateColumnNames(tableName, columnNames, schema) {
        const errors = [];
        const validColumns = [];

        if (!schema[tableName]) {
            return {
                valid: false,
                errors: [`Table '${tableName}' not found in schema`],
            };
        }

        const tableColumns = schema[tableName].map(col => col.column_name);

        for (const colName of columnNames) {
            const sanitized = this.sanitizeIdentifier(colName);

            if (!tableColumns.includes(sanitized)) {
                errors.push(`Column '${sanitized}' does not exist in table '${tableName}'`);
            } else {
                validColumns.push(sanitized);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            validColumns,
        };
    }
}

export default QueryValidator;
