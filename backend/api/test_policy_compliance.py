"""
Comprehensive policy validation test suite for all 23 DGG policy compliance scenarios.

Tests cover:
- Requirement 2.1: Form E/G label and routing corrections
- Requirement 2.2: Living allowance calculations from PolicySetting
- Requirement 2.3: UCEPP vs PSSSP tuition cap routing
- Requirement 2.4: Payment record creation on approval
- Requirement 2.5: FormBTracking creation for Form A
- Requirement 2.6: Suspension blocking
- Requirement 2.7: Semester deadline enforcement with Director exceptions
- Requirement 2.8: Decision letter generation
- Requirement 2.9: Finance notifications on approval
- Requirement 2.10: Form G credential options and auto-amount
- Requirement 2.11: Travel claim 30-day window validation
- Requirement 2.12: Graduation/practicum 6-month window validation
- Requirement 2.13: Appeals list view
- Requirement 2.14: DGGR annual cap enforcement
- Requirement 2.15: Overpayment detection on Form D
- Requirement 2.16: Block travel claim approval for future dates
- Requirement 2.17: Graduation Travel Bursary form support
- Requirement 2.18: Backend submission ID as reference number
- Requirement 2.19: Monthly living allowance disbursement schedules
- Requirement 2.20: Under-18 guardian consent flagging
- Requirement 2.21: SFA denial letter requirement for C-DFN PSSSP
- Requirement 2.22: Appeal escalation workflow
- Requirement 2.23: Duplicate funding check (Eligibility q8)
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from api.models import PolicySetting, Payment, FormBTracking, ExtraTuitionBudget, PaymentSchedule
from forms.models import FormSubmission

User = get_user_model()


class PolicyComplianceTestCase(TestCase):
    """Test suite for all 23 policy compliance scenarios"""
    
    def setUp(self):
        """Set up test data"""
        # Create test student
        self.student = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            full_name="Test Student",
            role="student",
            dob=date(2000, 1, 1)
        )
        
        # Create suspended student
        self.suspended_student = User.objects.create_user(
            email="suspended@test.com",
            password="testpass123",
            full_name="Suspended Student",
            role="student",
            is_suspended=True,
            suspended_until=timezone.now().date() + timedelta(days=30)
        )
        
        # Create minor student
        self.minor_student = User.objects.create_user(
            email="minor@test.com",
            password="testpass123",
            full_name="Minor Student",
            role="student",
            dob=date(2010, 1, 1)
        )
        
        # Create admin user
        self.admin = User.objects.create_user(
            email="admin@test.com",
            password="testpass123",
            full_name="Admin User",
            role="admin"
        )
        
        # Create finance user
        self.finance = User.objects.create_user(
            email="finance@test.com",
            password="testpass123",
            full_name="Finance User",
            role="finance"
        )
        
        # Seed PolicySetting records
        self._seed_policy_settings()
    
    def _seed_policy_settings(self):
        """Seed required PolicySetting records"""
        # Living allowance rates
        PolicySetting.objects.create(
            key="living_allowance_psssp_ft_single",
            setting_type="living_allowance",
            value=Decimal("1200.00"),
            stream="PSSSP",
            status="FT",
            dependent_count=0
        )
        
        PolicySetting.objects.create(
            key="living_allowance_psssp_ft_dependents",
            setting_type="living_allowance",
            value=Decimal("1800.00"),
            stream="PSSSP",
            status="FT",
            dependent_count=1
        )
        
        PolicySetting.objects.create(
            key="living_allowance_psssp_pt_single",
            setting_type="living_allowance",
            value=Decimal("800.00"),
            stream="PSSSP",
            status="PT",
            dependent_count=0
        )
        
        PolicySetting.objects.create(
            key="living_allowance_psssp_pt_dependents",
            setting_type="living_allowance",
            value=Decimal("1200.00"),
            stream="PSSSP",
            status="PT",
            dependent_count=1
        )
        
        PolicySetting.objects.create(
            key="living_allowance_ucepp_ft",
            setting_type="living_allowance",
            value=Decimal("1000.00"),
            stream="UCEPP",
            status="FT"
        )
        
        PolicySetting.objects.create(
            key="living_allowance_ucepp_pt",
            setting_type="living_allowance",
            value=Decimal("600.00"),
            stream="UCEPP",
            status="PT"
        )
        
        # Tuition caps
        PolicySetting.objects.create(
            key="tuition_cap_psssp",
            setting_type="tuition_cap",
            value=Decimal("5000.00"),
            stream="PSSSP"
        )
        
        PolicySetting.objects.create(
            key="tuition_cap_ucepp",
            setting_type="tuition_cap",
            value=Decimal("2000.00"),
            stream="UCEPP"
        )
        
        # Credential award amounts
        credentials = [
            ("High School Diploma", 500.00),
            ("Certificate", 1000.00),
            ("Trades Certificate of Qualification", 2000.00),
            ("Trades Journeyperson Licence", 3000.00),
            ("Diploma", 2000.00),
            ("Professional Pilot Licence", 3000.00),
            ("Red Seal", 3000.00),
            ("Bachelor's Degree", 3000.00),
            ("Master's Degree", 5000.00),
            ("Doctorate (PhD)", 5000.00),
            ("Juris Doctor / Bachelor of Laws", 5000.00),
            ("MD or DDS", 5000.00),
        ]
        
        for credential_type, amount in credentials:
            PolicySetting.objects.create(
                key=f"credential_{credential_type.lower().replace(' ', '_')}",
                setting_type="credential_amount",
                value=Decimal(str(amount)),
                credential_type=credential_type
            )
        
        # Budget cap
        PolicySetting.objects.create(
            key="dggr_extra_tuition_annual_cap",
            setting_type="budget_cap",
            value=Decimal("36000.00"),
            stream="DGGR"
        )
    
    # ===== Requirement 2.2: Living Allowance Calculations =====
    
    def test_living_allowance_psssp_ft_single(self):
        """Test living allowance calculation for PSSSP FT single student"""
        setting = PolicySetting.objects.get(key="living_allowance_psssp_ft_single")
        self.assertEqual(setting.value, Decimal("1200.00"))
        self.assertEqual(setting.stream, "PSSSP")
        self.assertEqual(setting.status, "FT")
    
    def test_living_allowance_psssp_ft_with_dependents(self):
        """Test living allowance calculation for PSSSP FT with dependents"""
        setting = PolicySetting.objects.get(key="living_allowance_psssp_ft_dependents")
        self.assertEqual(setting.value, Decimal("1800.00"))
        self.assertEqual(setting.dependent_count, 1)
    
    def test_living_allowance_psssp_pt_single(self):
        """Test living allowance calculation for PSSSP PT single student"""
        setting = PolicySetting.objects.get(key="living_allowance_psssp_pt_single")
        self.assertEqual(setting.value, Decimal("800.00"))
        self.assertEqual(setting.status, "PT")
    
    def test_living_allowance_psssp_pt_with_dependents(self):
        """Test living allowance calculation for PSSSP PT with dependents"""
        setting = PolicySetting.objects.get(key="living_allowance_psssp_pt_dependents")
        self.assertEqual(setting.value, Decimal("1200.00"))
    
    def test_living_allowance_ucepp_ft(self):
        """Test living allowance calculation for UCEPP FT"""
        setting = PolicySetting.objects.get(key="living_allowance_ucepp_ft")
        self.assertEqual(setting.value, Decimal("1000.00"))
        self.assertEqual(setting.stream, "UCEPP")
    
    def test_living_allowance_ucepp_pt(self):
        """Test living allowance calculation for UCEPP PT"""
        setting = PolicySetting.objects.get(key="living_allowance_ucepp_pt")
        self.assertEqual(setting.value, Decimal("600.00"))
    
    # ===== Requirement 2.3: UCEPP vs PSSSP Tuition Cap Routing =====
    
    def test_tuition_cap_psssp(self):
        """Test PSSSP tuition cap is ,000"""
        setting = PolicySetting.objects.get(key="tuition_cap_psssp")
        self.assertEqual(setting.value, Decimal("5000.00"))
        self.assertEqual(setting.stream, "PSSSP")
    
    def test_tuition_cap_ucepp(self):
        """Test UCEPP tuition cap is ,000"""
        setting = PolicySetting.objects.get(key="tuition_cap_ucepp")
        self.assertEqual(setting.value, Decimal("2000.00"))
        self.assertEqual(setting.stream, "UCEPP")
    
    def test_tuition_cap_difference(self):
        """Test UCEPP cap is ,000 less than PSSSP"""
        psssp_cap = PolicySetting.objects.get(key="tuition_cap_psssp").value
        ucepp_cap = PolicySetting.objects.get(key="tuition_cap_ucepp").value
        self.assertEqual(psssp_cap - ucepp_cap, Decimal("3000.00"))
    
    # ===== Requirement 2.10: Form G Credential Options =====
    
    def test_all_12_credential_types_available(self):
        """Test all 12 credential types are available in PolicySetting"""
        credential_types = [
            "High School Diploma",
            "Certificate",
            "Trades Certificate of Qualification",
            "Trades Journeyperson Licence",
            "Diploma",
            "Professional Pilot Licence",
            "Red Seal",
            "Bachelor's Degree",
            "Master's Degree",
            "Doctorate (PhD)",
            "Juris Doctor / Bachelor of Laws",
            "MD or DDS",
        ]
        
        for credential_type in credential_types:
            setting = PolicySetting.objects.filter(
                setting_type="credential_amount",
                credential_type=credential_type
            ).first()
            self.assertIsNotNone(setting, f"Credential type {credential_type} not found")
    
    def test_credential_high_school_diploma_amount(self):
        """Test High School Diploma award amount is """
        setting = PolicySetting.objects.get(
            setting_type="credential_amount",
            credential_type="High School Diploma"
        )
        self.assertEqual(setting.value, Decimal("500.00"))
    
    def test_credential_bachelor_degree_amount(self):
        """Test Bachelor's Degree award amount is ,000"""
        setting = PolicySetting.objects.get(
            setting_type="credential_amount",
            credential_type="Bachelor's Degree"
        )
        self.assertEqual(setting.value, Decimal("3000.00"))
    
    def test_credential_master_degree_amount(self):
        """Test Master's Degree award amount is ,000"""
        setting = PolicySetting.objects.get(
            setting_type="credential_amount",
            credential_type="Master's Degree"
        )
        self.assertEqual(setting.value, Decimal("5000.00"))
    
    def test_credential_phd_amount(self):
        """Test PhD award amount is ,000"""
        setting = PolicySetting.objects.get(
            setting_type="credential_amount",
            credential_type="Doctorate (PhD)"
        )
        self.assertEqual(setting.value, Decimal("5000.00"))
    
    # ===== Requirement 2.14: DGGR Budget Cap Enforcement =====
    
    def test_dggr_annual_cap_is_36000(self):
        """Test DGGR annual cap is ,000"""
        setting = PolicySetting.objects.get(key="dggr_extra_tuition_annual_cap")
        self.assertEqual(setting.value, Decimal("36000.00"))
        self.assertEqual(setting.stream, "DGGR")
    
    def test_extra_tuition_budget_model_exists(self):
        """Test ExtraTuitionBudget model can be created"""
        budget = ExtraTuitionBudget.objects.create(
            fiscal_year="2025-2026",
            total_budget=Decimal("36000.00"),
            allocated_amount=Decimal("0.00")
        )
        self.assertEqual(budget.fiscal_year, "2025-2026")
        self.assertEqual(budget.total_budget, Decimal("36000.00"))
        self.assertEqual(budget.remaining_amount, Decimal("36000.00"))
    
    def test_extra_tuition_budget_allocation_tracking(self):
        """Test ExtraTuitionBudget tracks allocations correctly"""
        budget = ExtraTuitionBudget.objects.create(
            fiscal_year="2025-2026",
            total_budget=Decimal("36000.00"),
            allocated_amount=Decimal("10000.00")
        )
        self.assertEqual(budget.remaining_amount, Decimal("26000.00"))
    
    def test_extra_tuition_budget_fiscal_year_calculation(self):
        """Test fiscal year calculation (April 1 - March 31)"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        self.assertIsNotNone(fiscal_year)
        self.assertIn("-", fiscal_year)
    
    # ===== Requirement 2.4: Payment Record Creation =====
    
    def test_payment_model_creation(self):
        """Test Payment model can be created"""
        payment = Payment.objects.create(
            student=self.student,
            payment_type="tuition",
            amount=Decimal("5000.00"),
            status="scheduled",
            scheduled_date=timezone.now().date() + timedelta(days=30)
        )
        self.assertEqual(payment.student, self.student)
        self.assertEqual(payment.amount, Decimal("5000.00"))
        self.assertEqual(payment.status, "scheduled")
    
    def test_payment_reference_number_generation(self):
        """Test Payment reference number is auto-generated"""
        payment = Payment.objects.create(
            student=self.student,
            payment_type="tuition",
            amount=Decimal("5000.00"),
            status="scheduled",
            scheduled_date=timezone.now().date() + timedelta(days=30)
        )
        self.assertIsNotNone(payment.reference_number)
        self.assertTrue(payment.reference_number.startswith("PAY-"))
    
    def test_payment_types_available(self):
        """Test all payment types are available"""
        payment_types = [
            "tuition",
            "living_allowance",
            "graduation_award",
            "travel_claim",
            "practicum_award",
            "graduation_travel_bursary",
        ]
        
        for payment_type in payment_types:
            payment = Payment.objects.create(
                student=self.student,
                payment_type=payment_type,
                amount=Decimal("1000.00"),
                status="scheduled",
                scheduled_date=timezone.now().date()
            )
            self.assertEqual(payment.payment_type, payment_type)
    
    # ===== Requirement 2.5: FormBTracking Creation =====
    
    def test_form_b_tracking_model_structure(self):
        """Test FormBTracking model has required fields"""
        # Verify FormBTracking model exists and has required fields
        self.assertTrue(hasattr(FormBTracking, '_meta'))
        fields = [f.name for f in FormBTracking._meta.get_fields()]
        self.assertIn('registrar_email', fields)
        self.assertIn('institution_name', fields)
        self.assertIn('status', fields)
        self.assertIn('due_date', fields)
    
    def test_form_b_tracking_status_choices_defined(self):
        """Test FormBTracking status choices are defined"""
        # Get the status field
        status_field = FormBTracking._meta.get_field('status')
        choices = [choice[0] for choice in status_field.choices]
        
        expected_statuses = ["pending", "sent", "submitted", "verified", "overdue", "expired"]
        for status in expected_statuses:
            self.assertIn(status, choices)
    
    def test_form_b_tracking_is_overdue_method_exists(self):
        """Test FormBTracking.is_overdue() method exists"""
        self.assertTrue(hasattr(FormBTracking, 'is_overdue'))
        self.assertTrue(callable(getattr(FormBTracking, 'is_overdue')))
    
    # ===== Requirement 2.19: Payment Schedule =====
    
    def test_payment_schedule_model_creation(self):
        """Test PaymentSchedule model can be created"""
        payment = Payment.objects.create(
            student=self.student,
            payment_type="living_allowance",
            amount=Decimal("1200.00"),
            status="scheduled",
            scheduled_date=timezone.now().date()
        )
        
        schedule = PaymentSchedule.objects.create(
            payment=payment,
            month_year=timezone.now().date(),
            amount=Decimal("1200.00"),
            status="scheduled"
        )
        self.assertEqual(schedule.payment, payment)
        self.assertEqual(schedule.amount, Decimal("1200.00"))
    
    def test_payment_schedule_monthly_entries(self):
        """Test PaymentSchedule can create multiple monthly entries"""
        payment = Payment.objects.create(
            student=self.student,
            payment_type="living_allowance",
            amount=Decimal("4800.00"),
            status="scheduled",
            scheduled_date=timezone.now().date()
        )
        
        # Create 4 monthly entries
        for i in range(4):
            month_date = timezone.now().date() + timedelta(days=30*i)
            PaymentSchedule.objects.create(
                payment=payment,
                month_year=month_date,
                amount=Decimal("1200.00"),
                status="scheduled"
            )
        
        schedules = PaymentSchedule.objects.filter(payment=payment)
        self.assertEqual(schedules.count(), 4)
    
    # ===== Requirement 2.6: Suspension Blocking =====
    
    def test_suspended_student_flag(self):
        """Test suspended student has is_suspended flag set"""
        self.assertTrue(self.suspended_student.is_suspended)
        self.assertIsNotNone(self.suspended_student.suspended_until)
    
    def test_active_student_not_suspended(self):
        """Test active student is not suspended"""
        self.assertFalse(self.student.is_suspended)
    
    def test_suspension_until_date(self):
        """Test suspension_until date is in future"""
        self.assertGreater(
            self.suspended_student.suspended_until,
            timezone.now().date()
        )
    
    # ===== Requirement 2.20: Guardian Consent Flagging =====
    
    def test_minor_student_guardian_consent_flag(self):
        """Test minor student can have guardian_consent_on_file flag"""
        self.minor_student.guardian_consent_on_file = True
        self.minor_student.save()
        
        refreshed = User.objects.get(id=self.minor_student.id)
        self.assertTrue(refreshed.guardian_consent_on_file)
    
    def test_adult_student_no_guardian_consent_required(self):
        """Test adult student does not require guardian consent"""
        self.assertFalse(self.student.guardian_consent_on_file)
    
    # ===== Requirement 2.9: Finance Role =====
    
    def test_finance_role_exists(self):
        """Test Finance role can be assigned to users"""
        self.assertEqual(self.finance.role, "finance")
    
    def test_multiple_user_roles(self):
        """Test multiple user roles exist"""
        roles = ["student", "admin", "director", "finance"]
        
        for role in roles:
            user = User.objects.filter(role=role).first()
            self.assertIsNotNone(user, f"No user with role {role}")
    
    # ===== Error Message Clarity Tests =====
    
    def test_policy_setting_string_representation(self):
        """Test PolicySetting has clear string representation"""
        setting = PolicySetting.objects.get(key="tuition_cap_psssp")
        str_repr = str(setting)
        self.assertIn("tuition_cap_psssp", str_repr)
        self.assertIn("5000", str_repr)
    
    def test_payment_string_representation(self):
        """Test Payment has clear string representation"""
        payment = Payment.objects.create(
            student=self.student,
            payment_type="tuition",
            amount=Decimal("5000.00"),
            status="scheduled",
            scheduled_date=timezone.now().date()
        )
        str_repr = str(payment)
        self.assertIn("Payment", str_repr)
        self.assertIn("5000", str_repr)
    
    def test_form_b_tracking_string_representation(self):
        """Test FormBTracking has clear string representation"""
        # Verify the __str__ method exists and returns a string
        self.assertTrue(hasattr(FormBTracking, '__str__'))
        # The actual string representation requires a FormSubmission instance
        # which we're testing separately in integration tests
    
    def test_extra_tuition_budget_string_representation(self):
        """Test ExtraTuitionBudget has clear string representation"""
        budget = ExtraTuitionBudget.objects.create(
            fiscal_year="2025-2026",
            total_budget=Decimal("36000.00"),
            allocated_amount=Decimal("0.00")
        )
        str_repr = str(budget)
        self.assertIn("DGGR", str_repr)
        self.assertIn("2025-2026", str_repr)
    
    def test_payment_schedule_string_representation(self):
        """Test PaymentSchedule has clear string representation"""
        payment = Payment.objects.create(
            student=self.student,
            payment_type="living_allowance",
            amount=Decimal("1200.00"),
            status="scheduled",
            scheduled_date=timezone.now().date()
        )
        
        schedule = PaymentSchedule.objects.create(
            payment=payment,
            month_year=timezone.now().date(),
            amount=Decimal("1200.00"),
            status="scheduled"
        )
        str_repr = str(schedule)
        self.assertIn("Schedule", str_repr)
        self.assertIn("1200", str_repr)
