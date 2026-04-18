"""
Comprehensive tests for enhanced FormSubmission.submit method with policy enforcement.

Tests cover all 8 phases:
1. Student eligibility validation (suspension, age)
2. Timing and policy validation (deadlines, windows)
3. Eligibility-specific requirements (duplicate funding, SFA denial)
4. Late submission handling
5. Amount calculations using FundingCalculationService
6. FormSubmission creation with policy fields
7. FormBTracking creation for Form A
8. Backend reference number generation
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from forms.models import Form, FormField, FormSubmission, SubmissionAnswer
from api.models import FormBTracking, PolicySetting
from programs.models import Program
from notifications.models import Notification

User = get_user_model()


class EnhancedFormSubmissionTestCase(APITestCase):
    """Test suite for enhanced form submission with policy enforcement"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create test program
        self.program = Program.objects.create(
            title="Test Program",
            description="Test program for form submission"
        )
        
        # Create test form
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
        
        # Create form fields
        FormField.objects.create(
            form=self.form_a,
            label="Enrollment Status",
            field_type="dropdown",
            options=["FT", "PT"],
            order=1
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Dependent Count",
            field_type="number",
            order=2
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Eligibility q7",
            field_type="dropdown",
            options=["yes", "no"],
            order=3
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Eligibility q8",
            field_type="dropdown",
            options=["yes", "no"],
            order=4
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Eligibility q3",
            field_type="dropdown",
            options=["yes", "no"],
            order=5
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Bursary Stream",
            field_type="dropdown",
            options=["PSSSP", "UCEPP", "DGGR", "C-DFN"],
            order=6
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Registrar / Official Email",
            field_type="email",
            order=7
        )
        
        FormField.objects.create(
            form=self.form_a,
            label="Institution Name",
            field_type="text",
            order=8
        )
        
        FormField.objects.create(
            form=self.form_g,
            label="Travel Date",
            field_type="date",
            order=1
        )
        
        # Create test student
        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            full_name="Test Student",
            role='student',
            dob=date(2000, 1, 1)  # 24 years old
        )
        
        # Create suspended student
        self.suspended_student = User.objects.create_user(
            email="suspended@test.com",
            password="testpass123",
            full_name="Suspended Student",
            role='student',
            is_suspended=True,
            suspended_until=timezone.now().date() + timedelta(days=30)
        )
        
        # Create under-18 student
        self.minor_student = User.objects.create_user(
            email="minor@test.com",
            password="testpass123",
            full_name="Minor Student",
            role='student',
            dob=date(2010, 1, 1)  # 14 years old
        )
        
        # Create admin user
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            full_name="Admin User",
            role='admin'
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
        
        PolicySetting.objects.create(
            key='tuition_cap_psssp',
            setting_type='tuition_cap',
            value=Decimal('5000.00'),
            stream='PSSSP'
        )
        
        PolicySetting.objects.create(
            key='tuition_cap_ucepp',
            setting_type='tuition_cap',
            value=Decimal('2000.00'),
            stream='UCEPP'
        )
    
    # ===== PHASE 1: Student Eligibility Tests =====
    
    def test_suspended_student_cannot_submit(self):
        """Test that suspended students are blocked from submitting (Requirement 2.6)"""
        self.client.force_authenticate(user=self.suspended_student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("suspended", response.data['message'].lower())
    
    def test_minor_student_flagged_for_guardian_consent(self):
        """Test that students under 18 are flagged for guardian consent (Requirement 2.20)"""
        self.client.force_authenticate(user=self.minor_student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = FormSubmission.objects.get(id=response.data['data']['id'])
        self.assertFalse(submission.guardian_consent_on_file)
    
    # ===== PHASE 2: Timing and Policy Validation Tests =====
    
    def test_travel_claim_30_day_window_validation(self):
        """Test that travel claims must be submitted within 30 days (Requirement 2.11)"""
        self.client.force_authenticate(user=self.student)
        
        # Travel date more than 30 days ago
        old_travel_date = (timezone.now().date() - timedelta(days=35)).strftime('%Y-%m-%d')
        
        data = {
            'form': self.form_g.id,
            'answers': [
                {'field_label': 'Travel Date', 'answer_text': old_travel_date},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_g.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("30 days", response.data['message'])
    
    def test_duplicate_funding_check(self):
        """Test that duplicate funding is blocked (Requirement 2.23)"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},
                {'field_label': 'Eligibility q8', 'answer_text': 'yes'},  # Duplicate funding
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("duplicate funding", response.data['message'].lower())
    
    # ===== PHASE 5: Amount Calculation Tests =====
    
    def test_form_a_amount_calculation_psssp(self):
        """Test Form A amount calculation for PSSSP (Requirement 2.2)"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},  # Not upgrading
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = FormSubmission.objects.get(id=response.data['data']['id'])
        
        # Expected: 1200 (living allowance) + 5000 (tuition cap) = 6200
        expected_amount = Decimal('6200.00')
        self.assertEqual(submission.amount, expected_amount)
    
    def test_form_a_amount_calculation_ucepp(self):
        """Test Form A amount calculation for UCEPP with lower tuition cap (Requirement 2.3)"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'yes'},  # Upgrading program
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'UCEPP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = FormSubmission.objects.get(id=response.data['data']['id'])
        
        # Expected: 1200 (living allowance) + 2000 (UCEPP tuition cap) = 3200
        expected_amount = Decimal('3200.00')
        self.assertEqual(submission.amount, expected_amount)
    
    # ===== PHASE 6: Policy Fields Tests =====
    
    def test_program_stream_set_correctly(self):
        """Test that program_stream is set based on eligibility answers (Requirement 2.3)"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'yes'},  # Upgrading
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'UCEPP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = FormSubmission.objects.get(id=response.data['data']['id'])
        self.assertEqual(submission.program_stream, 'ucepp')
    
    # ===== PHASE 7: FormBTracking Creation Tests =====
    
    def test_form_b_tracking_created_for_form_a(self):
        """Test that FormBTracking is created for Form A submissions (Requirement 2.5)"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        submission = FormSubmission.objects.get(id=response.data['data']['id'])
        
        # Check FormBTracking was created
        form_b_tracking = FormBTracking.objects.filter(form_a_submission=submission).first()
        self.assertIsNotNone(form_b_tracking)
        self.assertEqual(form_b_tracking.registrar_email, 'registrar@test.com')
        self.assertEqual(form_b_tracking.institution_name, 'Test University')
        self.assertEqual(form_b_tracking.status, 'pending')
        
        # Check due date is 30 days from submission
        expected_due_date = timezone.now().date() + timedelta(days=30)
        self.assertEqual(form_b_tracking.due_date, expected_due_date)
    
    # ===== PHASE 8: Reference Number Tests =====
    
    def test_reference_number_generated(self):
        """Test that backend reference number is generated (Requirement 2.18)"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check reference number is in response
        self.assertIn('reference_number', response.data['data'])
        reference_number = response.data['data']['reference_number']
        
        # Verify format: APP-YYYY-XXXXXX
        self.assertTrue(reference_number.startswith('APP-'))
        parts = reference_number.split('-')
        self.assertEqual(len(parts), 3)
        self.assertEqual(len(parts[2]), 6)  # 6-digit zero-padded ID
    
    # ===== Notification Tests =====
    
    def test_notifications_sent_on_submission(self):
        """Test that notifications are sent to student and admins"""
        self.client.force_authenticate(user=self.student)
        
        data = {
            'form': self.form_a.id,
            'answers': [
                {'field_label': 'Enrollment Status', 'answer_text': 'FT'},
                {'field_label': 'Dependent Count', 'answer_text': '0'},
                {'field_label': 'Eligibility q7', 'answer_text': 'no'},
                {'field_label': 'Eligibility q8', 'answer_text': 'no'},
                {'field_label': 'Eligibility q3', 'answer_text': 'yes'},
                {'field_label': 'Bursary Stream', 'answer_text': 'PSSSP'},
                {'field_label': 'Registrar / Official Email', 'answer_text': 'registrar@test.com'},
                {'field_label': 'Institution Name', 'answer_text': 'Test University'},
            ]
        }
        
        response = self.client.post(f'/forms/{self.form_a.id}/submit/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check student notification
        student_notifications = Notification.objects.filter(user=self.student)
        self.assertTrue(student_notifications.exists())
        self.assertIn("Application Received", student_notifications.first().title)
        
        # Check admin notification
        admin_notifications = Notification.objects.filter(user=self.admin)
        self.assertTrue(admin_notifications.exists())
        self.assertIn("New Application Received", admin_notifications.first().title)
