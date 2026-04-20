
import os
import sys
import django

# Setup path and Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Profile
from api.serializers import UserSerializer

User = get_user_model()

def verify_fix():
    print("--- Starting Profile Persistence Verification ---")
    
    # 1. Create a test user
    email = "fix_test@example.com"
    User.objects.filter(email=email).delete()
    user = User.objects.create_user(email=email, password="password123")
    Profile.objects.create(user=user)
    
    print(f"Created test user: {email}")
    
    # 2. Simulate an update payload from the frontend (flat object)
    update_data = {
        'preferred_name': 'Marie Test',
        'beneficiary_number': 'DGG-TEST-999',
        'dob': '1995-05-20',
        'phone': '867-111-2222',
        'bank_name': 'Royal Bank',
        'account_number': '123456789'
    }
    
    print(f"Simulating update with: {update_data}")
    
    # 3. Use the serializer to update
    serializer = UserSerializer(instance=user, data=update_data, partial=True)
    if serializer.is_valid():
        serializer.save()
        print("Serializer update successful.")
    else:
        print(f"Serializer errors: {serializer.errors}")
        return
    
    # 4. Verify Database state
    profile = Profile.objects.get(user=user)
    
    print("\n--- Database Verification ---")
    print(f"Profile Preferred Name: {profile.preferred_name} (Expected: Marie Test)")
    print(f"Profile Beneficiary #: {profile.beneficiary_number} (Expected: DGG-TEST-999)")
    print(f"Profile DOB: {profile.date_of_birth} (Expected: 1995-05-20)")
    print(f"Profile Phone: {profile.phone_number} (Expected: 867-111-2222)")
    print(f"Profile Bank: {profile.bank_name} (Expected: Royal Bank)")
    
    success = (
        profile.preferred_name == 'Marie Test' and
        profile.beneficiary_number == 'DGG-TEST-999' and
        str(profile.date_of_birth) == '1995-05-20' and
        profile.phone_number == '867-111-2222'
    )
    
    if success:
        print("\n✅ SUCCESS: Profile fields correctly persisted to the Profile model!")
    else:
        print("\n❌ FAILURE: Field mismatch detected.")

    # 5. Verify Serializer Data (Auto-fill check)
    user.refresh_from_db()
    read_serializer = UserSerializer(user)
    print("\n--- Serializer Output (Auto-fill) Check ---")
    print(f"Serializer 'dob': {read_serializer.data.get('dob')}")
    print(f"Serializer 'beneficiary_number': {read_serializer.data.get('beneficiary_number')}")
    
    if read_serializer.data.get('beneficiary_number') == 'DGG-TEST-999':
        print("✅ SUCCESS: Serializer correctly reads from Profile model for auto-filling.")
    else:
        print("❌ FAILURE: Serializer did not read from Profile model correctly.")

    User.objects.filter(email=email).delete()

if __name__ == "__main__":
    verify_fix()
