import os
import django
from django.contrib.auth import authenticate

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings') # Wait, I know it's core.settings from my research

# Correcting path based on list_dir
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

user = authenticate(email='director@deline.ca', password='Deline2026!')
if user:
    print(f"AUTHENTICATION SUCCESS: User found: {user.email}, Role: {getattr(user, 'role', 'N/A')}")
else:
    print("AUTHENTICATION FAILED: Invalid email or password.")
