"""
Unit tests for FundingCalculationService

Tests all calculation scenarios including:
- Living allowance calculations for all streams and statuses
- Tuition cap routing for upgrading vs non-upgrading programs
- Graduation award amounts for all 12 credential types
- Overpayment calculations for status changes
- DGGR budget validation and allocation
"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import datetime

from .models import PolicySetting, ExtraTuitionBudget
from .services import FundingCalculationService


class FundingCalculationServiceTestCase(TestCase):
    """Test suite for FundingCalculationService"""

    def setUp(self):
        """Set up test data with PolicySetting records"""
        # Living Allowance Rates - PSSSP
        PolicySetting.objects.create(
            key='living_allowance_psssp_ft_single',
            setting_type='living_allowance',
            value=Decimal('1200.00'),
            stream='PSSSP',
            status='FT',
            dependent_count=0,
            is_active=True
        )
        PolicySetting.objects.create(
            key='living_allowance_psssp_ft_dependents',
            setting_type='living_allowance',
            value=Decimal('1800.00'),
            stream='PSSSP',
            status='FT',
            dependent_count=1,
            is_active=True
        )
        PolicySetting.objects.create(
            key='living_allowance_psssp_pt_single',
            setting_type='living_allowance',
            value=Decimal('800.00'),
            stream='PSSSP',
            status='PT',
            dependent_count=0,
            is_active=True
        )
        PolicySetting.objects.create(
            key='living_allowance_psssp_pt_dependents',
            setting_type='living_allowance',
            value=Decimal('1200.00'),
            stream='PSSSP',
            status='PT',
            dependent_count=1,
            is_active=True
        )

        # Living Allowance Rates - UCEPP
        PolicySetting.objects.create(
            key='living_allowance_ucepp_ft',
            setting_type='living_allowance',
            value=Decimal('1000.00'),
            stream='UCEPP',
            status='FT',
            is_active=True
        )
        PolicySetting.objects.create(
            key='living_allowance_ucepp_pt',
            setting_type='living_allowance',
            value=Decimal('600.00'),
            stream='UCEPP',
            status='PT',
            is_active=True
        )

        # Tuition Caps
        PolicySetting.objects.create(
            key='tuition_cap_psssp',
            setting_type='tuition_cap',
            value=Decimal('5000.00'),
            stream='PSSSP',
            is_active=True
        )
        PolicySetting.objects.create(
            key='tuition_cap_ucepp',
            setting_type='tuition_cap',
            value=Decimal('2000.00'),
            stream='UCEPP',
            is_active=True
        )

        # Credential Award Amounts - All 12 types
        credentials = [
            ('High School Diploma', Decimal('500.00')),
            ('Certificate', Decimal('1000.00')),
            ('Trades Certificate of Qualification', Decimal('2000.00')),
            ('Trades Journeyperson Licence', Decimal('3000.00')),
            ('Diploma', Decimal('2000.00')),
            ('Professional Pilot Licence', Decimal('3000.00')),
            ('Red Seal', Decimal('3000.00')),
            ('Bachelor\'s Degree', Decimal('3000.00')),
            ('Master\'s Degree', Decimal('5000.00')),
            ('Doctorate (PhD)', Decimal('5000.00')),
            ('Juris Doctor / Bachelor of Laws', Decimal('5000.00')),
            ('MD or DDS', Decimal('5000.00')),
        ]
        
        for cred_type, amount in credentials:
            PolicySetting.objects.create(
                key=f'credential_{cred_type.lower().replace(" ", "_").replace("/", "_")}',
                setting_type='credential_amount',
                value=amount,
                credential_type=cred_type,
                is_active=True
            )

    def test_calculate_living_allowance_psssp_ft_single(self):
        """Test PSSSP FT single living allowance calculation"""
        amount = FundingCalculationService.calculate_living_allowance(
            'PSSSP', 'FT', dependent_count=0
        )
        self.assertEqual(amount, Decimal('1200.00'))

    def test_calculate_living_allowance_psssp_ft_with_dependents(self):
        """Test PSSSP FT with dependents living allowance calculation"""
        amount = FundingCalculationService.calculate_living_allowance(
            'PSSSP', 'FT', dependent_count=1
        )
        self.assertEqual(amount, Decimal('1800.00'))

    def test_calculate_living_allowance_psssp_pt_single(self):
        """Test PSSSP PT single living allowance calculation"""
        amount = FundingCalculationService.calculate_living_allowance(
            'PSSSP', 'PT', dependent_count=0
        )
        self.assertEqual(amount, Decimal('800.00'))

    def test_calculate_living_allowance_psssp_pt_with_dependents(self):
        """Test PSSSP PT with dependents living allowance calculation"""
        amount = FundingCalculationService.calculate_living_allowance(
            'PSSSP', 'PT', dependent_count=1
        )
        self.assertEqual(amount, Decimal('1200.00'))

    def test_calculate_living_allowance_ucepp_ft(self):
        """Test UCEPP FT living allowance calculation"""
        amount = FundingCalculationService.calculate_living_allowance(
            'UCEPP', 'FT', dependent_count=0
        )
        self.assertEqual(amount, Decimal('1000.00'))

    def test_calculate_living_allowance_ucepp_pt(self):
        """Test UCEPP PT living allowance calculation"""
        amount = FundingCalculationService.calculate_living_allowance(
            'UCEPP', 'PT', dependent_count=0
        )
        self.assertEqual(amount, Decimal('600.00'))

    def test_calculate_living_allowance_fallback_to_defaults(self):
        """Test fallback to default amounts when PolicySetting not found"""
        # Delete all policy settings
        PolicySetting.objects.all().delete()
        
        # Should return default for PSSSP FT single
        amount = FundingCalculationService.calculate_living_allowance(
            'PSSSP', 'FT', dependent_count=0
        )
        self.assertEqual(amount, Decimal('1200.00'))

    def test_get_tuition_cap_psssp_non_upgrading(self):
        """Test PSSSP tuition cap for non-upgrading programs"""
        cap = FundingCalculationService.get_tuition_cap('PSSSP', is_upgrading=False)
        self.assertEqual(cap, Decimal('5000.00'))

    def test_get_tuition_cap_ucepp_non_upgrading(self):
        """Test UCEPP tuition cap for non-upgrading programs"""
        cap = FundingCalculationService.get_tuition_cap('UCEPP', is_upgrading=False)
        self.assertEqual(cap, Decimal('2000.00'))

    def test_get_tuition_cap_upgrading_program_override(self):
        """Test that upgrading programs always get UCEPP cap"""
        # Even if stream is PSSSP, upgrading programs should get UCEPP cap
        cap = FundingCalculationService.get_tuition_cap('PSSSP', is_upgrading=True)
        self.assertEqual(cap, Decimal('2000.00'))

    def test_get_tuition_cap_fallback_to_defaults(self):
        """Test fallback to default tuition caps"""
        PolicySetting.objects.all().delete()
        
        cap = FundingCalculationService.get_tuition_cap('PSSSP', is_upgrading=False)
        self.assertEqual(cap, Decimal('5000.00'))

    def test_calculate_graduation_award_high_school_diploma(self):
        """Test graduation award for High School Diploma"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'High School Diploma'
        )
        self.assertEqual(amount, Decimal('500.00'))

    def test_calculate_graduation_award_certificate(self):
        """Test graduation award for Certificate"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Certificate'
        )
        self.assertEqual(amount, Decimal('1000.00'))

    def test_calculate_graduation_award_trades_certificate(self):
        """Test graduation award for Trades Certificate of Qualification"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Trades Certificate of Qualification'
        )
        self.assertEqual(amount, Decimal('2000.00'))

    def test_calculate_graduation_award_trades_journeyperson(self):
        """Test graduation award for Trades Journeyperson Licence"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Trades Journeyperson Licence'
        )
        self.assertEqual(amount, Decimal('3000.00'))

    def test_calculate_graduation_award_diploma(self):
        """Test graduation award for Diploma"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Diploma'
        )
        self.assertEqual(amount, Decimal('2000.00'))

    def test_calculate_graduation_award_pilot_licence(self):
        """Test graduation award for Professional Pilot Licence"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Professional Pilot Licence'
        )
        self.assertEqual(amount, Decimal('3000.00'))

    def test_calculate_graduation_award_red_seal(self):
        """Test graduation award for Red Seal"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Red Seal'
        )
        self.assertEqual(amount, Decimal('3000.00'))

    def test_calculate_graduation_award_bachelor(self):
        """Test graduation award for Bachelor's Degree"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Bachelor\'s Degree'
        )
        self.assertEqual(amount, Decimal('3000.00'))

    def test_calculate_graduation_award_master(self):
        """Test graduation award for Master's Degree"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Master\'s Degree'
        )
        self.assertEqual(amount, Decimal('5000.00'))

    def test_calculate_graduation_award_doctorate(self):
        """Test graduation award for Doctorate (PhD)"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Doctorate (PhD)'
        )
        self.assertEqual(amount, Decimal('5000.00'))

    def test_calculate_graduation_award_juris_doctor(self):
        """Test graduation award for Juris Doctor / Bachelor of Laws"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Juris Doctor / Bachelor of Laws'
        )
        self.assertEqual(amount, Decimal('5000.00'))

    def test_calculate_graduation_award_medical(self):
        """Test graduation award for MD or DDS"""
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'MD or DDS'
        )
        self.assertEqual(amount, Decimal('5000.00'))

    def test_calculate_graduation_award_fallback_to_defaults(self):
        """Test fallback to default credential amounts"""
        PolicySetting.objects.all().delete()
        
        amount = FundingCalculationService.calculate_graduation_award_amount(
            'Bachelor\'s Degree'
        )
        self.assertEqual(amount, Decimal('3000.00'))

    def test_calculate_overpayment_ft_to_pt_psssp(self):
        """Test overpayment calculation for FT→PT status change (PSSSP)"""
        # PSSSP FT single: $1200, PT single: $800
        # 4 months remaining: ($1200 - $800) * 4 = $1600
        overpayment = FundingCalculationService.calculate_overpayment(
            'FT', 'PT', 'PSSSP', 4, dependent_count=0
        )
        self.assertEqual(overpayment, Decimal('1600.00'))

    def test_calculate_overpayment_ft_to_pt_with_dependents(self):
        """Test overpayment calculation for FT→PT with dependents"""
        # PSSSP FT with dependents: $1800, PT with dependents: $1200
        # 3 months remaining: ($1800 - $1200) * 3 = $1800
        overpayment = FundingCalculationService.calculate_overpayment(
            'FT', 'PT', 'PSSSP', 3, dependent_count=1
        )
        self.assertEqual(overpayment, Decimal('1800.00'))

    def test_calculate_overpayment_pt_to_ft_no_overpayment(self):
        """Test that PT→FT status change produces no overpayment"""
        overpayment = FundingCalculationService.calculate_overpayment(
            'PT', 'FT', 'PSSSP', 4, dependent_count=0
        )
        self.assertEqual(overpayment, Decimal('0.00'))

    def test_calculate_overpayment_ft_to_ft_no_overpayment(self):
        """Test that FT→FT status change produces no overpayment"""
        overpayment = FundingCalculationService.calculate_overpayment(
            'FT', 'FT', 'PSSSP', 4, dependent_count=0
        )
        self.assertEqual(overpayment, Decimal('0.00'))

    def test_calculate_overpayment_ucepp(self):
        """Test overpayment calculation for UCEPP stream"""
        # UCEPP FT: $1000, PT: $600
        # 2 months remaining: ($1000 - $600) * 2 = $800
        overpayment = FundingCalculationService.calculate_overpayment(
            'FT', 'PT', 'UCEPP', 2, dependent_count=0
        )
        self.assertEqual(overpayment, Decimal('800.00'))

    def test_validate_dggr_budget_availability_sufficient(self):
        """Test DGGR budget validation with sufficient funds"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('10000.00'),
            remaining_amount=Decimal('26000.00')
        )
        
        is_available, remaining = FundingCalculationService.validate_dggr_budget_availability(
            Decimal('5000.00'), fiscal_year
        )
        self.assertTrue(is_available)
        self.assertEqual(remaining, Decimal('26000.00'))

    def test_validate_dggr_budget_availability_insufficient(self):
        """Test DGGR budget validation with insufficient funds"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('33000.00'),
            remaining_amount=Decimal('3000.00')
        )
        
        is_available, remaining = FundingCalculationService.validate_dggr_budget_availability(
            Decimal('5000.00'), fiscal_year
        )
        self.assertFalse(is_available)
        self.assertEqual(remaining, Decimal('3000.00'))

    def test_validate_dggr_budget_availability_exact_match(self):
        """Test DGGR budget validation with exact remaining amount"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('31000.00'),
            remaining_amount=Decimal('5000.00')
        )
        
        is_available, remaining = FundingCalculationService.validate_dggr_budget_availability(
            Decimal('5000.00'), fiscal_year
        )
        self.assertTrue(is_available)
        self.assertEqual(remaining, Decimal('5000.00'))

    def test_validate_dggr_budget_creates_record_if_missing(self):
        """Test that budget record is created if it doesn't exist"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        # Ensure no budget record exists
        ExtraTuitionBudget.objects.filter(fiscal_year=fiscal_year).delete()
        
        is_available, remaining = FundingCalculationService.validate_dggr_budget_availability(
            Decimal('5000.00'), fiscal_year
        )
        
        self.assertTrue(is_available)
        self.assertEqual(remaining, Decimal('36000.00'))
        
        # Verify record was created
        budget = ExtraTuitionBudget.objects.get(fiscal_year=fiscal_year)
        self.assertEqual(budget.total_budget, Decimal('36000.00'))
        self.assertEqual(budget.allocated_amount, Decimal('0.00'))

    def test_allocate_dggr_budget_increments_allocation(self):
        """Test DGGR budget allocation increments allocated amount"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        budget = ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('10000.00'),
            allocation_count=2
        )
        
        updated_budget = FundingCalculationService.allocate_dggr_budget(
            Decimal('5000.00'), fiscal_year
        )
        
        self.assertEqual(updated_budget.allocated_amount, Decimal('15000.00'))
        self.assertEqual(updated_budget.allocation_count, 3)
        self.assertEqual(updated_budget.remaining_amount, Decimal('21000.00'))

    def test_allocate_dggr_budget_multiple_allocations(self):
        """Test multiple DGGR budget allocations"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        budget = ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('0.00'),
            allocation_count=0
        )
        
        # First allocation
        FundingCalculationService.allocate_dggr_budget(Decimal('10000.00'), fiscal_year)
        budget.refresh_from_db()
        self.assertEqual(budget.allocated_amount, Decimal('10000.00'))
        self.assertEqual(budget.allocation_count, 1)
        
        # Second allocation
        FundingCalculationService.allocate_dggr_budget(Decimal('8000.00'), fiscal_year)
        budget.refresh_from_db()
        self.assertEqual(budget.allocated_amount, Decimal('18000.00'))
        self.assertEqual(budget.allocation_count, 2)
        
        # Third allocation
        FundingCalculationService.allocate_dggr_budget(Decimal('12000.00'), fiscal_year)
        budget.refresh_from_db()
        self.assertEqual(budget.allocated_amount, Decimal('30000.00'))
        self.assertEqual(budget.allocation_count, 3)
        self.assertEqual(budget.remaining_amount, Decimal('6000.00'))

    def test_allocate_dggr_budget_uses_current_fiscal_year_by_default(self):
        """Test that allocate_dggr_budget uses current fiscal year by default"""
        fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        budget = ExtraTuitionBudget.objects.create(
            fiscal_year=fiscal_year,
            total_budget=Decimal('36000.00'),
            allocated_amount=Decimal('0.00'),
            allocation_count=0
        )
        
        # Call without fiscal_year parameter
        updated_budget = FundingCalculationService.allocate_dggr_budget(Decimal('5000.00'))
        
        self.assertEqual(updated_budget.fiscal_year, fiscal_year)
        self.assertEqual(updated_budget.allocated_amount, Decimal('5000.00'))
