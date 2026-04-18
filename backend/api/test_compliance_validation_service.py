"""
Comprehensive test suite for ComplianceValidationService.

Tests all validation methods for policy compliance enforcement including:
- Submission timing validation (30-day travel, 6-month graduation windows)
- Student eligibility checks (suspension status, age verification)
- Semester deadline enforcement
- Duplicate funding validation
- SFA denial letter requirements
- Travel approval timing
- Graduation Travel Bursary eligibility
- Guardian consent requirements
"""

from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from users.models import CustomUser
from api.services import ComplianceValidationService


class ComplianceValidationServiceTestCase(TestCase):
    """Test suite for ComplianceValidationService validation methods."""

    def setUp(self):
        """Set up test fixtures."""
        # Create test student
        self.student = CustomUser.objects.create_user(
            email='student@test.com',
            password='testpass123',
            full_name='Test Student',
            role='student',
            dob=date(2000, 1, 15)
        )
        
        # Create suspended student
        self.suspended_student = CustomUser.objects.create_user(
            email='suspended@test.com',
            password='testpass123',
            full_name='Suspended Student',
            role='student',
            dob=date(1995, 6, 20),
            is_suspended=True,
            suspended_until=timezone.now().date() + timedelta(days=30)
        )
        
        # Create minor student
        self.minor_student = CustomUser.objects.create_user(
            email='minor@test.com',
            password='testpass123',
            full_name='Minor Student',
            role='student',
            dob=date(2010, 3, 10)
        )

    # ==================== Submission Timing Validation Tests ====================

    def test_validate_submission_timing_travel_within_30_days(self):
        """Test travel claim submission within 30-day window is valid."""
        today = timezone.now().date()
        travel_date = today - timedelta(days=15)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormG',
            submission_date=today,
            travel_date=travel_date
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_submission_timing_travel_exactly_30_days(self):
        """Test travel claim submission exactly 30 days after travel is valid."""
        today = timezone.now().date()
        travel_date = today - timedelta(days=30)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormG',
            submission_date=today,
            travel_date=travel_date
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_submission_timing_travel_beyond_30_days(self):
        """Test travel claim submission beyond 30-day window is invalid."""
        today = timezone.now().date()
        travel_date = today - timedelta(days=31)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormG',
            submission_date=today,
            travel_date=travel_date
        )
        
        self.assertFalse(is_valid)
        self.assertIn("30 days", message)

    def test_validate_submission_timing_travel_future_date(self):
        """Test travel claim with future travel date is invalid."""
        today = timezone.now().date()
        travel_date = today + timedelta(days=10)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormG',
            submission_date=today,
            travel_date=travel_date
        )
        
        self.assertFalse(is_valid)
        self.assertIn("future", message.lower())

    def test_validate_submission_timing_graduation_within_6_months(self):
        """Test graduation award submission within 6-month window is valid."""
        today = timezone.now().date()
        completion_date = today - timedelta(days=90)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormE',
            submission_date=today,
            completion_date=completion_date
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_submission_timing_graduation_exactly_6_months(self):
        """Test graduation award submission exactly 6 months after completion is valid."""
        today = timezone.now().date()
        completion_date = today - timedelta(days=183)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormE',
            submission_date=today,
            completion_date=completion_date
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_submission_timing_graduation_beyond_6_months(self):
        """Test graduation award submission beyond 6-month window is invalid."""
        today = timezone.now().date()
        completion_date = today - timedelta(days=184)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormE',
            submission_date=today,
            completion_date=completion_date
        )
        
        self.assertFalse(is_valid)
        self.assertIn("6 months", message)

    def test_validate_submission_timing_practicum_within_6_months(self):
        """Test practicum award submission within 6-month window is valid."""
        today = timezone.now().date()
        completion_date = today - timedelta(days=120)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormF',
            submission_date=today,
            completion_date=completion_date
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_submission_timing_practicum_beyond_6_months(self):
        """Test practicum award submission beyond 6-month window is invalid."""
        today = timezone.now().date()
        completion_date = today - timedelta(days=200)
        
        is_valid, message = ComplianceValidationService.validate_submission_timing(
            form_type='FormF',
            submission_date=today,
            completion_date=completion_date
        )
        
        self.assertFalse(is_valid)
        self.assertIn("6 months", message)

    # ==================== Student Eligibility Validation Tests ====================

    def test_validate_student_eligibility_active_student(self):
        """Test active student passes eligibility validation."""
        is_valid, message = ComplianceValidationService.validate_student_eligibility(
            student=self.student,
            form_type='FormA'
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_student_eligibility_suspended_student(self):
        """Test suspended student fails eligibility validation."""
        is_valid, message = ComplianceValidationService.validate_student_eligibility(
            student=self.suspended_student,
            form_type='FormA'
        )
        
        self.assertFalse(is_valid)
        self.assertIn("suspended", message.lower())

    def test_validate_student_eligibility_suspension_expired(self):
        """Test student with expired suspension passes eligibility validation."""
        # Create student with past suspension date
        expired_suspended = CustomUser.objects.create_user(
            email='expired@test.com',
            password='testpass123',
            full_name='Expired Suspension',
            role='student',
            dob=date(1995, 1, 1),
            is_suspended=True,
            suspended_until=timezone.now().date() - timedelta(days=1)
        )
        
        is_valid, message = ComplianceValidationService.validate_student_eligibility(
            student=expired_suspended,
            form_type='FormA'
        )
        
        self.assertTrue(is_valid)

    # ==================== Semester Deadline Validation Tests ====================

    def test_validate_semester_deadline_before_fall_deadline(self):
        """Test submission before Fall deadline (Aug 1) is on time."""
        submission_date = date(2024, 7, 15)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertFalse(is_late)
        self.assertEqual(next_deadline, date(2024, 8, 1))
        self.assertEqual(message, "")

    def test_validate_semester_deadline_on_fall_deadline(self):
        """Test submission on Fall deadline (Aug 1) is on time."""
        submission_date = date(2024, 8, 1)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertFalse(is_late)
        self.assertEqual(next_deadline, date(2024, 8, 1))

    def test_validate_semester_deadline_after_fall_deadline(self):
        """Test submission after Fall deadline (Aug 1) is late."""
        submission_date = date(2024, 8, 2)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertTrue(is_late)
        self.assertIn("Director exception", message)

    def test_validate_semester_deadline_before_winter_deadline(self):
        """Test submission before Winter deadline (Dec 1) is on time."""
        submission_date = date(2024, 11, 15)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertFalse(is_late)
        self.assertEqual(next_deadline, date(2024, 12, 1))

    def test_validate_semester_deadline_before_spring_deadline(self):
        """Test submission before Spring deadline (Apr 1) is on time."""
        submission_date = date(2024, 3, 15)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertFalse(is_late)
        self.assertEqual(next_deadline, date(2024, 4, 1))

    def test_validate_semester_deadline_before_summer_deadline(self):
        """Test submission before Summer deadline (Jun 1) is on time."""
        submission_date = date(2024, 5, 15)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertFalse(is_late)
        self.assertEqual(next_deadline, date(2024, 6, 1))

    def test_validate_semester_deadline_after_all_deadlines(self):
        """Test submission after all deadlines in year wraps to next year."""
        submission_date = date(2024, 12, 2)  # After Dec 1 (last deadline of year)
        
        is_late, next_deadline, message = ComplianceValidationService.validate_semester_deadline(
            submission_date=submission_date
        )
        
        self.assertTrue(is_late)
        self.assertEqual(next_deadline, date(2025, 4, 1))  # Next deadline is Apr 1 of next year

    # ==================== Duplicate Funding Validation Tests ====================

    def test_validate_duplicate_funding_no_existing_funding(self):
        """Test student with no existing funding passes validation."""
        eligibility_answers = {
            'Eligibility q8': 'no'
        }
        
        is_valid, message = ComplianceValidationService.validate_duplicate_funding(
            eligibility_answers=eligibility_answers
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_duplicate_funding_existing_funding(self):
        """Test student with existing funding fails validation."""
        eligibility_answers = {
            'Eligibility q8': 'yes'
        }
        
        is_valid, message = ComplianceValidationService.validate_duplicate_funding(
            eligibility_answers=eligibility_answers
        )
        
        self.assertFalse(is_valid)
        self.assertIn("C-DFN", message)

    def test_validate_duplicate_funding_case_insensitive(self):
        """Test duplicate funding validation is case insensitive."""
        eligibility_answers = {
            'Eligibility q8': 'YES'
        }
        
        is_valid, message = ComplianceValidationService.validate_duplicate_funding(
            eligibility_answers=eligibility_answers
        )
        
        self.assertFalse(is_valid)

    def test_validate_duplicate_funding_missing_q8(self):
        """Test missing q8 answer defaults to valid."""
        eligibility_answers = {}
        
        is_valid, message = ComplianceValidationService.validate_duplicate_funding(
            eligibility_answers=eligibility_answers
        )
        
        self.assertTrue(is_valid)

    # ==================== SFA Denial Letter Validation Tests ====================

    def test_validate_sfa_denial_requirement_sfa_applied(self):
        """Test student who applied for SFA doesn't need denial letter."""
        eligibility_answers = {
            'Eligibility q3': 'yes'
        }
        uploaded_files = {}
        
        is_valid, message = ComplianceValidationService.validate_sfa_denial_requirement(
            eligibility_answers=eligibility_answers,
            uploaded_files=uploaded_files,
            bursary_stream='PSSSP'
        )
        
        self.assertTrue(is_valid)

    def test_validate_sfa_denial_requirement_no_sfa_psssp_with_letter(self):
        """Test C-DFN PSSSP student without SFA but with denial letter passes."""
        eligibility_answers = {
            'Eligibility q3': 'no'
        }
        uploaded_files = {
            'SFA Denial Letter': 'file_object'
        }
        
        is_valid, message = ComplianceValidationService.validate_sfa_denial_requirement(
            eligibility_answers=eligibility_answers,
            uploaded_files=uploaded_files,
            bursary_stream='PSSSP'
        )
        
        self.assertTrue(is_valid)

    def test_validate_sfa_denial_requirement_no_sfa_psssp_without_letter(self):
        """Test C-DFN PSSSP student without SFA and without denial letter fails."""
        eligibility_answers = {
            'Eligibility q3': 'no'
        }
        uploaded_files = {}
        
        is_valid, message = ComplianceValidationService.validate_sfa_denial_requirement(
            eligibility_answers=eligibility_answers,
            uploaded_files=uploaded_files,
            bursary_stream='PSSSP'
        )
        
        self.assertFalse(is_valid)
        self.assertIn("SFA denial letter", message)

    def test_validate_sfa_denial_requirement_no_sfa_ucepp(self):
        """Test UCEPP student without SFA doesn't need denial letter."""
        eligibility_answers = {
            'Eligibility q3': 'no'
        }
        uploaded_files = {}
        
        is_valid, message = ComplianceValidationService.validate_sfa_denial_requirement(
            eligibility_answers=eligibility_answers,
            uploaded_files=uploaded_files,
            bursary_stream='UCEPP'
        )
        
        self.assertTrue(is_valid)

    # ==================== Travel Approval Timing Validation Tests ====================

    def test_validate_travel_approval_timing_past_travel(self):
        """Test travel approval for past travel date is valid."""
        travel_date = timezone.now().date() - timedelta(days=5)
        
        is_valid, message = ComplianceValidationService.validate_travel_approval_timing(
            travel_date=travel_date
        )
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "")

    def test_validate_travel_approval_timing_today_travel(self):
        """Test travel approval for today's travel is valid."""
        travel_date = timezone.now().date()
        
        is_valid, message = ComplianceValidationService.validate_travel_approval_timing(
            travel_date=travel_date
        )
        
        self.assertTrue(is_valid)

    def test_validate_travel_approval_timing_future_travel(self):
        """Test travel approval for future travel date is invalid."""
        travel_date = timezone.now().date() + timedelta(days=5)
        
        is_valid, message = ComplianceValidationService.validate_travel_approval_timing(
            travel_date=travel_date
        )
        
        self.assertFalse(is_valid)
        self.assertIn("travel date has passed", message)

    # ==================== Graduation Travel Bursary Eligibility Tests ====================

    def test_validate_gtb_eligibility_diploma(self):
        """Test Diploma credential qualifies for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Diploma'
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_bachelor(self):
        """Test Bachelor's Degree credential qualifies for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Bachelor\'s Degree'
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_master(self):
        """Test Master's Degree credential qualifies for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Master\'s Degree'
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_phd(self):
        """Test PhD credential qualifies for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Doctorate (PhD)'
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_jd(self):
        """Test Juris Doctor credential qualifies for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Juris Doctor / Bachelor of Laws'
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_md(self):
        """Test MD credential qualifies for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='MD or DDS'
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_certificate(self):
        """Test Certificate credential does not qualify for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Certificate'
        )
        
        self.assertFalse(is_valid)
        self.assertIn("2+ year", message)

    def test_validate_gtb_eligibility_high_school(self):
        """Test High School Diploma does not qualify for GTB."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='High School Diploma'
        )
        
        self.assertFalse(is_valid)

    def test_validate_gtb_eligibility_with_program_duration_valid(self):
        """Test GTB eligibility with valid program duration."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Diploma',
            program_duration=2
        )
        
        self.assertTrue(is_valid)

    def test_validate_gtb_eligibility_with_program_duration_invalid(self):
        """Test GTB eligibility with invalid program duration."""
        is_valid, message = ComplianceValidationService.validate_graduation_travel_bursary_eligibility(
            credential_type='Diploma',
            program_duration=1
        )
        
        self.assertFalse(is_valid)
        self.assertIn("2 or more years", message)

    # ==================== Guardian Consent Requirement Tests ====================

    def test_validate_guardian_consent_adult_student(self):
        """Test adult student does not require guardian consent."""
        requires_consent, message = ComplianceValidationService.validate_guardian_consent_requirement(
            student_dob=date(2000, 1, 15)
        )
        
        self.assertFalse(requires_consent)
        self.assertEqual(message, "")

    def test_validate_guardian_consent_minor_student(self):
        """Test minor student requires guardian consent."""
        # Create DOB that makes student under 18
        today = timezone.now().date()
        minor_dob = date(today.year - 17, today.month, today.day)
        
        requires_consent, message = ComplianceValidationService.validate_guardian_consent_requirement(
            student_dob=minor_dob
        )
        
        self.assertTrue(requires_consent)
        self.assertIn("under 18", message)

    def test_validate_guardian_consent_exactly_18(self):
        """Test student who just turned 18 does not require consent."""
        today = timezone.now().date()
        dob_18 = date(today.year - 18, today.month, today.day)
        
        requires_consent, message = ComplianceValidationService.validate_guardian_consent_requirement(
            student_dob=dob_18
        )
        
        self.assertFalse(requires_consent)

    def test_validate_guardian_consent_just_under_18(self):
        """Test student just under 18 requires consent."""
        today = timezone.now().date()
        # One day before turning 18
        dob_under_18 = date(today.year - 18, today.month, today.day) + timedelta(days=1)
        
        requires_consent, message = ComplianceValidationService.validate_guardian_consent_requirement(
            student_dob=dob_under_18
        )
        
        self.assertTrue(requires_consent)
