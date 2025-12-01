import { copyFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Setup script for NL-DB-Assistant
 */
function setup() {
    console.log('🔧 Setting up NL-DB-Assistant...\n');

    // Check if .env already exists
    const envPath = join(rootDir, '.env');

    if (existsSync(envPath)) {
        console.log('⚠️  .env file already exists. Skipping creation.');
        console.log('   If you want to recreate it, delete the existing .env file first.\n');
    } else {
        // Create .env file with sample database configuration
        const envContent = `# Database Configuration
DB_TYPE=sqlite
DB_PATH=./sample.sqlite

# Security Settings
ALLOW_DESTRUCTIVE_QUERIES=false
MAX_QUERY_COMPLEXITY=100
ENABLE_AUDIT_LOG=true

# Query Timeout (milliseconds)
QUERY_TIMEOUT=30000

# Connection Pool Settings (not used for SQLite)
DB_POOL_MIN=2
DB_POOL_MAX=10

# Logging
LOG_LEVEL=info
LOG_QUERIES=true

# Feature Flags
ENABLE_SCHEMA_CACHE=true
ENABLE_QUERY_SUGGESTIONS=true
`;

        writeFileSync(envPath, envContent);
        console.log('✓ Created .env file with sample database configuration');
    }

    // Check if sample database exists
    const sampleDbPath = join(rootDir, 'sample.sqlite');

    if (existsSync(sampleDbPath)) {
        console.log('✓ Sample database already exists');
    } else {
        console.log('⚠️  Sample database not found. Run: npm run create-sample-db');
    }

    console.log('\n✅ Setup complete!\n');
    console.log('Next steps:');
    console.log('  1. If sample database doesn\'t exist: npm run create-sample-db');
    console.log('  2. Start the server: npm start');
    console.log('  3. Or use the inspector: npm run inspect\n');
}

setup();
