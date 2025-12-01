# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies ✓

Dependencies are already installed!

### Step 2: Configure Database

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your database credentials. Here are examples for each database type:

#### For PostgreSQL:
```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

#### For MySQL:
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_username
DB_PASSWORD=your_password
```

#### For SQLite (easiest for testing):
```env
DB_TYPE=sqlite
DB_PATH=./test.sqlite
```

### Step 3: Test the Server

Run the server:

```bash
npm start
```

You should see:
```
🚀 Starting NL-DB-Assistant MCP Server...
✓ Configuration validated
✓ Connected to [database type] database
✓ Natural language processor initialized
✓ Server ready
✓ MCP Server running on stdio
```

### Step 4: Connect from an MCP Client

#### Option A: Use MCP Inspector (Recommended for Testing)

```bash
npm run inspect
```

This opens an interactive inspector where you can test the tools.

#### Option B: Configure Claude Desktop

Add to your Claude Desktop config (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nl-db-assistant": {
      "command": "node",
      "args": ["c:\\hacthin farm tak moodel\\index.js"]
    }
  }
}
```

Restart Claude Desktop and you'll see the NL-DB-Assistant tools available!

### Step 5: Try Some Queries

Once connected, try these natural language queries:

1. **Get schema information:**
   ```
   Use the get_schema tool to see all tables
   ```

2. **Simple query:**
   ```
   Use query_database: "Show me all users"
   ```

3. **Filtered query:**
   ```
   Use query_database: "Find users created in the last 7 days"
   ```

4. **Aggregation:**
   ```
   Use query_database: "Count orders grouped by status"
   ```

## 🧪 Testing with SQLite (No Database Setup Required)

For quick testing without setting up a database:

1. Create a test database:

```bash
# Create a simple SQLite database
node -e "const Database = require('better-sqlite3'); const db = new Database('./test.sqlite'); db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, created_at TEXT)'); db.exec(\"INSERT INTO users (name, email, created_at) VALUES ('Alice', 'alice@example.com', datetime('now'))\"); db.exec(\"INSERT INTO users (name, email, created_at) VALUES ('Bob', 'bob@example.com', datetime('now', '-5 days'))\"); db.close(); console.log('Test database created!');"
```

2. Configure `.env`:

```env
DB_TYPE=sqlite
DB_PATH=./test.sqlite
ALLOW_DESTRUCTIVE_QUERIES=false
```

3. Start the server:

```bash
npm start
```

4. Test queries:
   - "Show me all users"
   - "Find users created today"
   - "Count total users"

## 📚 Available Tools

### 1. query_database
Convert natural language to SQL and execute it.

**Example:**
```json
{
  "query": "Show me all active users ordered by name"
}
```

### 2. get_schema
Get database schema information.

**Example:**
```json
{
  "table_name": "users"
}
```

### 3. execute_sql
Execute raw SQL with validation.

**Example:**
```json
{
  "sql": "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
}
```

### 4. validate_query
Validate SQL without executing.

**Example:**
```json
{
  "sql": "DELETE FROM users WHERE id = 1"
}
```

## 🔧 Troubleshooting

### "Configuration validation failed"
- Check your `.env` file exists
- Verify all required fields are set
- For SQLite, ensure DB_PATH is set

### "Failed to connect to database"
- Verify database is running
- Check credentials in `.env`
- Test connection manually

### "Could not identify table name"
- Use `get_schema` to see available tables
- Be more specific with table names
- Try using exact table names from schema

### Natural language not working well
- Use more specific queries
- Include table names explicitly
- Try rephrasing the query
- Use `execute_sql` for complex queries

## 🎯 Next Steps

1. ✓ Server is running
2. Configure your production database
3. Integrate with your MCP client
4. Explore the natural language capabilities
5. Review ARCHITECTURE.md for advanced usage

## 💡 Tips

- Start with simple queries to understand the NL capabilities
- Use `get_schema` frequently to understand your database
- Enable query logging in `.env` for debugging
- Use `validate_query` to test SQL before executing
- For complex queries, use `execute_sql` directly

---

**Need help?** Check the full [README.md](README.md) or [ARCHITECTURE.md](ARCHITECTURE.md)
