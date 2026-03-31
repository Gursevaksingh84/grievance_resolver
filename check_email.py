import sys, os
sys.path.insert(0, '.')
os.environ.setdefault('SUPABASE_URL', 'https://qrkzdaviyehvsingqtjy.supabase.co')
os.environ.setdefault('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFya3pkYXZpeWVodnNpbmdxdGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzMwODUsImV4cCI6MjA4MzY0OTA4NX0.0P4yxygEtFDM97hJpEnz2z73ZYcWQeBGzqO84SYEdwY')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFya3pkYXZpeWVodnNpbmdxdGp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODA3MzA4NSwiZXhwIjoyMDgzNjQ5MDg1fQ.yVgkgBi6dMsIite8zZ7OIEzoecmDegpCwmsZl11jhL8')

from supabase import create_client
client = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])

result = client.table('complaints').select('id,citizen_email,citizen_name,responsible_department,created_at').order('created_at', desc=True).limit(5).execute()

print("=== Latest 5 complaints ===")
for c in result.data:
    print(f"  ID: {c['id'][:8]}...")
    print(f"  citizen_email: {repr(c.get('citizen_email'))}")
    print(f"  citizen_name: {repr(c.get('citizen_name'))}")
    print(f"  department: {repr(c.get('responsible_department'))}")
    print(f"  created: {c.get('created_at')}")
    print()
