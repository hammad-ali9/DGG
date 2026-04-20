"""
Policy Compliance Services for DGG Student Portal

This module provides centralized business logic for funding calculations,
compliance validation, and policy enforcement across the portal.
"""

from decimal import Decimal, InvalidOperation
from django.utils import timezone
from datetime import datetime, timedelta, date
from django.db.models import Q

from .models import PolicySetting, ExtraTuitionBudget


class FundingCalculationService:
    """
    Service for automated funding calculations based on policy settings.
    
    Provides methods for calculating living allowances, tuition caps, graduation awards,
    overpayments, and DGGR budget management with fallback defaults for robustness.
    """

    @staticmethod
    def _get_decimal_value(policy_setting, default_val=Decimal('0.00')):
        """Helper to safely cast CharField value to Decimal."""
        if not policy_setting or not policy_setting.value:
            return default_val
        try:
            # Handle cases where value might have units or symbols if they were saved that way
            clean_val = str(policy_setting.value).replace('$', '').replace(',', '').strip()
            # If it's a range or date, this will fail, which is handled by the except block
            return Decimal(clean_val)
        except (ValueError, TypeError, InvalidOperation):
            return default_val

    @staticmethod
    def calculate_living_allowance(stream, enrollment_status, dependent_count=0):
        """
        Calculate living allowance based on stream, enrollment status, and dependent count.
        
        Reads from PolicySetting records with fallback to default amounts.
        
        Args:
            stream (str): Funding stream (PSSSP, UCEPP, DGGR, C-DFN)
            enrollment_status (str): FT (Full-Time) or PT (Part-Time)
            dependent_count (int): Number of dependents (0 or 1+)
        
        Returns:
            Decimal: Monthly living allowance amount
        """
        try:
            # Try exact match first with dependent count
            policy_setting = PolicySetting.objects.get(
                setting_type='living_allowance',
                stream=stream,
                status=enrollment_status,
                dependent_count=dependent_count if dependent_count > 0 else 0,
                is_active=True
            )
            return FundingCalculationService._get_decimal_value(policy_setting)
        except PolicySetting.DoesNotExist:
            pass
        
        # Fallback to base rate for stream/status without dependent specificity
        try:
            base_key = f'living_allowance_{stream.lower()}_{enrollment_status.lower()}'
            if dependent_count > 0:
                base_key += '_dependents'
            else:
                base_key += '_single'
            
            base_setting = PolicySetting.objects.get(
                key=base_key,
                is_active=True
            )
            return FundingCalculationService._get_decimal_value(base_setting)
        except PolicySetting.DoesNotExist:
            pass
        
        # Final fallback to hardcoded defaults
        defaults = {
            ('PSSSP', 'FT', 0): Decimal('1200.00'),
            ('PSSSP', 'FT', 1): Decimal('1800.00'),
            ('PSSSP', 'PT', 0): Decimal('800.00'),
            ('PSSSP', 'PT', 1): Decimal('1200.00'),
            ('UCEPP', 'FT', 0): Decimal('1000.00'),
            ('UCEPP', 'FT', 1): Decimal('1500.00'),
            ('UCEPP', 'PT', 0): Decimal('600.00'),
            ('UCEPP', 'PT', 1): Decimal('900.00'),
            ('DGGR', 'FT', 0): Decimal('1200.00'),
            ('DGGR', 'FT', 1): Decimal('1800.00'),
            ('DGGR', 'PT', 0): Decimal('800.00'),
            ('DGGR', 'PT', 1): Decimal('1200.00'),
            ('C-DFN', 'FT', 0): Decimal('1200.00'),
            ('C-DFN', 'FT', 1): Decimal('1800.00'),
            ('C-DFN', 'PT', 0): Decimal('800.00'),
            ('C-DFN', 'PT', 1): Decimal('1200.00'),
        }
        
        dep_key = 1 if dependent_count > 0 else 0
        return defaults.get((stream, enrollment_status, dep_key), Decimal('800.00'))

    @staticmethod
    def get_tuition_cap(stream, is_upgrading=False):
        """
        Get appropriate tuition cap based on stream and program type.
        
        UCEPP cap ($2,000) applies to upgrading programs regardless of declared stream.
        PSSSP cap ($5,000) applies to non-upgrading programs.
        
        Args:
            stream (str): Funding stream (PSSSP, UCEPP, DGGR, C-DFN)
            is_upgrading (bool): Whether the program is an upgrading program
        
        Returns:
            Decimal: Tuition cap amount
        """
        # Upgrading programs always use UCEPP cap
        if is_upgrading:
            stream = 'UCEPP'
        
        try:
            policy_setting = PolicySetting.objects.get(
                setting_type='tuition_cap',
                stream=stream,
                is_active=True
            )
            return FundingCalculationService._get_decimal_value(policy_setting)
        except PolicySetting.DoesNotExist:
            pass
        
        # Fallback defaults
        defaults = {
            'PSSSP': Decimal('5000.00'),
            'UCEPP': Decimal('2000.00'),
            'DGGR': Decimal('3000.00'),
            'C-DFN': Decimal('5000.00'),
        }
        return defaults.get(stream, Decimal('2000.00'))

    @staticmethod
    def calculate_graduation_award_amount(credential_type):
        """
        Calculate graduation award amount based on credential type.
        
        Maps all 12 credential types to their corresponding award amounts.
        
        Args:
            credential_type (str): Type of credential earned
        
        Returns:
            Decimal: Graduation award amount
        """
        try:
            policy_setting = PolicySetting.objects.get(
                setting_type='credential_amount',
                credential_type=credential_type,
                is_active=True
            )
            return FundingCalculationService._get_decimal_value(policy_setting)
        except PolicySetting.DoesNotExist:
            pass
        
        # Fallback credential amounts for all 12 types
        credential_amounts = {
            'High School Diploma': Decimal('500.00'),
            'Certificate': Decimal('1000.00'),
            'Trades Certificate of Qualification': Decimal('2000.00'),
            'Trades Journeyperson Licence': Decimal('3000.00'),
            'Diploma': Decimal('2000.00'),
            'Professional Pilot Licence': Decimal('3000.00'),
            'Red Seal': Decimal('3000.00'),
            'Bachelor\'s Degree': Decimal('3000.00'),
            'Master\'s Degree': Decimal('5000.00'),
            'Doctorate (PhD)': Decimal('5000.00'),
            'Juris Doctor / Bachelor of Laws': Decimal('5000.00'),
            'MD or DDS': Decimal('5000.00'),
        }
        
        return credential_amounts.get(credential_type, Decimal('500.00'))

    @staticmethod
    def calculate_overpayment(original_status, new_status, stream, months_remaining, dependent_count=0):
        """
        Calculate overpayment amount for status changes (FT→PT).
        
        When a student changes from full-time to part-time, the difference between
        FT and PT living allowance rates multiplied by remaining months is flagged
        for recovery.
        
        Args:
            original_status (str): Original enrollment status (FT or PT)
            new_status (str): New enrollment status (FT or PT)
            stream (str): Funding stream
            months_remaining (int): Number of months remaining in semester
            dependent_count (int): Number of dependents
        
        Returns:
            Decimal: Overpayment amount (0 if no overpayment)
        """
        if original_status == 'FT' and new_status == 'PT':
            ft_rate = FundingCalculationService.calculate_living_allowance(
                stream, 'FT', dependent_count
            )
            pt_rate = FundingCalculationService.calculate_living_allowance(
                stream, 'PT', dependent_count
            )
            monthly_difference = ft_rate - pt_rate
            return monthly_difference * Decimal(str(months_remaining))
        
        return Decimal('0.00')

    @staticmethod
    def validate_dggr_budget_availability(requested_amount, fiscal_year=None):
        """
        Validate DGGR extra tuition budget availability.
        
        Checks if the requested amount can be allocated within the current
        fiscal year's $36,000 cap.
        
        Args:
            requested_amount (Decimal): Amount requested for allocation
            fiscal_year (str, optional): Fiscal year (e.g., "2024-2025"). 
                                        Defaults to current fiscal year.
        
        Returns:
            tuple: (is_available: bool, remaining_amount: Decimal)
        """
        if not fiscal_year:
            fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        
        try:
            budget = ExtraTuitionBudget.objects.get(fiscal_year=fiscal_year)
        except ExtraTuitionBudget.DoesNotExist:
            # Create budget record if it doesn't exist
            budget = ExtraTuitionBudget.objects.create(
                fiscal_year=fiscal_year,
                total_budget=Decimal('36000.00'),
                allocated_amount=Decimal('0.00'),
                remaining_amount=Decimal('36000.00')
            )
        
        is_available = budget.remaining_amount >= requested_amount
        return is_available, budget.remaining_amount

    @staticmethod
    def allocate_dggr_budget(amount, fiscal_year=None):
        """
        Allocate DGGR budget and update tracking.
        
        Increments the allocated amount and allocation count for the fiscal year.
        
        Args:
            amount (Decimal): Amount to allocate
            fiscal_year (str, optional): Fiscal year. Defaults to current fiscal year.
        
        Returns:
            ExtraTuitionBudget: Updated budget record
        
        Raises:
            ExtraTuitionBudget.DoesNotExist: If budget record doesn't exist
        """
        if not fiscal_year:
            fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
        
        budget = ExtraTuitionBudget.objects.get(fiscal_year=fiscal_year)
        budget.allocated_amount += amount
        budget.allocation_count += 1
        budget.save()
        return budget


