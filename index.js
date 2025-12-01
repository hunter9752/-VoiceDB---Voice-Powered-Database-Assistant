#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './src/config.js';
import DatabaseConnector from './src/dbConnector.js';
import QueryValidator from './src/queryValidator.js';
import NaturalLanguageProcessor from './src/nlProcessor.js';

/**
 * NL-DB-Assistant MCP Server
 * Natural Language to Database Assistant
 */
class NLDBAssistantServer {
    constructor() {
        this.server = new Server(
            {
                name: 'nl-db-assistant',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.dbConnector = null;
        this.queryValidator = new QueryValidator();
        this.nlProcessor = null;

        this.setupHandlers();
        this.setupErrorHandlers();
    }

    /**
     * Setup MCP request handlers
     */
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'query_database',
                    description: 'Execute a natural language query against the database. Converts natural language to SQL and executes it safely.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: 'Natural language query (e.g., "Show me all users who registered in the last week")',
                            },
                            confirm_destructive: {
                                type: 'boolean',
                                description: 'Confirm execution of destructive operations (DELETE, UPDATE, DROP, etc.)',
                                default: false,
                            },
                        },
                        required: ['query'],
                    },
                },
                {
                    name: 'get_schema',
                    description: 'Retrieve database schema information for tables and columns.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            table_name: {
                                type: 'string',
                                description: 'Optional: specific table name to get schema for. If omitted, returns all tables.',
                            },
                        },
                    },
                },
                {
                    name: 'execute_sql',
                    description: 'Execute raw SQL query with safety validation. Use this for complex queries that natural language cannot express.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sql: {
                                type: 'string',
                                description: 'SQL query to execute',
                            },
                            params: {
                                type: 'array',
                                description: 'Optional: query parameters for prepared statements',
                                items: {
                                    type: 'string',
                                },
                            },
                            confirm_destructive: {
                                type: 'boolean',
                                description: 'Confirm execution of destructive operations',
                                default: false,
                            },
                        },
                        required: ['sql'],
                    },
                },
                {
                    name: 'validate_query',
                    description: 'Validate a SQL query without executing it. Returns validation results, warnings, and complexity analysis.',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            sql: {
                                type: 'string',
                                description: 'SQL query to validate',
                            },
                        },
                        required: ['sql'],
                    },
                },
            ],
        }));

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'query_database':
                        return await this.handleQueryDatabase(args);
                    case 'get_schema':
                        return await this.handleGetSchema(args);
                    case 'execute_sql':
                        return await this.handleExecuteSQL(args);
                    case 'validate_query':
                        return await this.handleValidateQuery(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    /**
     * Handle query_database tool
     */
    async handleQueryDatabase(args) {
        const { query, confirm_destructive = false } = args;

        // Convert natural language to SQL
        const result = await this.nlProcessor.processQuery(query);
        const { sql, type } = result;

        // Validate the generated SQL
        const validation = this.queryValidator.validate(sql, {
            confirmDestructive: confirm_destructive,
        });

        if (!validation.valid) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Query validation failed:\n${validation.errors.join('\n')}\n\nGenerated SQL: ${sql}`,
                    },
                ],
                isError: true,
            };
        }

        // Execute the query
        const queryResult = await this.dbConnector.executeQuery(sql);

        // Format response
        let responseText = `Natural Language: ${query}\n`;
        responseText += `Generated SQL: ${sql}\n`;
        responseText += `Query Type: ${type}\n\n`;

        if (validation.warnings.length > 0) {
            responseText += `Warnings:\n${validation.warnings.join('\n')}\n\n`;
        }

        responseText += `Results:\n`;
        responseText += `Rows affected/returned: ${queryResult.rowCount}\n\n`;

        if (queryResult.rows && queryResult.rows.length > 0) {
            responseText += `Data:\n${JSON.stringify(queryResult.rows, null, 2)}`;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: responseText,
                },
            ],
        };
    }

    /**
     * Handle get_schema tool
     */
    async handleGetSchema(args) {
        const { table_name } = args;

        const schema = await this.dbConnector.getSchema(table_name);

        let responseText = table_name
            ? `Schema for table: ${table_name}\n\n`
            : 'Database Schema:\n\n';

        for (const [tableName, columns] of Object.entries(schema)) {
            responseText += `Table: ${tableName}\n`;
            responseText += 'Columns:\n';

            for (const col of columns) {
                responseText += `  - ${col.column_name} (${col.data_type})`;
                if (col.is_nullable === 'NO') {
                    responseText += ' NOT NULL';
                }
                if (col.primary_key) {
                    responseText += ' PRIMARY KEY';
                }
                responseText += '\n';
            }

            responseText += '\n';
        }

        return {
            content: [
                {
                    type: 'text',
                    text: responseText,
                },
            ],
        };
    }

    /**
     * Handle execute_sql tool
     */
    async handleExecuteSQL(args) {
        const { sql, params = [], confirm_destructive = false } = args;

        // Validate the SQL
        const validation = this.queryValidator.validate(sql, {
            confirmDestructive: confirm_destructive,
        });

        if (!validation.valid) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Query validation failed:\n${validation.errors.join('\n')}`,
                    },
                ],
                isError: true,
            };
        }

        // Execute the query
        const result = await this.dbConnector.executeQuery(sql, params);

        let responseText = `SQL: ${sql}\n`;

        if (validation.warnings.length > 0) {
            responseText += `\nWarnings:\n${validation.warnings.join('\n')}\n`;
        }

        responseText += `\nResults:\n`;
        responseText += `Rows affected/returned: ${result.rowCount}\n`;

        if (result.rows && result.rows.length > 0) {
            responseText += `\nData:\n${JSON.stringify(result.rows, null, 2)}`;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: responseText,
                },
            ],
        };
    }

    /**
     * Handle validate_query tool
     */
    async handleValidateQuery(args) {
        const { sql } = args;

        const validation = this.queryValidator.validate(sql);

        let responseText = `SQL: ${sql}\n\n`;
        responseText += `Valid: ${validation.valid}\n`;
        responseText += `Destructive: ${validation.isDestructive}\n`;
        responseText += `Complexity Score: ${validation.complexity}\n\n`;

        if (validation.errors.length > 0) {
            responseText += `Errors:\n${validation.errors.join('\n')}\n\n`;
        }

        if (validation.warnings.length > 0) {
            responseText += `Warnings:\n${validation.warnings.join('\n')}\n`;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: responseText,
                },
            ],
        };
    }

    /**
     * Setup error handlers
     */
    setupErrorHandlers() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };

        process.on('SIGINT', async () => {
            await this.cleanup();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await this.cleanup();
            process.exit(0);
        });
    }

    /**
     * Initialize the server
     */
    async initialize() {
        try {
            console.error('🚀 Starting NL-DB-Assistant MCP Server...');

            // Validate configuration
            validateConfig();
            console.error('✓ Configuration validated');

            // Connect to database
            this.dbConnector = new DatabaseConnector();
            await this.dbConnector.connect();

            // Get schema and initialize NL processor
            const schema = await this.dbConnector.getSchema();
            this.nlProcessor = new NaturalLanguageProcessor(schema);
            console.error('✓ Natural language processor initialized');

            console.error('✓ Server ready');
        } catch (error) {
            console.error('✗ Initialization failed:', error.message);
            throw error;
        }
    }

    /**
     * Start the server
     */
    async start() {
        await this.initialize();

        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        console.error('✓ MCP Server running on stdio');
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.error('\n🛑 Shutting down...');

        if (this.dbConnector) {
            await this.dbConnector.close();
        }

        console.error('✓ Cleanup complete');
    }
}

// Start the server
const server = new NLDBAssistantServer();
server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
