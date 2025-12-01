/**
 * Natural Language Processor
 * Converts natural language queries to SQL
 */
class NaturalLanguageProcessor {
    constructor(schema = {}) {
        this.schema = schema;
        this.queryPatterns = this.initializePatterns();
    }

    /**
     * Initialize query patterns for NL to SQL conversion
     */
    initializePatterns() {
        return {
            // SELECT patterns
            select: [
                {
                    pattern: /(?:show|get|find|list|display|retrieve)\s+(?:me\s+)?(?:all\s+)?(.+?)(?:\s+from\s+(.+?))?$/i,
                    type: 'SELECT',
                },
                {
                    pattern: /(?:what|which)\s+(.+?)\s+(?:are|is)\s+(?:in|from)\s+(.+?)$/i,
                    type: 'SELECT',
                },
            ],

            // COUNT patterns
            count: [
                {
                    pattern: /(?:count|how many)\s+(.+?)(?:\s+(?:in|from)\s+(.+?))?$/i,
                    type: 'COUNT',
                },
            ],

            // INSERT patterns
            insert: [
                {
                    pattern: /(?:add|insert|create)\s+(?:a\s+)?(?:new\s+)?(.+?)\s+(?:to|into)\s+(.+?)$/i,
                    type: 'INSERT',
                },
            ],

            // UPDATE patterns
            update: [
                {
                    pattern: /(?:update|change|modify)\s+(.+?)\s+(?:in|from)\s+(.+?)\s+(?:set|to)\s+(.+?)$/i,
                    type: 'UPDATE',
                },
            ],

            // DELETE patterns
            delete: [
                {
                    pattern: /(?:delete|remove)\s+(.+?)\s+(?:from)\s+(.+?)$/i,
                    type: 'DELETE',
                },
            ],

            // Filter patterns
            filters: {
                where: /where\s+(.+?)(?:\s+(?:and|or|order|group|limit)|$)/i,
                orderBy: /order\s+by\s+(.+?)(?:\s+(?:asc|desc|limit)|$)/i,
                groupBy: /group\s+by\s+(.+?)(?:\s+(?:having|order|limit)|$)/i,
                limit: /limit\s+(\d+)/i,
                having: /having\s+(.+?)(?:\s+(?:order|limit)|$)/i,
            },

            // Condition patterns
            conditions: {
                equals: /(.+?)\s+(?:is|equals?|=)\s+(.+)/i,
                notEquals: /(.+?)\s+(?:is not|not equals?|!=|<>)\s+(.+)/i,
                greaterThan: /(.+?)\s+(?:greater than|>)\s+(.+)/i,
                lessThan: /(.+?)\s+(?:less than|<)\s+(.+)/i,
                like: /(.+?)\s+(?:contains?|like)\s+(.+)/i,
                in: /(.+?)\s+(?:in)\s+\((.+?)\)/i,
                between: /(.+?)\s+(?:between)\s+(.+?)\s+and\s+(.+)/i,
            },

            // Time-based patterns
            timeFilters: {
                today: /today/i,
                yesterday: /yesterday/i,
                lastWeek: /last\s+week/i,
                lastMonth: /last\s+month/i,
                lastNDays: /last\s+(\d+)\s+days?/i,
                lastNHours: /last\s+(\d+)\s+hours?/i,
            },
        };
    }

    /**
     * Process natural language query
     */
    async processQuery(naturalLanguage) {
        try {
            // Normalize input
            const normalized = naturalLanguage.trim().toLowerCase();

            // Detect query type
            const queryType = this.detectQueryType(normalized);

            // Generate SQL based on type
            let sql;
            switch (queryType) {
                case 'SELECT':
                    sql = this.generateSelectQuery(normalized);
                    break;
                case 'COUNT':
                    sql = this.generateCountQuery(normalized);
                    break;
                case 'INSERT':
                    sql = this.generateInsertQuery(normalized);
                    break;
                case 'UPDATE':
                    sql = this.generateUpdateQuery(normalized);
                    break;
                case 'DELETE':
                    sql = this.generateDeleteQuery(normalized);
                    break;
                default:
                    throw new Error('Could not determine query type. Please rephrase your query.');
            }

            return {
                sql,
                type: queryType,
                originalQuery: naturalLanguage,
            };
        } catch (error) {
            throw new Error(`Failed to process natural language query: ${error.message}`);
        }
    }

