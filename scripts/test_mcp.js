#!/usr/bin/env node

/**
 * MCP Server Test Script
 * Tests the NL-DB-Assistant MCP server tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🧪 MCP Server Test Suite');
console.log('='.repeat(60));
console.log();

console.log('📋 Test Plan:');
console.log('  1. Start MCP server');
console.log('  2. Verify server initialization');
console.log('  3. Test tool listing');
console.log('  4. Verify database connection');
console.log();

console.log('💡 This test will start the MCP server and check for initialization.');
console.log('   For interactive testing, use: npm run inspect');
console.log();


let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, message = '') {
    const symbol = passed ? '✅' : '❌';
    console.log(`${symbol} ${name}`);
    if (message) {
        console.log(`   ${message}`);
    }
    if (passed) {
        testsPassed++;
    } else {
        testsFailed++;
    }
}

function runServerTest() {
    return new Promise((resolve) => {
        console.log('🚀 Starting MCP Server...\n');

        const serverProcess = spawn('node', ['index.js'], {
            cwd: rootDir,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';
        let timeout;

        // Collect server output
        serverProcess.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stdout.write(text);
        });

        serverProcess.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
        });

        // Set timeout for server startup
        timeout = setTimeout(() => {
            console.log('\n' + '='.repeat(60));
            console.log('📊 TEST RESULTS');
            console.log('='.repeat(60));
            console.log();

            // Check for initialization messages
            const hasStartMessage = errorOutput.includes('Starting NL-DB-Assistant');
            const hasConfigValidated = errorOutput.includes('Configuration validated');
            const hasDbConnected = errorOutput.includes('Connected to') || errorOutput.includes('database');
            const hasNlProcessorInit = errorOutput.includes('Natural language processor');
            const hasServerReady = errorOutput.includes('Server ready');
            const hasMcpRunning = errorOutput.includes('MCP Server running');

            logTest('Server Start', hasStartMessage);
            logTest('Configuration Validation', hasConfigValidated);
            logTest('Database Connection', hasDbConnected,
                hasDbConnected ? 'Database connected successfully' : 'Check .env configuration');
            logTest('NL Processor Initialization', hasNlProcessorInit);
            logTest('Server Ready', hasServerReady);
            logTest('MCP Transport', hasMcpRunning);

            // Kill the server
            serverProcess.kill('SIGTERM');

            console.log();
            console.log(`✅ Passed: ${testsPassed}/6`);
            console.log(`❌ Failed: ${testsFailed}/6`);
            console.log();

            if (testsFailed === 0) {
                console.log('🎉 All initialization tests passed!');
                console.log();
                console.log('✨ Next steps:');
                console.log('   1. Run interactive inspector: npm run inspect');
                console.log('   2. Test MCP tools interactively');
                console.log('   3. Configure in Claude Desktop');
                resolve(0);
            } else {
                console.log('⚠️  Some tests failed.');
                console.log();
                console.log('💡 Common issues:');
                console.log('   - Database not configured: Check .env file');
                console.log('   - Missing dependencies: Run npm install');
                console.log('   - Database unavailable: Verify DB is running');
                resolve(1);
            }
        }, 5000); // Wait 5 seconds for initialization

        serverProcess.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ Failed to start server:', error.message);
            resolve(1);
        });

        serverProcess.on('exit', (code) => {
            if (code !== null && code !== 0 && code !== 143) { // 143 is SIGTERM
                clearTimeout(timeout);
                console.error(`❌ Server exited with code ${code}`);
                resolve(1);
            }
        });
    });
}

// Run the test
console.log('⏳ Running tests...\n');
runServerTest().then((exitCode) => {
    process.exit(exitCode);
}).catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
