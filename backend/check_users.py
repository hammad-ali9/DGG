import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("Listing all users in the current database:")
for user in User.objects.all():
    print(f"Email: {user.email}, Role: {getattr(user, 'role', 'N/A')}, IsActive: {user.is_active}")
