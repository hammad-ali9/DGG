"""
Tests for Director exception and appeal escalation endpoints (Task 3.3.4)

Tests the following requirements:
- Requirement 2.7: Semester Deadline Enforcement - Director exception workflow
- Requirement 2.22: Appeal Escalation Path - escalation_level field and API endpoint
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from forms.models import Form, FormSubmission, SubmissionNote
from programs.models import Program
from notifications.models import Notification
from datetime import datetime, timedelta

User = get_user_model()


class DirectorExceptionEndpointTests(TestCase):
    """Tests for approve_late_submission endpoint"""
    
    def setUp(self):
        """Set up test data"""
        # Create program
        self.program = Program.objects.create(
            title="Test Program",
            description="Test program for testing"
        )
        
        # Create form
        self.form = Form.objects.create(
            title="Form A - New Student Application",
            description="Test form",
            program=self.program,
            purpose='application'
        )
        
        # Create users
        self.director = User.objects.create_user(
            email='director@test.com',
            password='testpass123',
            role='director',
            full_name='Test Director'
        )
        
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='admin',
            full_name='Test Admin'
        )
        
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role='student',
            full_name='Test Student'
        )
        
        # Create late submission
        self.late_submission = FormSubmission.objects.create(
            form=self.form,
            student=self.student,
            status='pending',
            is_late=True,
            director_exception_approved=False,
            amount=1000.00
        )
        
        self.client = APIClient()
    
    def test_director_can_approve_late_submission(self):
        """Test that Director can approve late submissions"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.late_submission.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify submission was updated
        self.late_submission.refresh_from_db()
        self.assertTrue(self.late_submission.director_exception_approved)
    
    def test_admin_cannot_approve_late_submission(self):
        """Test that Admin (SSW) cannot approve late submissions"""
        self.client.force_authenticate(user=self.admin)
        
        url = f'/api/forms/submissions/{self.late_submission.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_student_cannot_approve_late_submission(self):
        """Test that Student cannot approve late submissions"""
        self.client.force_authenticate(user=self.student)
        
        url = f'/api/forms/submissions/{self.late_submission.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_cannot_approve_non_late_submission(self):
        """Test that non-late submissions cannot be approved"""
        # Create non-late submission
        non_late = FormSubmission.objects.create(
            form=self.form,
            student=self.student,
            status='pending',
            is_late=False,
            director_exception_approved=False,
            amount=1000.00
        )
        
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{non_late.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn("not marked as late", response.data['message'])
    
    def test_audit_log_created_on_approval(self):
        """Test that audit log is created when Director approves exception"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.late_submission.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify audit note was created
        notes = SubmissionNote.objects.filter(submission=self.late_submission)
        self.assertTrue(notes.exists())
        
        audit_note = notes.first()
        self.assertIn("Director exception approved", audit_note.text)
        self.assertEqual(audit_note.author, self.director)
    
    def test_student_notification_on_approval(self):
        """Test that student receives notification when exception is approved"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.late_submission.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify student notification was created
        notifications = Notification.objects.filter(user=self.student)
        self.assertTrue(notifications.exists())
        
        notification = notifications.first()
        self.assertIn("Late Submission Exception Approved", notification.title)
    
    def test_admin_notification_on_approval(self):
        """Test that admins receive notification when exception is approved"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.late_submission.id}/approve-late/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify admin notification was created
        notifications = Notification.objects.filter(user=self.admin)
        self.assertTrue(notifications.exists())
        
        notification = notifications.first()
        self.assertIn("Director Exception Approved", notification.title)


class AppealEscalationEndpointTests(TestCase):
    """Tests for escalate_appeal endpoint"""
    
    def setUp(self):
        """Set up test data"""
        # Create program
        self.program = Program.objects.create(
            title="Test Program",
            description="Test program for testing"
        )
        
        # Create appeal form
        self.appeal_form = Form.objects.create(
            title="Form H - Appeal",
            description="Appeal form",
            program=self.program,
            purpose='application'
        )
        
        # Create users
        self.director = User.objects.create_user(
            email='director@test.com',
            password='testpass123',
            role='director',
            full_name='Test Director'
        )
        
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='admin',
            full_name='Test Admin'
        )
        
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role='student',
            full_name='Test Student'
        )
        
        # Create appeal submission
        self.appeal_submission = FormSubmission.objects.create(
            form=self.appeal_form,
            student=self.student,
            status='pending',
            escalation_level='none',
            amount=1000.00
        )
        
        self.client = APIClient()
    
    def test_director_can_escalate_appeal(self):
        """Test that Director can escalate appeals"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        # Verify submission was updated
        self.appeal_submission.refresh_from_db()
        self.assertEqual(self.appeal_submission.escalation_level, 'beneficiary_services')
    
    def test_admin_cannot_escalate_appeal(self):
        """Test that Admin (SSW) cannot escalate appeals"""
        self.client.force_authenticate(user=self.admin)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_student_cannot_escalate_appeal(self):
        """Test that Student cannot escalate appeals"""
        self.client.force_authenticate(user=self.student)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_invalid_escalation_level_rejected(self):
        """Test that invalid escalation levels are rejected"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'invalid_level'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn("Invalid escalation level", response.data['message'])
    
    def test_valid_escalation_levels(self):
        """Test all valid escalation levels"""
        valid_levels = ['none', 'director', 'beneficiary_services', 'ceo', 'dkdk']
        
        for level in valid_levels:
            # Create new submission for each test
            submission = FormSubmission.objects.create(
                form=self.appeal_form,
                student=self.student,
                status='pending',
                escalation_level='none',
                amount=1000.00
            )
            
            self.client.force_authenticate(user=self.director)
            
            url = f'/api/forms/submissions/{submission.id}/escalate/'
            data = {'escalation_level': level}
            response = self.client.post(url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            submission.refresh_from_db()
            self.assertEqual(submission.escalation_level, level)
    
    def test_cannot_escalate_non_appeal_submission(self):
        """Test that non-appeal submissions cannot be escalated"""
        # Create non-appeal form
        regular_form = Form.objects.create(
            title="Form A - New Student Application",
            description="Regular form",
            program=self.program,
            purpose='application'
        )
        
        # Create non-appeal submission
        regular_submission = FormSubmission.objects.create(
            form=regular_form,
            student=self.student,
            status='pending',
            escalation_level='none',
            amount=1000.00
        )
        
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{regular_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn("only available for appeal submissions", response.data['message'])
    
    def test_audit_log_created_on_escalation(self):
        """Test that audit log is created when appeal is escalated"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services', 'reason': 'Complex case requiring higher review'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify audit note was created
        notes = SubmissionNote.objects.filter(submission=self.appeal_submission)
        self.assertTrue(notes.exists())
        
        audit_note = notes.first()
        self.assertIn("Appeal escalated", audit_note.text)
        self.assertIn("beneficiary_services", audit_note.text)
        self.assertIn("Complex case requiring higher review", audit_note.text)
        self.assertEqual(audit_note.author, self.director)
    
    def test_student_notification_on_escalation(self):
        """Test that student receives notification when appeal is escalated"""
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify student notification was created
        notifications = Notification.objects.filter(user=self.student)
        self.assertTrue(notifications.exists())
        
        notification = notifications.first()
        self.assertIn("Appeal Escalated", notification.title)
        self.assertIn("Beneficiary Services", notification.message)
    
    def test_director_and_admin_notification_on_escalation(self):
        """Test that directors and admins receive notification when appeal is escalated"""
        # Create another director
        director2 = User.objects.create_user(
            email='director2@test.com',
            password='testpass123',
            role='director',
            full_name='Test Director 2'
        )
        
        self.client.force_authenticate(user=self.director)
        
        url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
        data = {'escalation_level': 'beneficiary_services'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify director2 received notification (but not the escalating director)
        notifications = Notification.objects.filter(user=director2)
        self.assertTrue(notifications.exists())
        
        notification = notifications.first()
        self.assertIn("Appeal Escalated", notification.title)
        
        # Verify admin received notification
        admin_notifications = Notification.objects.filter(user=self.admin)
        self.assertTrue(admin_notifications.exists())
    
    def test_escalation_level_progression(self):
        """Test escalating through multiple levels"""
        self.client.force_authenticate(user=self.director)
        
        levels = ['director', 'beneficiary_services', 'ceo', 'dkdk']
        
        for level in levels:
            url = f'/api/forms/submissions/{self.appeal_submission.id}/escalate/'
            data = {'escalation_level': level}
            response = self.client.post(url, data, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            self.appeal_submission.refresh_from_db()
            self.assertEqual(self.appeal_submission.escalation_level, level)
            
            # Verify audit trail shows progression
            notes = SubmissionNote.objects.filter(submission=self.appeal_submission)
            self.assertTrue(notes.exists())