class ComplianceValidationService:
    """
    Service for policy compliance validation and enforcement.
    
    Provides methods for validating student eligibility, submission timing,
    semester deadlines, funding eligibility, and policy-specific requirements.
    All validation methods return (is_valid: bool, message: str) tuples.
    """

    # Semester deadlines (month, day)
    SEMESTER_DEADLINES = [
        (8, 1),    # Fall - August 1
        (12, 1),   # Winter - December 1
        (4, 1),    # Spring - April 1
        (6, 1),    # Summer - June 1
    ]

    # Credential types that qualify for Graduation Travel Bursary (2+ year programs)
    GTB_ELIGIBLE_CREDENTIALS = [
        'Diploma',
        'Bachelor\'s Degree',
        'Master\'s Degree',
        'Doctorate (PhD)',
        'Juris Doctor / Bachelor of Laws',
        'MD or DDS',
    ]

    @staticmethod
    def validate_submission_timing(form_type, submission_date, travel_date=None, completion_date=None):
        """
        Validate submission timing against policy deadlines.
        
        Enforces:
        - 30-day window for travel claims (FormG)
        - 6-month window for graduation/practicum awards (FormE/FormF)
        - No future travel dates for travel claims
        
        Args:
            form_type (str): Form type (FormE, FormF, FormG, etc.)
            submission_date (date): Date of submission
            travel_date (date, optional): Travel date for FormG
            completion_date (date, optional): Completion date for FormE/FormF
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        if form_type == 'FormG' and travel_date:  # Travel Claims
            # Check if travel date is in the future
            if travel_date > submission_date:
                return False, "Travel claims cannot be submitted for future travel dates."
            
            # Check 30-day window
            days_diff = (submission_date - travel_date).days
            if days_diff > 30:
                return False, "Travel claims must be submitted within 30 days of the travel date."
        
        if form_type in ['FormE', 'FormF'] and completion_date:  # Graduation/Practicum Awards
            # Check 6-month window (183 days)
            days_diff = (submission_date - completion_date).days
            if days_diff > 183:
                return False, "Graduation and practicum award claims must be submitted within 6 months of the completion date."
        
        return True, ""

    @staticmethod
    def validate_student_eligibility(student, form_type):
        """
        Validate student eligibility for form submission.
        
        Checks:
        - Student is not suspended
        - Student age for guardian consent requirements
        
        Args:
            student (CustomUser): Student user object
            form_type (str): Form type being submitted
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        # Check suspension status
        if student and student.is_suspended:
            # Check if suspension has expired
            if student.suspended_until and student.suspended_until > timezone.now().date():
                return False, "Your account is currently suspended. Please contact the DGG Education Department."
        
        return True, ""

    @staticmethod
    def validate_semester_deadline(submission_date):
        """
        Validate submission against semester deadlines.
        
        Checks if submission is before the applicable semester deadline.
        Deadlines: Aug 1 (Fall), Dec 1 (Winter), Apr 1 (Spring), Jun 1 (Summer)
        
        Academic year structure:
        - Jan 1 - Mar 31: Spring semester (deadline Apr 1)
        - Apr 1 - Jun 30: Summer semester (deadline Jun 1)
        - Jul 1 - Jul 31: Between semesters (late if after Jun 1, next deadline Aug 1)
        - Aug 1 - Nov 30: Fall semester (deadline Aug 1)
        - Dec 1 - Dec 31: Winter semester (deadline Dec 1)
        
        Args:
            submission_date (date): Date of submission
        
        Returns:
            tuple: (is_late: bool, next_deadline: date, message: str)
        """
        current_year = submission_date.year
        month = submission_date.month
        
        # Determine the applicable deadline and next deadline based on submission date
        if month in [1, 2, 3]:  # Jan - Mar: Spring semester
            applicable_deadline = date(current_year, 4, 1)
            next_deadline = applicable_deadline
        elif month in [4, 5, 6]:  # Apr - Jun: Summer semester
            applicable_deadline = date(current_year, 6, 1)
            next_deadline = applicable_deadline
        elif month == 7:  # Jul: Between semesters
            applicable_deadline = date(current_year, 6, 1)  # Check against Summer deadline
            next_deadline = date(current_year, 8, 1)  # Next deadline is Fall
        elif month in [8, 9, 10, 11]:  # Aug - Nov: Fall semester
            applicable_deadline = date(current_year, 8, 1)
            next_deadline = applicable_deadline
        else:  # Dec: Winter semester
            applicable_deadline = date(current_year, 12, 1)
            next_deadline = applicable_deadline
        
        # Check if submission is after the applicable deadline
        is_late = submission_date > applicable_deadline
        
        message = ""
        if is_late:
            message = f"This submission is past the semester deadline. A Director exception is required."
        
        return is_late, next_deadline, message

    @staticmethod
    def validate_duplicate_funding(eligibility_answers):
        """
        Validate duplicate funding eligibility.
        
        Checks Eligibility q8: "Are you currently receiving PSSSP or UCEPP funding 
        from another First Nation organisation?"
        
        Blocks C-DFN stream eligibility if student declares existing funding.
        
        Args:
            eligibility_answers (dict): Dictionary of eligibility question answers
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        # Check for Eligibility q8 answer
        q8_answer = eligibility_answers.get('Eligibility q8', '').lower()
        
        if q8_answer == 'yes':
            return False, "Students receiving PSSSP or UCEPP from another First Nation organisation are not eligible for the C-DFN stream."
        
        return True, ""

    @staticmethod
    def validate_sfa_denial_requirement(eligibility_answers, uploaded_files, bursary_stream=None):
        """
        Validate SFA denial letter requirement for C-DFN PSSSP.
        
        Requires SFA denial letter when:
        - Student answers "No" to SFA question (Eligibility q3)
        - Student is applying for PSSSP stream
        
        Args:
            eligibility_answers (dict): Dictionary of eligibility question answers
            uploaded_files (dict): Dictionary of uploaded files with field labels as keys
            bursary_stream (str, optional): Bursary stream (PSSSP, UCEPP, etc.)
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        # Check if student answered "No" to SFA question
        q3_answer = eligibility_answers.get('Eligibility q3', '').lower()
        
        # Only require SFA denial letter for PSSSP stream when SFA not applied for
        if q3_answer == 'no' and bursary_stream and 'PSSSP' in bursary_stream:
            # Check if SFA Denial Letter is uploaded
            if 'SFA Denial Letter' not in uploaded_files or not uploaded_files['SFA Denial Letter']:
                return False, "An SFA denial letter is required for C-DFN PSSSP applications where SFA has not been applied for."
        
        return True, ""

    @staticmethod
    def validate_travel_approval_timing(travel_date):
        """
        Validate travel approval timing.
        
        Prevents approval of travel claims where travel date is in the future.
        Travel must have already occurred before approval.
        
        Args:
            travel_date (date): Date of travel
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        today = timezone.now().date()
        
        if travel_date > today:
            return False, "Travel claims cannot be approved before the travel date has passed."
        
        return True, ""

    @staticmethod
    def validate_graduation_travel_bursary_eligibility(credential_type, program_duration=None):
        """
        Validate Graduation Travel Bursary eligibility.
        
        Requires:
        - Credential type from eligible list (2+ year programs)
        - Program duration of 2+ years (if provided)
        
        Args:
            credential_type (str): Type of credential earned
            program_duration (int, optional): Program duration in years
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        # Check credential type eligibility
        if credential_type not in ComplianceValidationService.GTB_ELIGIBLE_CREDENTIALS:
            return False, "Graduation Travel Bursary is only available for 2+ year program graduates."
        
        # Check program duration if provided
        if program_duration and program_duration < 2:
            return False, "Graduation Travel Bursary requires a program duration of 2 or more years."
        
        return True, ""

    @staticmethod
    def validate_guardian_consent_requirement(student_dob):
        """
        Validate guardian consent requirement for minors.
        
        Flags submissions from students under 18 years old.
        
        Args:
            student_dob (date): Student's date of birth
        
        Returns:
            tuple: (requires_consent: bool, message: str)
        """
        today = timezone.now().date()
        age = today.year - student_dob.year - ((today.month, today.day) < (student_dob.month, student_dob.day))
        
        if age < 18:
            return True, "Student is under 18. Guardian consent must be on file before sharing information."
        
        return False, ""