    /**
     * Detect query type from natural language
     */
    detectQueryType(query) {
        // Check for COUNT
        if (query.match(/^(?:count|how many)/i)) {
            return 'COUNT';
        }

        // Check for INSERT
        if (query.match(/^(?:add|insert|create)/i)) {
            return 'INSERT';
        }

        // Check for UPDATE
        if (query.match(/^(?:update|change|modify)/i)) {
            return 'UPDATE';
        }

        // Check for DELETE
        if (query.match(/^(?:delete|remove)/i)) {
            return 'DELETE';
        }

        // Default to SELECT
        return 'SELECT';
    }

    /**
     * Generate SELECT query
     */
    generateSelectQuery(query) {
        // Extract table name
        const tableName = this.extractTableName(query);

        // Extract columns (default to *)
        const columns = this.extractColumns(query) || '*';

        // Build base query
        let sql = `SELECT ${columns} FROM ${tableName}`;

        // Add WHERE clause
        const whereClause = this.extractWhereClause(query);
        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }

        // Add GROUP BY
        const groupBy = this.extractGroupBy(query);
        if (groupBy) {
            sql += ` GROUP BY ${groupBy}`;
        }

        // Add ORDER BY
        const orderBy = this.extractOrderBy(query);
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        // Add LIMIT
        const limit = this.extractLimit(query);
        if (limit) {
            sql += ` LIMIT ${limit}`;
        }

