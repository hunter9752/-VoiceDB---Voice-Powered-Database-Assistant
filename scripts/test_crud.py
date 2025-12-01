"""
Test CRUD Operations with Confirmation Flow
"""
import requests
import json

API_URL = "http://localhost:8000"

def test_crud_operations():
    print("=" * 60)
    print("Testing CRUD Operations with Confirmation")
    print("=" * 60)
    print()
    
    # Test 1: INSERT without confirmation (should require confirmation)
    print("1. Testing INSERT without confirmation...")
    response = requests.post(f"{API_URL}/query", json={
        "query": "Add a new user named Test User with email test@example.com",
        "use_rag": False,
        "confirm_destructive": False
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('requires_confirmation'):
            print(f"   ✅ Confirmation required (as expected)")
            print(f"   Operation: {data.get('operation_type')}")
            print(f"   SQL: {data.get('sql')}")
            print(f"   Warning: {data.get('warning')}")
        else:
            print(f"   ❌ No confirmation required (unexpected)")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
        print(f"   {response.text}")
    
    print()
    
    # Test 2: INSERT with confirmation (should execute)
    print("2. Testing INSERT with confirmation...")
    response = requests.post(f"{API_URL}/query", json={
        "query": "Add a new user named Test User with email test@example.com",
        "use_rag": False,
        "confirm_destructive": True
    })
    
    if response.status_code == 200:
        data = response.json()
        if not data.get('requires_confirmation'):
            print(f"   ✅ Query executed successfully")
            print(f"   SQL: {data.get('sql')}")
            print(f"   Result count: {data.get('result_count', 0)}")
        else:
            print(f"   ❌ Still requires confirmation")
    else:
        print(f"   ⚠️  Request failed: {response.status_code}")
        print(f"   {response.text}")
    
    print()
    
    # Test 3: UPDATE without confirmation
    print("3. Testing UPDATE without confirmation...")
    response = requests.post(f"{API_URL}/query", json={
        "query": "Update user with id 1 set name to 'Updated Name'",
        "use_rag": False,
        "confirm_destructive": False
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('requires_confirmation'):
            print(f"   ✅ Confirmation required")
            print(f"   Operation: {data.get('operation_type')}")
            print(f"   Warnings: {data.get('warnings', [])}")
        else:
            print(f"   ❌ No confirmation required")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    print()
    
    # Test 4: DELETE without confirmation
    print("4. Testing DELETE without confirmation...")
    response = requests.post(f"{API_URL}/query", json={
        "query": "Delete user where id = 999",
        "use_rag": False,
        "confirm_destructive": False
    })
    
    if response.status_code == 200:
        data = response.json()
        if data.get('requires_confirmation'):
            print(f"   ✅ Confirmation required")
            print(f"   Operation: {data.get('operation_type')}")
        else:
            print(f"   ❌ No confirmation required")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    print()
    
    # Test 5: SELECT query (should NOT require confirmation)
    print("5. Testing SELECT query (no confirmation needed)...")
    response = requests.post(f"{API_URL}/query", json={
        "query": "Show me all users",
        "use_rag": False,
        "confirm_destructive": False
    })
    
    if response.status_code == 200:
        data = response.json()
        if not data.get('requires_confirmation'):
            print(f"   ✅ Query executed without confirmation")
            print(f"   Operation: SELECT")
            print(f"   Result count: {data.get('result_count', 0)}")
        else:
            print(f"   ❌ Confirmation required (unexpected for SELECT)")
    else:
        print(f"   ❌ Request failed: {response.status_code}")
    
    print()
    print("=" * 60)
    print("CRUD Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_crud_operations()
    except Exception as e:
        print(f"Error: {e}")
        print("\nMake sure backend is running: python -m backend.main")
