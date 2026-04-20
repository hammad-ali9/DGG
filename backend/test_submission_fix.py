import os
import django
import sys
from decimal import Decimal
from django.utils import timezone

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import PolicySetting
from forms.models import Form, FormField
from forms.views import FormViewSet
from users.models import CustomUser
from rest_framework.test import APIRequestFactory, force_authenticate

def test_submission_logic():
    factory = APIRequestFactory()
    
    # 1. Setup Test Data
    PolicySetting.objects.all().delete()
    PolicySetting.objects.create(
        key='tuition_cap_psssp',
        setting_type='tuition_cap',
        stream='PSSSP',
        value='5000.00',
        is_active=True
    )
    PolicySetting.objects.create(
        key='living_allowance_psssp_ft_single',
        setting_type='living_allowance',
        stream='PSSSP',
        status='FT',
        dependent_count=0,
        value='1200.00',
        is_active=True
    )
    
    # Create an admin user for auth
    admin_user, _ = CustomUser.objects.get_or_create(
        email='admin@test.com',
        defaults={'is_staff': True, 'is_superuser': True}
    )
    
    # Create a student user for auth
    student_user, _ = CustomUser.objects.get_or_create(
        email='student@test.com',
        defaults={'role': 'student', 'full_name': 'Test Student'}
    )
    
    # Create a Form (Form A)
    form_a, _ = Form.objects.get_or_create(
        title='Form A - New Student',
        defaults={'program_id': 1} # Assumes program 1 exists or use a real one
    )
    
    # 2. Test Authenticated Submission (Form A)
    print("Testing Authenticated Submission (Form A)...")
    payload = {
        'answers': [
            {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
            {'field_label': 'Dependent Count', 'answer_text': '0'},
            {'field_label': 'Eligibility q7', 'answer_text': 'no'}
        ]
    }
    
    request = factory.post(f'/api/forms/{form_a.id}/submit/', payload, format='json')
    force_authenticate(request, user=student_user)
    view = FormViewSet.as_view({'post': 'submit'})
    response = view(request, pk=form_a.id)
    
    if response.status_code == 201:
        print(f"[SUCCESS] Authenticated submission worked. Amount: {response.data.get('amount')}")
    else:
        print(f"[FAIL] Authenticated submission failed with status {response.status_code}")
        print(response.data)

    # 3. Test Guest Submission (Form G - Travel)
    print("\nTesting Guest Submission (Form G)...")
    form_g, _ = Form.objects.get_or_create(
        title='Form G - Travel Claim',
        defaults={'program_id': 1}
    )
    
    payload_guest = {
        'answers': [
            {'field_label': 'Travel Date', 'answer_text': timezone.now().date().isoformat()},
            {'field_label': 'Claimed Amount', 'answer_text': '250.50'}
        ]
    }
    
    request_guest = factory.post(f'/api/forms/{form_g.id}/submit/', payload_guest, format='json')
    # No authentication
    response_guest = view(request_guest, pk=form_g.id)
    
    if response_guest.status_code == 201:
        print(f"[SUCCESS] Guest submission worked. Amount: {response_guest.data.get('amount')}")
    else:
        print(f"[FAIL] Guest submission failed with status {response_guest.status_code}")
        print(response_guest.data)

if __name__ == "__main__":
    test_submission_logic()
