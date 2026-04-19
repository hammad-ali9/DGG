from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
User = get_user_model()
from django.utils.translation import gettext_lazy as _

class PolicySetting(models.Model):
    """Centralized policy configuration for DGG Student Portal"""
    
    SETTING_TYPES = [
        ('tuition_cap', 'Tuition Cap'),
        ('living_allowance', 'Living Allowance'),
        ('credential_amount', 'Credential Amount'),
        ('deadline', 'Deadline'),
        ('budget_cap', 'Budget Cap'),
    ]
    
    STREAM_CHOICES = [
        ('PSSSP', 'Post-Secondary Student Support Program'),
        ('UCEPP', 'Upgrading and Community Education Partnership Program'),
        ('DGGR', 'Délı̨nę Got\'ı̨nę Government Resources'),
        ('C-DFN', 'Délı̨nę First Nation PSSSP'),
    ]
    
    STATUS_CHOICES = [
        ('FT', 'Full-Time'),
        ('PT', 'Part-Time'),
    ]
    
    key = models.CharField(max_length=100, unique=True, help_text="Unique identifier for this policy setting")
    setting_type = models.CharField(max_length=20, choices=SETTING_TYPES, help_text="Type of policy setting")
    value = models.DecimalField(max_digits=12, decimal_places=2, help_text="Numeric value for this setting")
    stream = models.CharField(max_length=10, choices=STREAM_CHOICES, blank=True, null=True, help_text="Funding stream (if applicable)")
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, blank=True, null=True, help_text="Enrollment status (FT/PT, if applicable)")
    dependent_count = models.IntegerField(blank=True, null=True, help_text="Number of dependents (if applicable)")
    credential_type = models.CharField(max_length=100, blank=True, null=True, help_text="Credential type for graduation awards")
    description = models.TextField(blank=True, help_text="Description of this policy setting")
    is_active = models.BooleanField(default=True, help_text="Whether this setting is currently active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_policysetting'
        verbose_name = 'Policy Setting'
        verbose_name_plural = 'Policy Settings'
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: ${self.value}"


class Payment(models.Model):
    """Payment records for approved form submissions with Finance workflow integration"""
    
    PAYMENT_TYPES = [
        ('tuition', 'Tuition Payment'),
        ('living_allowance', 'Living Allowance'),
        ('graduation_award', 'Graduation Award'),
        ('travel_claim', 'Travel Claim'),
        ('practicum_award', 'Practicum Award'),
        ('graduation_travel_bursary', 'Graduation Travel Bursary'),
    ]
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    submission = models.ForeignKey('forms.FormSubmission', on_delete=models.CASCADE, related_name='payments', help_text="Link to the approved form submission")
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments', help_text="Student receiving the payment")
    payment_type = models.CharField(max_length=30, choices=PAYMENT_TYPES, help_text="Type of payment being disbursed")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Payment amount in CAD")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', help_text="Current payment status")
    scheduled_date = models.DateField(help_text="Date payment is scheduled for")
    processed_date = models.DateField(blank=True, null=True, help_text="Date payment was actually processed")
    reference_number = models.CharField(max_length=50, unique=True, help_text="Unique payment reference number (PAY-YYYY-XXXXXX)")
    finance_notes = models.TextField(blank=True, null=True, help_text="Internal notes for Finance staff")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_payment'
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
    
    def save(self, *args, **kwargs):
        """Auto-generate reference number if not provided"""
        if not self.reference_number:
            year = timezone.now().year
            self.reference_number = f"PAY-{year}-{self.submission.id:06d}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Payment {self.reference_number}: ${self.amount} ({self.status})"


class FormBTracking(models.Model):
    """Enrollment confirmation tracking for Form A submissions with registrar communication"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent to Registrar'),
        ('submitted', 'Form B Submitted'),
        ('verified', 'Enrollment Verified'),
        ('overdue', 'Overdue'),
        ('expired', 'Expired'),
    ]
    
    form_a_submission = models.OneToOneField('forms.FormSubmission', on_delete=models.CASCADE, related_name='form_b_tracking', help_text="Link to the Form A submission")
    registrar_email = models.EmailField(help_text="Email address of the institution registrar")
    institution_name = models.CharField(max_length=200, help_text="Name of the educational institution")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', help_text="Current status of Form B tracking")
    sent_date = models.DateTimeField(blank=True, null=True, help_text="Date Form B was sent to registrar")
    due_date = models.DateField(help_text="Date Form B response is due (30 days from submission)")
    submitted_date = models.DateField(blank=True, null=True, help_text="Date Form B was submitted by registrar")
    verification_date = models.DateField(blank=True, null=True, help_text="Date enrollment was verified")
    notes = models.TextField(blank=True, null=True, help_text="Internal notes about Form B status")
    reminder_count = models.IntegerField(default=0, help_text="Number of reminders sent to registrar")
    last_reminder_sent = models.DateTimeField(blank=True, null=True, help_text="Date of last reminder sent to registrar")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_formbtracking'
        verbose_name = 'Form B Tracking'
        verbose_name_plural = 'Form B Tracking Records'
        ordering = ['-created_at']
    
    def is_overdue(self):
        """Check if Form B response is overdue"""
        if self.status in ['pending', 'sent']:
            return self.due_date < timezone.now().date()
        return False
    
    def __str__(self):
        return f"Form B for {self.form_a_submission.student.get_full_name() if hasattr(self.form_a_submission, 'student') else 'Unknown'} - {self.status}"


class ExtraTuitionBudget(models.Model):
    """DGGR extra tuition fiscal year budget tracking with $36,000 annual cap enforcement"""
    
    fiscal_year = models.CharField(max_length=10, unique=True, help_text="Fiscal year in format YYYY-YYYY (e.g., 2024-2025)")
    total_budget = models.DecimalField(max_digits=12, decimal_places=2, default=36000.00, help_text="Total annual budget cap for DGGR extra tuition")
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Amount already allocated to students")
    remaining_amount = models.DecimalField(max_digits=12, decimal_places=2, default=36000.00, help_text="Remaining budget available for allocation")
    allocation_count = models.IntegerField(default=0, help_text="Number of students funded in this fiscal year")
    notes = models.TextField(blank=True, null=True, help_text="Internal notes about budget status or allocations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_extratuitionbudget'
        ordering = ['-fiscal_year']
        verbose_name = 'Extra Tuition Budget'
        verbose_name_plural = 'Extra Tuition Budgets'
    
    def save(self, *args, **kwargs):
        """Automatically calculate remaining_amount on save"""
        self.remaining_amount = self.total_budget - self.allocated_amount
        super().save(*args, **kwargs)
    
    @classmethod
    def get_current_fiscal_year(cls):
        """Get current fiscal year in YYYY-YYYY format (April 1 - March 31 cycle)"""
        now = timezone.now().date()
        if now.month >= 4:  # April 1 - December 31
            return f"{now.year}-{now.year + 1}"
        else:  # January 1 - March 31
            return f"{now.year - 1}-{now.year}"
    
    def __str__(self):
        return f"DGGR Budget {self.fiscal_year}: ${self.remaining_amount} remaining of ${self.total_budget}"


class PaymentSchedule(models.Model):
    """Monthly disbursement schedule for living allowance payments with Finance workflow integration"""
    
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='schedule_entries', help_text="Link to the parent Payment record")
    month_year = models.DateField(help_text="First day of the disbursement month (YYYY-MM-01)")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Monthly disbursement amount in CAD")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', help_text="Current status of this monthly disbursement")
    processed_date = models.DateField(blank=True, null=True, help_text="Date this monthly payment was actually processed")
    finance_reference = models.CharField(max_length=50, blank=True, null=True, help_text="Finance system reference number for this disbursement")
    notes = models.TextField(blank=True, null=True, help_text="Internal notes about this monthly disbursement")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_paymentschedule'
        ordering = ['month_year']
        unique_together = ['payment', 'month_year']
        verbose_name = 'Payment Schedule'
        verbose_name_plural = 'Payment Schedules'
    
    def __str__(self):
        return f"Schedule {self.payment.reference_number} - {self.month_year.strftime('%B %Y')}: ${self.amount}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    beneficiary_number = models.CharField(max_length=50, blank=True, null=True)
    indian_status = models.CharField(max_length=50, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    mailing_address = models.TextField(blank=True, null=True)
    preferred_name = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=50, blank=True, null=True)
    pronouns = models.CharField(max_length=50, blank=True, null=True)
    alt_phone_number = models.CharField(max_length=20, blank=True, null=True)
    town_city = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    is_sfa_active = models.BooleanField(default=False)
    institute_name = models.CharField(max_length=255, blank=True, null=True)
    program_credential = models.CharField(max_length=255, blank=True, null=True)
    enrollment_status = models.CharField(max_length=50, blank=True, null=True)
    num_dependents = models.IntegerField(default=0)
    profile_completeness = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class Application(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', _('New')
        REVIEW = 'review', _('Review')
        PENDING = 'pending', _('Pending Director')
        APPROVED = 'approved', _('Approved')
        DENIED = 'denied', _('Denied')
        WAITING_B = 'waitingb', _('Waiting Form B')

    class Semester(models.TextChoices):
        FALL = 'fall', _('Fall')
        WINTER = 'winter', _('Winter')
        SPRING = 'spring', _('Spring')
        SUMMER = 'summer', _('Summer')

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications', null=True, blank=True)
    form_type = models.CharField(max_length=50) # 'FormA', 'FormC', etc.
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    semester = models.CharField(max_length=20, blank=True, null=True)
    academic_year = models.CharField(max_length=20, blank=True, null=True)
    institution = models.CharField(max_length=255, blank=True, null=True)
    program = models.CharField(max_length=255, blank=True, null=True)
    
    # Flexible field for form-specific data
    form_data = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Tracking fields
    ssw_submitted_at = models.DateTimeField(blank=True, null=True)
    decision_by = models.CharField(max_length=100, blank=True, null=True)
    decision_at = models.DateTimeField(blank=True, null=True)
    decision_notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.form_type} - {self.student.get_full_name() or self.student.username} ({self.created_at.strftime('%Y-%m-%d')})"

class Document(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='application_docs/')
    is_verified = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} for {self.application.id}"

class UserDocument(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_documents')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='user_documents/')
    category = models.CharField(max_length=100, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.user.email}"

class AuditLog(models.Model):
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    application = models.ForeignKey(Application, on_delete=models.SET_NULL, null=True, blank=True)
    details = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']
