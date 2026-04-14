from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils.translation import gettext_lazy as _

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
    is_sfa_active = models.BooleanField(default=False)
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

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
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