        return sql;
    }

    /**
     * Generate COUNT query
     */
    generateCountQuery(query) {
        const tableName = this.extractTableName(query);
        let sql = `SELECT COUNT(*) as count FROM ${tableName}`;

        const whereClause = this.extractWhereClause(query);
        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }

        // Check for GROUP BY
        const groupBy = this.extractGroupBy(query);
        if (groupBy) {
            sql = `SELECT ${groupBy}, COUNT(*) as count FROM ${tableName}`;
            if (whereClause) {
                sql += ` WHERE ${whereClause}`;
            }
            sql += ` GROUP BY ${groupBy}`;
        }

        return sql;
    }

    /**
     * Generate INSERT query (placeholder - needs more context)
     */
    generateInsertQuery(query) {
        const tableName = this.extractTableName(query);
        return `INSERT INTO ${tableName} (columns) VALUES (values) -- Requires column and value specification`;
    }

    /**
     * Generate UPDATE query
     */
    generateUpdateQuery(query) {
        const tableName = this.extractTableName(query);
        const setClause = this.extractSetClause(query);
        const whereClause = this.extractWhereClause(query);

        let sql = `UPDATE ${tableName} SET ${setClause}`;

        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }

        return sql;
    }

    /**
     * Generate DELETE query
     */
    generateDeleteQuery(query) {
        const tableName = this.extractTableName(query);
        const whereClause = this.extractWhereClause(query);

        let sql = `DELETE FROM ${tableName}`;

        if (whereClause) {
            sql += ` WHERE ${whereClause}`;
        }

        return sql;
    }

    /**
     * Extract table name from query
     */
    extractTableName(query) {
        // Look for common table indicators
        const patterns = [
            /(?:from|in|into)\s+(\w+)/i,
            /(?:show|get|find|list)\s+(?:all\s+)?(\w+)/i,
        ];

        for (const pattern of patterns) {
            const match = query.match(pattern);
            if (match) {
                const tableName = match[1];
                // Check if table exists in schema
                if (this.schema[tableName]) {
                    return tableName;
                }
                // Try plural/singular variations
                const variations = this.getTableVariations(tableName);
                for (const variation of variations) {
                    if (this.schema[variation]) {
                        return variation;
                    }
                }
                // Return original if no match found
                return tableName;
            }
        }

        throw new Error('Could not identify table name in query');
    }

    /**
     * Get table name variations (plural/singular)
     */
    getTableVariations(name) {
        const variations = [name];

        // Add plural
        if (!name.endsWith('s')) {
            variations.push(name + 's');
        }

        // Remove plural
        if (name.endsWith('s')) {
            variations.push(name.slice(0, -1));
        }

        return variations;
    }

    /**
     * Extract columns from query
     */
    extractColumns(query) {
        // Look for specific column mentions
        const match = query.match(/(?:show|get|select)\s+(?:me\s+)?(.+?)\s+(?:from|in)/i);
        if (match) {
            const columnPart = match[1].trim();
            if (columnPart !== 'all' && !columnPart.includes('*')) {
                return columnPart;
            }
        }
        return '*';
    }

    /**
     * Extract WHERE clause
     */
    extractWhereClause(query) {
        const whereMatch = query.match(this.queryPatterns.filters.where);
        if (whereMatch) {
            return this.parseConditions(whereMatch[1]);
        }

        // Check for time-based filters
        const timeFilter = this.extractTimeFilter(query);
        if (timeFilter) {
            return timeFilter;
        }

        return null;
    }

    /**
     * Parse conditions into SQL
     */
    parseConditions(conditionText) {
        // Simple condition parsing
        for (const [type, pattern] of Object.entries(this.queryPatterns.conditions)) {
            const match = conditionText.match(pattern);
            if (match) {
                switch (type) {
                    case 'equals':
                        return `${match[1].trim()} = '${match[2].trim()}'`;
                    case 'notEquals':
                        return `${match[1].trim()} != '${match[2].trim()}'`;
                    case 'greaterThan':
                        return `${match[1].trim()} > ${match[2].trim()}`;
                    case 'lessThan':
                        return `${match[1].trim()} < ${match[2].trim()}`;
                    case 'like':
                        return `${match[1].trim()} LIKE '%${match[2].trim()}%'`;
                }
            }
        }

        return conditionText;
    }

    /**
     * Extract time-based filters
     */
    extractTimeFilter(query) {
        const timePatterns = this.queryPatterns.timeFilters;

        if (timePatterns.today.test(query)) {
            return "DATE(created_at) = CURRENT_DATE";
        }

        if (timePatterns.yesterday.test(query)) {
            return "DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'";
        }

        const lastNDays = query.match(timePatterns.lastNDays);
        if (lastNDays) {
            return `created_at >= NOW() - INTERVAL '${lastNDays[1]} days'`;
        }

        const lastNHours = query.match(timePatterns.lastNHours);
        if (lastNHours) {
            return `created_at >= NOW() - INTERVAL '${lastNHours[1]} hours'`;
        }

        if (timePatterns.lastWeek.test(query)) {
            return "created_at >= NOW() - INTERVAL '7 days'";
        }

        if (timePatterns.lastMonth.test(query)) {
            return "created_at >= NOW() - INTERVAL '30 days'";
        }

        return null;
    }

    /**
     * Extract GROUP BY clause
     */
    extractGroupBy(query) {
        const match = query.match(this.queryPatterns.filters.groupBy);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract ORDER BY clause
     */
    extractOrderBy(query) {
        const match = query.match(this.queryPatterns.filters.orderBy);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract LIMIT clause
     */
    extractLimit(query) {
        const match = query.match(this.queryPatterns.filters.limit);
        return match ? match[1] : null;
    }

    /**
     * Extract SET clause for UPDATE
     */
    extractSetClause(query) {
        const match = query.match(/(?:set|to)\s+(.+?)(?:\s+where|$)/i);
        return match ? match[1].trim() : 'column = value';
    }

    /**
     * Update schema
     */
    updateSchema(schema) {
        this.schema = schema;
    }
}

export default NaturalLanguageProcessor;
