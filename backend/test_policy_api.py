import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import PolicySetting
from api.serializers import PolicySettingSerializer
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views import PolicySettingViewSet
from users.models import CustomUser

def test_policy_api():
    factory = APIRequestFactory()
    viewset = PolicySettingViewSet.as_view({'get': 'all_settings', 'post': 'bulk_update'})
    
    # Create an admin user for authentication
    admin_user, _ = CustomUser.objects.get_or_create(
        email='admin@test.com',
        defaults={'is_staff': True, 'is_superuser': True}
    )
    admin_user.set_password('password123')
    admin_user.save()

    # 1. Test all_settings (GET)
    print("Testing GET all_settings...")
    request = factory.get('/api/policy/all_settings/')
    force_authenticate(request, user=admin_user)
    # The view bound via as_view() already knows which action to call or handles it via dispatch
    response = PolicySettingViewSet.as_view({'get': 'all_settings'})(request)
    
    if response.status_code == 200:
        print("[SUCCESS] all_settings returned 200")
        data = response.data
        if 'application_deadlines' in data and len(data['application_deadlines']) > 0:
            print(f"[SUCCESS] Found 'application_deadlines' category with {len(data['application_deadlines'])} items")
        else:
            print("[FAIL] 'application_deadlines' category missing or empty")
    else:
        print(f"[FAIL] all_settings failed with status {response.status_code}")
        print(response.data)

    # 2. Test bulk_update (POST)
    print("\nTesting POST bulk_update...")
    # Get an item to update
    item = PolicySetting.objects.first()
    if not item:
        print("[FAIL] No PolicySetting items found to test bulk_update")
        return
        
    new_value = "Updated Value"
    
    payload = {
        'settings': [
            {'id': item.id, 'value': new_value}
        ]
    }
    
    request = factory.post('/api/policy/bulk_update/', payload, format='json')
    force_authenticate(request, user=admin_user)
    # Use a fresh view instance for POST
    response = PolicySettingViewSet.as_view({'post': 'bulk_update'})(request)
    
    if response.status_code == 200:
        print(f"[SUCCESS] bulk_update returned 200. Updated count: {response.data.get('updated_count')}")
        # Verify persistence
        item.refresh_from_db()
        if item.value == new_value:
            print(f"[SUCCESS] Persistence verified: {item.key} is now '{item.value}'")
        else:
            print(f"[FAIL] Persistence failed: {item.key} is '{item.value}', expected '{new_value}'")
    else:
        print(f"X bulk_update failed with status {response.status_code}")
        print(response.data)

if __name__ == "__main__":
    test_policy_api()
