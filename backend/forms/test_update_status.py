"""
Tests for enhanced FormSubmission.update_status method with automation.

Tests cover all 7 phases:
1. Travel claim approval timing validation (Requirement 2.16)
2. Decision letter generation (Requirement 2.8)
3. Payment record creation (Requirement 2.4)
4. PaymentSchedule entries creation (Requirement 2.19)
5. DGGR budget allocation (Requirement 2.14)
6. Finance notifications (Requirement 2.9)
7. Audit logging (comprehensive status change logging)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from forms.models import Form, FormField, FormSubmission, SubmissionAnswer, SubmissionNote
from api.models import Payment, PaymentSchedule, ExtraTuitionBudget, PolicySetting
from programs.models import Program
from notifications.models import Notification

User = get_user_model()


class UpdateStatusEnhancementTestCase(APITestCase):
    """Test suite for enhanced update_status method with workflow automation"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test program
        self.program = Program.objects.create(
            title="Test Program",
            description="Test program for form submission"
        )
        
        # Create test forms
        self.form_a = Form.objects.create(
            title="Form A - New Student Application",
            description="New student application form",
            program=self.program,
            purpose='application'
        )
        
        self.form_g = Form.objects.create(
            title="Form G - Travel Claim",
            description="Travel claim form",
            program=self.program,
            purpose='application'
        )
        
        # Create form fields for Form A
        FormField.objects.create(
            form=self.form_a,
            label="Enrollment Status",
            field_type="dropdown",
            options=["FT", "PT"],
            order=1
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="semStart",
            field_type="date",
            order=2
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="semEnd",
            field_type="date",
            order=3
        )
        
        # Create form fields for Form G
        FormField.objects.create(
            form=self.form_g,
            label="Travel Date",
            field_type="date",
            order=1
        )
        
        # Create test users
        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            full_name="Test Student",
            role='student',
            dob=date(2000, 1, 1)
        )
        
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            full_name="Admin User",
            role='admin'
        )
        
        self.finance_user = User.objects.create_user(
            email="finance@test.com",
            password="testpass123",
            full_name="Finance User",
            role='finance'
        )
        
        # Seed PolicySetting records
        PolicySetting.objects.create(
            key='living_allowance_psssp_ft_single',
            setting_type='living_allowance',
            value=Decimal('1200.00'),
            stream='PSSSP',
            status='FT',
            dependent_count=0
        )
        
        # Create ExtraTuitionBudget for current fiscal year
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('0.00'),
            remaining_amount=Decimal('36000.00')
        )
    
    # ===== PHASE 1: Travel Claim Approval Timing Validation Tests =====
    
    def test_travel_claim_future_date_approval_blocked(self):
        """Test that travel claims with future dates cannot be approved (Requirement 2.16)"""
        # Create a travel claim submission with future travel date
        future_date = (timezone.now().date() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        submission = FormSubmission.objects.create(
            form=self.form_g,
            student=self.student,
            status='pending',
            amount=Decimal('500.00')
        )
        
        # Add travel date answer
        travel_field = FormField.objects.get(form=self.form_g, label="Travel Date")
        SubmissionAnswer.objects.create(
            submission=submission,
            field=travel_field,
            answer_text=future_date
        )
        
        # Try to approve
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot be approved before the travel date has passed", response.data['message'])
    
    def test_travel_claim_past_date_approval_allowed(self):
        """Test that travel claims with past dates can be approved (Requirement 2.16)"""
        # Create a travel claim submission with past travel date
        past_date = (timezone.now().date() - timedelta(days=5)).strftime('%Y-%m-%d')
        
        submission = FormSubmission.objects.create(
            form=self.form_g,
            student=self.student,
            status='pending',
            amount=Decimal('500.00')
        )
        
        # Add travel date answer
        travel_field = FormField.objects.get(form=self.form_g, label="Travel Date")
        SubmissionAnswer.objects.create(
            submission=submission,
            field=travel_field,
            answer_text=past_date
        )
        
        # Try to approve
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['status'], 'accepted')
    
    # ===== PHASE 2: Decision Letter Generation Tests =====
    
    def test_decision_letter_generated_on_acceptance(self):
        """Test that decision letter is generated when status changes to accepted (Requirement 2.8)"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh submission from database
        submission.refresh_from_db()
        
        # Check decision letter was generated
        self.assertIsNotNone(submission.decision_letter_text)
        self.assertIn("APPROVAL", submission.decision_letter_text)
        self.assertIn(self.student.full_name, submission.decision_letter_text)
        # Check for amount in formatted form
        self.assertTrue("6200" in submission.decision_letter_text or "6,200" in submission.decision_letter_text)
    
    def test_decision_letter_generated_on_rejection(self):
        """Test that decision letter is generated when status changes to rejected (Requirement 2.8)"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'rejected', 'reason': 'Does not meet eligibility requirements'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh submission from database
        submission.refresh_from_db()
        
        # Check decision letter was generated
        self.assertIsNotNone(submission.decision_letter_text)
        self.assertIn("REJECTION", submission.decision_letter_text)
        self.assertIn(self.student.full_name, submission.decision_letter_text)
    
    # ===== PHASE 3: Payment Record Creation Tests =====
    
    def test_payment_created_on_acceptance(self):
        """Test that Payment record is created when status changes to accepted (Requirement 2.4)"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check Payment was created
        payment = Payment.objects.filter(submission=submission).first()
        self.assertIsNotNone(payment)
        self.assertEqual(payment.student, self.student)
        self.assertEqual(payment.amount, Decimal('6200.00'))
        self.assertEqual(payment.status, 'scheduled')
        self.assertEqual(payment.payment_type, 'tuition')
    
    def test_payment_not_created_on_rejection(self):
        """Test that Payment record is NOT created when status changes to rejected"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'rejected', 'reason': 'Does not meet eligibility requirements'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check Payment was NOT created
        payment = Payment.objects.filter(submission=submission).first()
        self.assertIsNone(payment)
    
    # ===== PHASE 4: PaymentSchedule Creation Tests =====
    
    def test_payment_schedule_created_for_living_allowance(self):
        """Test that PaymentSchedule entries are created for living allowances (Requirement 2.19)"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('4800.00')  # 4 months x 1200
        )
        
        # Add semester dates
        sem_start_field = FormField.objects.get(form=self.form_a, label="semStart")
        sem_end_field = FormField.objects.get(form=self.form_a, label="semEnd")
        
        sem_start = date(2025, 1, 1)
        sem_end = date(2025, 4, 30)
        
        SubmissionAnswer.objects.create(
            submission=submission,
            field=sem_start_field,
            answer_text=sem_start.strftime('%Y-%m-%d')
        )
        
        SubmissionAnswer.objects.create(
            submission=submission,
            field=sem_end_field,
            answer_text=sem_end.strftime('%Y-%m-%d')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check PaymentSchedule entries were created
        payment = Payment.objects.get(submission=submission)
        schedules = PaymentSchedule.objects.filter(payment=payment).order_by('month_year')
        
        self.assertEqual(schedules.count(), 4)  # 4 months
        
        # Check monthly amounts
        for schedule in schedules:
            self.assertEqual(schedule.amount, Decimal('1200.00'))
            self.assertEqual(schedule.status, 'scheduled')
    
    # ===== PHASE 5: DGGR Budget Allocation Tests =====
    
    def test_dggr_budget_allocated_on_acceptance(self):
        """Test that DGGR budget is allocated when DGGR submission is accepted (Requirement 2.14)"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('1000.00'),
            program_stream='dggr'
        )
        
        # Get initial budget
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        budget_before = ExtraTuitionBudget.objects.get(fiscal_year=fiscal_year)
        allocated_before = budget_before.allocated_amount
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check budget was updated
        budget_after = ExtraTuitionBudget.objects.get(fiscal_year=fiscal_year)
        self.assertEqual(budget_after.allocated_amount, allocated_before + Decimal('1000.00'))
        
        # Check audit note was created
        notes = SubmissionNote.objects.filter(submission=submission)
        budget_note = notes.filter(text__icontains='DGGR budget allocation').first()
        self.assertIsNotNone(budget_note)
    
    # ===== PHASE 6: Finance Notifications Tests =====
    
    def test_finance_notifications_created_on_acceptance(self):
        """Test that Finance notifications are created when submission is accepted (Requirement 2.9)"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check Finance notification was created
        finance_notifications = Notification.objects.filter(user=self.finance_user)
        self.assertTrue(finance_notifications.exists())
        
        notification = finance_notifications.first()
        self.assertEqual(notification.title, "Payment Scheduled")
        self.assertIn("6200", notification.message)
        self.assertIn(self.student.full_name, notification.message)
    
    # ===== PHASE 7: Audit Logging Tests =====
    
    def test_audit_logging_on_status_change(self):
        """Test that audit logging is created for all status changes"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check audit note was created
        notes = SubmissionNote.objects.filter(submission=submission)
        status_change_note = notes.filter(text__icontains='Status changed').first()
        self.assertIsNotNone(status_change_note)
        self.assertIn('accepted', status_change_note.text)
        self.assertIn(self.admin.email, status_change_note.text)
    
    def test_audit_logging_includes_rejection_reason(self):
        """Test that audit logging includes rejection reason"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        rejection_reason = "Does not meet eligibility requirements"
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'rejected', 'reason': rejection_reason},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check audit note includes reason
        notes = SubmissionNote.objects.filter(submission=submission)
        status_change_note = notes.filter(text__icontains='Status changed').first()
        self.assertIsNotNone(status_change_note)
        self.assertIn(rejection_reason, status_change_note.text)
    
    def test_audit_logging_includes_payment_reference(self):
        """Test that audit logging includes payment reference for accepted submissions"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check audit note includes payment reference
        notes = SubmissionNote.objects.filter(submission=submission)
        status_change_note = notes.filter(text__icontains='Status changed').first()
        self.assertIsNotNone(status_change_note)
        self.assertIn('Payment reference:', status_change_note.text)
        self.assertIn('PAY-', status_change_note.text)
    
    # ===== Student Notification Tests =====
    
    def test_student_notification_on_acceptance(self):
        """Test that student receives notification when submission is accepted"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'accepted'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check student notification
        student_notifications = Notification.objects.filter(user=self.student)
        self.assertTrue(student_notifications.exists())
        
        notification = student_notifications.first()
        self.assertIn("APPROVED", notification.message)
        self.assertIn("6200", notification.message)
    
    def test_student_notification_on_rejection(self):
        """Test that student receives notification when submission is rejected"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending',
            amount=Decimal('6200.00')
        )
        
        rejection_reason = "Does not meet eligibility requirements"
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            f'/api/forms/submissions/{submission.id}/status/',
            {'status': 'rejected', 'reason': rejection_reason},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check student notification
        student_notifications = Notification.objects.filter(user=self.student)
        self.assertTrue(student_notifications.exists())
        
        notification = student_notifications.first()
        self.assertIn("not approved", notification.message)
        self.assertIn(rejection_reason, notification.message)
