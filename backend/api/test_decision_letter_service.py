"""
Unit tests for DecisionLetterService

Tests all letter generation scenarios including:
- Approval letter generation with student name, form title, amount, decision date
- Rejection letter generation with reason
- Letter customization for different form types
- Template validation and error handling
- Status change letter generation
"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import datetime, date
from django.contrib.auth import get_user_model

from .services import DecisionLetterService
from forms.models import Form, FormSubmission
from programs.models import Program

User = get_user_model()


class DecisionLetterServiceTestCase(TestCase):
    """Test suite for DecisionLetterService"""

    def setUp(self):
        """Set up test data with users, programs, and forms"""
        # Create a program
        self.program = Program.objects.create(
            title='Test Program',
            description='Test program for letter generation'
        )
        
        # Create test forms
        self.form_a = Form.objects.create(
            title='FormA',
            description='New Student Application',
            program=self.program,
            purpose='application'
        )
        
        self.form_e = Form.objects.create(
            title='FormE',
            description='Graduation Award',
            program=self.program,
            purpose='application'
        )
        
        self.form_g = Form.objects.create(
            title='FormG',
            description='Travel Claim',
            program=self.program,
            purpose='application'
        )
        
        # Create test student
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            full_name='John Doe',
            role='student'
        )
        
        # Create test director
        self.director = User.objects.create_user(
            email='director@test.com',
            password='testpass123',
            full_name='Jane Smith',
            role='director'
        )

    def test_generate_approval_letter_basic(self):
        """Test basic approval letter generation"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        # Verify letter contains required elements
        self.assertIn('DECISION LETTER - APPROVAL', letter)
        self.assertIn('John Doe', letter)
        self.assertIn('New Student Application', letter)
        self.assertIn('$5,000.00', letter)
        self.assertIn('APPROVED', letter)

    def test_generate_approval_letter_with_email_fallback(self):
        """Test approval letter uses email when full name not available"""
        student_no_name = User.objects.create_user(
            email='noname@test.com',
            password='testpass123',
            role='student'
        )
        
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=student_no_name,
            status='accepted',
            amount=Decimal('3000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('noname@test.com', letter)
        self.assertIn('APPROVED', letter)

    def test_generate_approval_letter_zero_amount(self):
        """Test approval letter with zero amount"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('0.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('$0.00', letter)
        self.assertIn('APPROVED', letter)

    def test_generate_approval_letter_large_amount(self):
        """Test approval letter with large amount"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('25000.50'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('$25,000.50', letter)

    def test_generate_approval_letter_form_e_graduation_award(self):
        """Test approval letter for Form E (Graduation Award)"""
        submission = FormSubmission.objects.create(
            form=self.form_e,
            student=self.student,
            status='accepted',
            amount=Decimal('3000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('Graduation Award', letter)
        self.assertIn('APPROVED', letter)

    def test_generate_approval_letter_form_g_travel_claim(self):
        """Test approval letter for Form G (Travel Claim)"""
        submission = FormSubmission.objects.create(
            form=self.form_g,
            student=self.student,
            status='accepted',
            amount=Decimal('1500.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('Travel Claim', letter)
        self.assertIn('APPROVED', letter)

    def test_generate_approval_letter_missing_student_raises_error(self):
        """Test that approval letter raises error when student is missing"""
        submission = FormSubmission(
            form=self.form_a,
            student=None,
            status='accepted',
            amount=Decimal('5000.00')
        )
        
        with self.assertRaises(ValueError) as context:
            DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('student', str(context.exception).lower())

    def test_generate_approval_letter_missing_form_raises_error(self):
        """Test that approval letter raises error when form is missing"""
        submission = FormSubmission(
            form=None,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00')
        )
        
        with self.assertRaises(ValueError) as context:
            DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('form', str(context.exception).lower())

    def test_generate_rejection_letter_basic(self):
        """Test basic rejection letter generation"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Does not meet eligibility requirements'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        # Verify letter contains required elements
        self.assertIn('DECISION LETTER - REJECTION', letter)
        self.assertIn('John Doe', letter)
        self.assertIn('New Student Application', letter)
        self.assertIn('REJECTED', letter)
        self.assertIn('Does not meet eligibility requirements', letter)

    def test_generate_rejection_letter_with_custom_reason(self):
        """Test rejection letter with custom reason parameter"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Original reason'
        )
        
        custom_reason = 'Custom rejection reason provided at letter generation'
        letter = DecisionLetterService.generate_rejection_letter(submission, custom_reason)
        
        self.assertIn(custom_reason, letter)
        self.assertNotIn('Original reason', letter)

    def test_generate_rejection_letter_default_reason(self):
        """Test rejection letter uses default reason when none provided"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason=None
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('does not meet the eligibility requirements', letter.lower())

    def test_generate_rejection_letter_form_e(self):
        """Test rejection letter for Form E (Graduation Award)"""
        submission = FormSubmission.objects.create(
            form=self.form_e,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Credential type not eligible'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('Graduation Award', letter)
        self.assertIn('REJECTED', letter)
        self.assertIn('Credential type not eligible', letter)

    def test_generate_rejection_letter_form_g(self):
        """Test rejection letter for Form G (Travel Claim)"""
        submission = FormSubmission.objects.create(
            form=self.form_g,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Travel date outside 30-day window'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('Travel Claim', letter)
        self.assertIn('REJECTED', letter)
        self.assertIn('Travel date outside 30-day window', letter)

    def test_generate_rejection_letter_missing_student_raises_error(self):
        """Test that rejection letter raises error when student is missing"""
        submission = FormSubmission(
            form=self.form_a,
            student=None,
            status='rejected'
        )
        
        with self.assertRaises(ValueError) as context:
            DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('student', str(context.exception).lower())

    def test_generate_rejection_letter_missing_form_raises_error(self):
        """Test that rejection letter raises error when form is missing"""
        submission = FormSubmission(
            form=None,
            student=self.student,
            status='rejected'
        )
        
        with self.assertRaises(ValueError) as context:
            DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('form', str(context.exception).lower())

    def test_generate_letter_for_status_change_accepted(self):
        """Test letter generation for accepted status change"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_letter_for_status_change(submission, 'accepted')
        
        self.assertIn('APPROVAL', letter)
        self.assertIn('APPROVED', letter)

    def test_generate_letter_for_status_change_rejected(self):
        """Test letter generation for rejected status change"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Test rejection'
        )
        
        letter = DecisionLetterService.generate_letter_for_status_change(submission, 'rejected')
        
        self.assertIn('REJECTION', letter)
        self.assertIn('REJECTED', letter)

    def test_generate_letter_for_status_change_pending(self):
        """Test letter generation for pending status returns empty string"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='pending'
        )
        
        letter = DecisionLetterService.generate_letter_for_status_change(submission, 'pending')
        
        self.assertEqual(letter, "")

    def test_generate_letter_for_status_change_reviewed(self):
        """Test letter generation for reviewed status returns empty string"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='reviewed'
        )
        
        letter = DecisionLetterService.generate_letter_for_status_change(submission, 'reviewed')
        
        self.assertEqual(letter, "")

    def test_validate_letter_template_valid_approval(self):
        """Test validation of valid approval letter"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        is_valid, message = DecisionLetterService.validate_letter_template(letter)
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_letter_template_valid_rejection(self):
        """Test validation of valid rejection letter"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Test reason'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        is_valid, message = DecisionLetterService.validate_letter_template(letter)
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_letter_template_empty_string(self):
        """Test validation fails for empty letter"""
        is_valid, message = DecisionLetterService.validate_letter_template("")
        
        self.assertFalse(is_valid)
        self.assertIn('empty', message.lower())

    def test_validate_letter_template_missing_date(self):
        """Test validation fails when Date: is missing"""
        letter = "Dear Student,\nThis is a test letter without date."
        is_valid, message = DecisionLetterService.validate_letter_template(letter)
        
        self.assertFalse(is_valid)
        self.assertIn('required', message.lower())

    def test_validate_letter_template_missing_decision(self):
        """Test validation fails when decision type is missing"""
        letter = """Date: January 1, 2024
Dear John Doe,
Form Type: Test Form
Decision Date: January 1, 2024
This is a test letter."""
        
        is_valid, message = DecisionLetterService.validate_letter_template(letter)
        
        self.assertFalse(is_valid)
        self.assertIn('approval or rejection', message.lower())

    def test_form_type_names_mapping(self):
        """Test that all form types have display names"""
        form_types = ['FormA', 'FormB', 'FormC', 'FormD', 'FormE', 'FormF', 'FormG', 'FormH', 'FormGTB']
        
        for form_type in form_types:
            self.assertIn(form_type, DecisionLetterService.FORM_TYPE_NAMES)
            self.assertIsNotNone(DecisionLetterService.FORM_TYPE_NAMES[form_type])
            self.assertGreater(len(DecisionLetterService.FORM_TYPE_NAMES[form_type]), 0)

    def test_approval_letter_date_formatting(self):
        """Test that approval letter formats date correctly"""
        test_date = timezone.make_aware(datetime(2024, 3, 15, 10, 30, 0))
        
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00'),
            decided_at=test_date,
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        # Should contain formatted date
        self.assertIn('March 15, 2024', letter)

    def test_rejection_letter_date_formatting(self):
        """Test that rejection letter formats date correctly"""
        test_date = timezone.make_aware(datetime(2024, 6, 20, 14, 45, 0))
        
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=test_date,
            decided_by=self.director,
            decision_reason='Test reason'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        # Should contain formatted date
        self.assertIn('June 20, 2024', letter)

    def test_approval_letter_contains_payment_information(self):
        """Test that approval letter contains payment information"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('payment schedule', letter.lower())
        self.assertIn('payment details', letter.lower())

    def test_rejection_letter_contains_appeal_information(self):
        """Test that rejection letter contains appeal information"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Test reason'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('appeal', letter.lower())
        self.assertIn('form h', letter.lower())
        self.assertIn('30 days', letter.lower())

    def test_approval_letter_contains_contact_information(self):
        """Test that approval letter contains contact information"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='accepted',
            amount=Decimal('5000.00'),
            decided_at=timezone.now(),
            decided_by=self.director
        )
        
        letter = DecisionLetterService.generate_approval_letter(submission)
        
        self.assertIn('DGG Education Department', letter)
        self.assertIn('DGG Student Support Services', letter)

    def test_rejection_letter_contains_contact_information(self):
        """Test that rejection letter contains contact information"""
        submission = FormSubmission.objects.create(
            form=self.form_a,
            student=self.student,
            status='rejected',
            decided_at=timezone.now(),
            decided_by=self.director,
            decision_reason='Test reason'
        )
        
        letter = DecisionLetterService.generate_rejection_letter(submission)
        
        self.assertIn('DGG Education Department', letter)
        self.assertIn('DGG Student Support Services', letter)

    def test_approval_letter_multiple_form_types(self):
        """Test approval letter generation for multiple form types"""
        form_types = [
            (self.form_a, 'New Student Application'),
            (self.form_e, 'Graduation Award'),
            (self.form_g, 'Travel Claim'),
        ]
        
        for form, expected_title in form_types:
            submission = FormSubmission.objects.create(
                form=form,
                student=self.student,
                status='accepted',
                amount=Decimal('1000.00'),
                decided_at=timezone.now(),
                decided_by=self.director
            )
            
            letter = DecisionLetterService.generate_approval_letter(submission)
            
            self.assertIn(expected_title, letter)
            self.assertIn('APPROVED', letter)

    def test_rejection_letter_multiple_form_types(self):
        """Test rejection letter generation for multiple form types"""
        form_types = [
            (self.form_a, 'New Student Application'),
            (self.form_e, 'Graduation Award'),
            (self.form_g, 'Travel Claim'),
        ]
        
        for form, expected_title in form_types:
            submission = FormSubmission.objects.create(
                form=form,
                student=self.student,
                status='rejected',
                decided_at=timezone.now(),
                decided_by=self.director,
                decision_reason='Test reason'
            )
            
            letter = DecisionLetterService.generate_rejection_letter(submission)
            
            self.assertIn(expected_title, letter)
            self.assertIn('REJECTED', letter)
