import os
import django
import sys
from decimal import Decimal
from django.utils import timezone

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Payment, PaymentSchedule
from notifications.models import Notification
from forms.models import Form, FormSubmission
from forms.views import FormSubmissionViewSet
from users.models import CustomUser
from rest_framework.test import APIRequestFactory, force_authenticate
from api.views import PaymentViewSet

def verify_payments_and_notifications():
    factory = APIRequestFactory()
    
    # 1. Setup Test Data
    # Cleanup
    Notification.objects.all().delete()
    Payment.objects.all().delete()
    
    # Create Staff Users
    admin, _ = CustomUser.objects.get_or_create(email='admin_notif@test.com', defaults={'role': 'admin', 'full_name': 'Admin Staff'})
    finance, _ = CustomUser.objects.get_or_create(email='finance_notif@test.com', defaults={'role': 'finance', 'full_name': 'Finance Staff'})
    director, _ = CustomUser.objects.get_or_create(email='director_notif@test.com', defaults={'role': 'director', 'full_name': 'Director Box'})
    
    # Create Student
    student, _ = CustomUser.objects.get_or_create(email='student_pay@test.com', defaults={'role': 'student', 'full_name': 'Pay Student'})
    
    # Create Form and Submission
    form, _ = Form.objects.get_or_create(title='Form A - Living Allowance', defaults={'program_id': 1})
    submission = FormSubmission.objects.create(
        form=form,
        student=student,
        status='reviewed',
        amount=Decimal('1200.00'),
        program_stream='psssp'
    )
    
    # 2. Test Approval (Director)
    print("Simulating Director Approval...")
    view = FormSubmissionViewSet.as_view({'put': 'update_status'})
    payload = {'status': 'accepted', 'reason': 'Approved for Fall'}
    
    request = factory.put(f'/api/forms/submissions/{submission.id}/status/', payload, format='json')
    force_authenticate(request, user=director)
    response = view(request, pk=submission.id)
    
    if response.status_code == 200:
        print("[SUCCESS] Submission approved.")
    else:
        print(f"[FAIL] Approval failed: {response.status_code}")
        print(response.data)
        return

    # 3. Verify Payment Creation
    payment = Payment.objects.filter(submission=submission).first()
    if payment:
        print(f"[SUCCESS] Payment record created: {payment.reference_number}, Amount: ${payment.amount}")
    else:
        print("[FAIL] No Payment record found.")

    # 4. Verify Staff Notifications
    staff_notifs = Notification.objects.filter(title="Payment Approved")
    print(f"Total Staff Notifications: {staff_notifs.count()}")
    roles_notified = [n.user.role for n in staff_notifs]
    print(f"Roles notified: {roles_notified}")
    
    if 'admin' in roles_notified and 'finance' in roles_notified and 'director' in roles_notified:
        print("[SUCCESS] All staff roles notified.")
    else:
        print("[FAIL] Missing notifications for some roles.")

    # 5. Verify API Accessibility (Student)
    print("\nTesting /api/payments/ for Student...")
    view_pay = PaymentViewSet.as_view({'get': 'list'})
    request_pay = factory.get('/api/payments/')
    force_authenticate(request_pay, user=student)
    response_pay = view_pay(request_pay)
    
    if response_pay.status_code == 200:
        results = response_pay.data
        if len(results) > 0 and results[0]['student'] == student.id:
             print(f"[SUCCESS] Student successfully fetched their {len(results)} payment(s).")
        else:
             print("[FAIL] Student could not find their payment.")
    else:
        print(f"[FAIL] Payment API failed for student: {response_pay.status_code}")

    # 6. Verify API Protection (Admin sees all)
    print("\nTesting /api/payments/ for Admin...")
    request_admin = factory.get('/api/payments/')
    force_authenticate(request_admin, user=admin)
    response_admin = view_pay(request_admin)
    
    if response_admin.status_code == 200:
        print(f"[SUCCESS] Admin successfully fetched {len(response_admin.data)} payment(s).")
    else:
        print(f"[FAIL] Payment API failed for admin.")

if __name__ == "__main__":
    verify_payments_and_notifications()
