"""
Verify sample data was added to Supabase
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

print("=" * 60)
print("Verifying Sample Data in Supabase")
print("=" * 60)
print()

client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Check each table
tables = ['users', 'products', 'orders', 'order_items', 'reviews']

print("📊 Checking tables and row counts:")
print()

total_rows = 0
for table in tables:
    try:
        result = client.table(table).select('*', count='exact').limit(0).execute()
        count = result.count
        print(f"   ✅ {table.ljust(15)} - {count} rows")
        total_rows += count
    except Exception as e:
        print(f"   ❌ {table.ljust(15)} - Error: {str(e)}")

print()
print("=" * 60)

if total_rows > 0:
    print(f"✅ SUCCESS! {total_rows} rows of sample data found!")
    print()
    print("🎉 Your database is ready to query!")
    print()
    print("Try these natural language queries:")
    print("  1. 'Show me all users'")
    print("  2. 'Find pending orders'")
    print("  3. 'What are the top rated products?'")
    print("  4. 'Show orders from the last week'")
    print("  5. 'Count how many products we have'")
    print()
    print("Query through:")
    print("  • Backend API: http://localhost:8000/docs")
    print("  • Frontend: http://localhost:3000 (if running)")
    print("  • MCP Server: Through Claude Desktop")
else:
    print("❌ No data found. The SQL might not have run successfully.")
    print()
    print("Try running sample_data.sql again in Supabase SQL Editor")
