"""
Diagnostic script to test Supabase connection
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

print("=" * 70)
print("SUPABASE CONNECTION DIAGNOSTIC")
print("=" * 70)
print()

# Step 1: Check environment variables
print("1. Checking environment variables...")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if supabase_url:
    print(f"   ✅ SUPABASE_URL found: {supabase_url[:30]}...")
else:
    print("   ❌ SUPABASE_URL not found in .env")

if supabase_key:
    print(f"   ✅ SUPABASE_SERVICE_ROLE_KEY found: {supabase_key[:20]}...")
else:
    print("   ❌ SUPABASE_SERVICE_ROLE_KEY not found in .env")

print()

if not supabase_url or not supabase_key:
    print("❌ Missing required environment variables. Cannot proceed.")
    print("\nPlease check your .env file has:")
    print("SUPABASE_URL=your_supabase_url")
    print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
    exit(1)

# Step 2: Test connection
print("2. Testing Supabase connection...")
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    print("   ✅ Supabase client created successfully")
except Exception as e:
    print(f"   ❌ Failed to create client: {e}")
    exit(1)

print()

# Step 3: Test fetching tables
print("3. Testing table access...")
try:
    # Try to list tables using information_schema
    result = supabase.table('information_schema.tables').select('*').limit(5).execute()
    print(f"   ✅ Can query information_schema")
except Exception as e:
    print(f"   ⚠️  Cannot query information_schema: {e}")
    print("   Trying alternative method...")

print()

# Step 4: Test specific table access
print("4. Testing access to known tables...")
tables_to_test = ['users', 'products', 'orders', 'documents', 'query_logs']

for table_name in tables_to_test:
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()
        count = len(result.data) if result.data else 0
        print(f"   ✅ Table '{table_name}': accessible ({count} rows sampled)")
    except Exception as e:
        print(f"   ❌ Table '{table_name}': {str(e)[:60]}")

print()

# Step 5: Test RPC call for schema
print("5. Testing RPC function 'get_table_schema'...")
try:
    result = supabase.rpc('get_table_schema', {}).execute()
    print(f"   ✅ RPC call successful")
except Exception as e:
    print(f"   ⚠️  RPC function may not exist: {e}")
    print("   This is expected if you haven't created the function yet")

print()

# Step 6: Get schema manually
print("6. Manually fetching schema using pg_catalog...")
try:
    # Query to get table information
    query = """
    SELECT 
        table_name,
        table_schema
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
    """
    
    # Note: Supabase doesn't support raw SQL via Python client easily
    # We'll use table-based approach instead
    print("   ℹ️  Attempting alternative schema fetch...")
    
    # Try getting users table structure as test
    result = supabase.table('users').select('*').limit(0).execute()
    print(f"   ✅ Can fetch table structure")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("=" * 70)
print("DIAGNOSTIC COMPLETE")
print("=" * 70)
print()
print("RECOMMENDATIONS:")
print("1. If all tests pass, the issue might be with async/await in the service")
print("2. If table access fails, check Supabase RLS (Row Level Security) policies")
print("3. If connection fails, verify network access to Supabase")
print("4. Check Supabase dashboard for API usage and rate limits")