class DecisionLetterService:
    """
    Service for automated decision letter generation.
    
    Generates approval and rejection letters for form submissions using
    Django template system with customization for different form types.
    """

    # Form type to display name mapping
    FORM_TYPE_NAMES = {
        'FormA': 'New Student Application',
        'FormB': 'Enrollment Confirmation',
        'FormC': 'Continuing Student Application',
        'FormD': 'Change of Information',
        'FormE': 'Graduation Award',
        'FormF': 'Practicum Award',
        'FormG': 'Travel Claim',
        'FormH': 'Appeal',
        'FormGTB': 'Graduation Travel Bursary',
    }

    @staticmethod
    def generate_approval_letter(submission):
        """
        Generate an approval decision letter for a submission.
        
        Creates a formatted approval letter including:
        - Student name
        - Form title
        - Approved amount
        - Decision date
        - Standard approval message
        
        Args:
            submission (FormSubmission): The approved submission
        
        Returns:
            str: Formatted approval letter text
        
        Raises:
            ValueError: If submission is missing required data
        """
        if not submission.student:
            raise ValueError("Submission must have an associated student")
        
        try:
            if not submission.form:
                raise ValueError("Submission must have an associated form")
        except Exception:
            raise ValueError("Submission must have an associated form")
        
        # Get form type name
        form_type = submission.form.title
        form_display_name = DecisionLetterService.FORM_TYPE_NAMES.get(
            form_type, form_type
        )
        
        # Get student name
        student_name = submission.student.full_name or submission.student.email
        
        # Get decision date
        decision_date = submission.decided_at or timezone.now()
        formatted_date = decision_date.strftime('%B %d, %Y')
        
        # Format amount
        amount = submission.amount or Decimal('0.00')
        formatted_amount = f"${amount:,.2f}"
        
        # Build letter
        letter = f"""DECISION LETTER - APPROVAL

Date: {formatted_date}

Dear {student_name},

We are pleased to inform you that your application for {form_display_name} has been APPROVED.

Application Details:
- Form Type: {form_display_name}
- Approved Amount: {formatted_amount}
- Decision Date: {formatted_date}

Your approved funding will be processed according to the DGG Student Portal payment schedule. 
You will receive further communication regarding payment details and timing.

If you have any questions about this decision, please contact the DGG Education Department.

Sincerely,

DGG Student Support Services
Délı̨nę Got'ı̨nę Government
"""
        
        return letter.strip()

    @staticmethod
    def generate_rejection_letter(submission, rejection_reason=None):
        """
        Generate a rejection decision letter for a submission.
        
        Creates a formatted rejection letter including:
        - Student name
        - Form title
        - Rejection reason
        - Decision date
        - Appeal information
        
        Args:
            submission (FormSubmission): The rejected submission
            rejection_reason (str, optional): Reason for rejection. 
                                            Defaults to submission.decision_reason
        
        Returns:
            str: Formatted rejection letter text
        
        Raises:
            ValueError: If submission is missing required data
        """
        if not submission.student:
            raise ValueError("Submission must have an associated student")
        
        try:
            if not submission.form:
                raise ValueError("Submission must have an associated form")
        except Exception:
            raise ValueError("Submission must have an associated form")
        
        # Get form type name
        form_type = submission.form.title
        form_display_name = DecisionLetterService.FORM_TYPE_NAMES.get(
            form_type, form_type
        )
        
        # Get student name
        student_name = submission.student.full_name or submission.student.email
        
        # Get decision date
        decision_date = submission.decided_at or timezone.now()
        formatted_date = decision_date.strftime('%B %d, %Y')
        
        # Use provided reason or fall back to submission reason
        reason = rejection_reason or submission.decision_reason or "Your application does not meet the eligibility requirements."
        
        # Build letter
        letter = f"""DECISION LETTER - REJECTION

Date: {formatted_date}

Dear {student_name},

We regret to inform you that your application for {form_display_name} has been REJECTED.

Application Details:
- Form Type: {form_display_name}
- Decision Date: {formatted_date}

Reason for Rejection:
{reason}

Appeal Process:
If you believe this decision is incorrect or if you have additional information that should be considered, 
you have the right to appeal this decision. Please submit a Form H (Appeal) within 30 days of receiving 
this letter to initiate the appeal process.

For more information about the appeal process or if you have questions about this decision, 
please contact the DGG Education Department.

Sincerely,

DGG Student Support Services
Délı̨nę Got'ı̨nę Government
"""
        
        return letter.strip()

    @staticmethod
    def generate_letter_for_status_change(submission, new_status):
        """
        Generate appropriate decision letter based on status change.
        
        Automatically selects approval or rejection letter generation
        based on the new status.
        
        Args:
            submission (FormSubmission): The submission with status change
            new_status (str): The new status (accepted, rejected, etc.)
        
        Returns:
            str: Formatted decision letter text, or empty string if no letter needed
        
        Raises:
            ValueError: If submission is missing required data
        """
        if new_status == 'accepted':
            return DecisionLetterService.generate_approval_letter(submission)
        elif new_status == 'rejected':
            return DecisionLetterService.generate_rejection_letter(submission)
        else:
            # No letter needed for other statuses
            return ""

    @staticmethod
    def validate_letter_template(letter_text):
        """
        Validate that a generated letter contains required elements.
        
        Checks for:
        - Non-empty content
        - Student name or placeholder
        - Form type or placeholder
        - Decision date or placeholder
        - Appropriate decision language (APPROVAL or REJECTION)
        
        Args:
            letter_text (str): The letter text to validate
        
        Returns:
            tuple: (is_valid: bool, message: str)
        """
        if not letter_text or not letter_text.strip():
            return False, "Letter text is empty"
        
        # Check for required sections
        required_keywords = ['Date:', 'Dear', 'Form Type:', 'Decision Date:']
        missing_keywords = [kw for kw in required_keywords if kw not in letter_text]
        
        if missing_keywords:
            return False, f"Letter missing required elements: {', '.join(missing_keywords)}"
        
        # Check for decision type
        has_decision = 'APPROVAL' in letter_text or 'REJECTION' in letter_text
        if not has_decision:
            return False, "Letter must contain APPROVAL or REJECTION decision"
        
        return True, ""
