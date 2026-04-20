from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from .models import (
    Profile, Application, Document, AuditLog, UserDocument,
    PolicySetting, Payment, FormBTracking, PaymentSchedule, ExtraTuitionBudget
)

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('beneficiary_number', 'indian_status', 'phone_number', 'mailing_address', 'is_sfa_active', 'profile_completeness', 'preferred_name', 'date_of_birth', 'gender', 'pronouns', 'alt_phone_number')

class UserSerializer(serializers.ModelSerializer):
    # Core identity fields made optional for partial updates
    full_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    
    # Flatten profile fields onto the user object for easier frontend consumption
    preferred_name = serializers.CharField(source='profile.preferred_name', required=False, allow_blank=True)
    mailing_address = serializers.CharField(source='profile.mailing_address', required=False, allow_blank=True)
    town_city = serializers.CharField(source='profile.town_city', required=False, allow_blank=True)
    postal_code = serializers.CharField(source='profile.postal_code', required=False, allow_blank=True)
    indian_status = serializers.CharField(source='profile.indian_status', required=False, allow_blank=True)
    is_sfa_active = serializers.BooleanField(source='profile.is_sfa_active', required=False)
    gender = serializers.CharField(source='profile.gender', required=False, allow_blank=True)
    pronouns = serializers.CharField(source='profile.pronouns', required=False, allow_blank=True)
    alternate_phone = serializers.CharField(source='profile.alt_phone_number', required=False, allow_blank=True)
    enrollment_status = serializers.CharField(source='profile.enrollment_status', required=False, allow_blank=True)
    num_dependents = serializers.IntegerField(source='profile.num_dependents', required=False)
    
    # Career/Enrollment fields
    institute = serializers.CharField(source='profile.institute_name', required=False, allow_blank=True) # Map institute to profile.institute_name
    institution_name = serializers.CharField(source='profile.institute_name', required=False, allow_blank=True)
    program_credential = serializers.CharField(source='profile.program_credential', required=False, allow_blank=True)

    # Banking Details
    bank_name = serializers.CharField(source='profile.bank_name', required=False, allow_blank=True)
    account_holder_name = serializers.CharField(source='profile.account_holder_name', required=False, allow_blank=True)
    transit_number = serializers.CharField(source='profile.transit_number', required=False, allow_blank=True)
    inst_number = serializers.CharField(source='profile.inst_number', required=False, allow_blank=True)
    account_number = serializers.CharField(source='profile.account_number', required=False, allow_blank=True)
    
    # Eligibility & Identifiers
    upi = serializers.CharField(source='profile.upi', required=False, allow_blank=True)
    financial_assistance_status = serializers.CharField(source='profile.financial_assistance_status', required=False, allow_blank=True)
    treaty_number = serializers.CharField(source='profile.treaty_number', required=False, allow_blank=True)
    beneficiary_number = serializers.CharField(source='profile.beneficiary_number', required=False, allow_blank=True)
    primary_stream = serializers.CharField(source='profile.primary_stream', required=False, allow_blank=True)
    dob = serializers.DateField(source='profile.date_of_birth', required=False, allow_null=True)
    phone = serializers.CharField(source='profile.phone_number', required=False, allow_blank=True)
    
    # Additional Enrollment info
    current_semester = serializers.CharField(source='profile.current_semester', required=False, allow_blank=True)
    course_load = serializers.IntegerField(source='profile.course_load', required=False)
    expected_graduation_date = serializers.DateField(source='profile.expected_graduation_date', required=False, allow_null=True)
    program_type = serializers.CharField(source='profile.program_type', required=False, allow_blank=True)
    years_in_program = serializers.CharField(source='profile.years_in_program', required=False, allow_blank=True)
    institution_location = serializers.CharField(source='profile.institution_location', required=False, allow_blank=True)
    
    # Dependent/Special info
    dependent_ages = serializers.CharField(source='profile.dependent_ages', required=False, allow_blank=True)
    disability_accommodation = serializers.CharField(source='profile.disability_accommodation', required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'full_name', 'email', 'phone', 'dob', 
            'beneficiary_number', 'preferred_name', 'mailing_address', 'town_city', 
            'postal_code', 'indian_status', 'is_sfa_active', 'gender', 'pronouns', 
            'alternate_phone', 'institute', 'institution_name', 'program_credential',
            'enrollment_status', 'num_dependents', 'bank_name', 'account_holder_name',
            'transit_number', 'inst_number', 'account_number', 'upi', 
            'financial_assistance_status', 'treaty_number', 'current_semester',
            'course_load', 'expected_graduation_date', 'program_type',
            'years_in_program', 'institution_location', 'dependent_ages',
            'disability_accommodation', 'primary_stream'
        )
        # id and email must not be writable — email uniqueness check would fail
        # on PATCH since the same email already exists on this user record
        read_only_fields = ('id', 'email')
    
    def update(self, instance, validated_data):
        # DRF automatically nests fields with 'source=profile.attr' into a 'profile' dict
        profile_data = validated_data.pop('profile', {})

        # Update User-level fields (full_name, phone, beneficiary_number, treaty_number, dob)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Always upsert Profile — even if profile_data is empty, ensure the row exists
        profile, _ = Profile.objects.get_or_create(user=instance)
        if profile_data:
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        # Re-assign to clear DRF's cached reverse relation so serializer.data
        # returns the freshly saved values instead of the stale cached object.
        instance.profile = profile

        return instance


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = '__all__'

class UserDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDocument
        fields = ('id', 'user', 'name', 'file', 'category', 'uploaded_at')
        read_only_fields = ('id', 'user', 'uploaded_at')

class ApplicationSerializer(serializers.ModelSerializer):
    student_details = UserSerializer(source='student', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Application
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_details = UserSerializer(source='performed_by', read_only=True)
    class Meta:
        model = AuditLog
        fields = '__all__'


# ===== NEW POLICY SERIALIZERS =====

class PolicySettingSerializer(serializers.ModelSerializer):
    """Serializer for PolicySetting model"""
    last_updated_by_name = serializers.CharField(source='last_updated_by.full_name', read_only=True)
    last_updated_at = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = PolicySetting
        fields = (
            'id', 'key', 'category', 'field_label', 'field_key', 'unit',
            'setting_type', 'value', 'stream', 'status',
            'dependent_count', 'credential_type', 'description', 'is_active',
            'last_updated_by_name', 'last_updated_at'
        )
        read_only_fields = ('id', 'last_updated_at')


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    submission_form_title = serializers.CharField(source='submission.form.title', read_only=True)
    
    class Meta:
        model = Payment
        fields = (
            'id', 'submission', 'student', 'student_name', 'payment_type',
            'amount', 'status', 'scheduled_date', 'processed_date',
            'reference_number', 'finance_notes', 'submission_form_title',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'reference_number', 'created_at', 'updated_at')


class FormBTrackingSerializer(serializers.ModelSerializer):
    """Serializer for FormBTracking model"""
    student_name = serializers.CharField(source='form_a_submission.student.full_name', read_only=True)
    submission_id = serializers.IntegerField(source='form_a_submission.id', read_only=True)
    
    class Meta:
        model = FormBTracking
        fields = (
            'id', 'form_a_submission', 'submission_id', 'student_name',
            'registrar_email', 'institution_name', 'status', 'sent_date',
            'due_date', 'submitted_date', 'verification_date', 'notes',
            'reminder_count', 'last_reminder_sent', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PaymentScheduleSerializer(serializers.ModelSerializer):
    """Serializer for PaymentSchedule model"""
    payment_reference = serializers.CharField(source='payment.reference_number', read_only=True)
    student_name = serializers.CharField(source='payment.student.full_name', read_only=True)
    
    class Meta:
        model = PaymentSchedule
        fields = (
            'id', 'payment', 'payment_reference', 'student_name', 'month_year',
            'amount', 'status', 'processed_date', 'finance_reference', 'notes',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ExtraTuitionBudgetSerializer(serializers.ModelSerializer):
    """Serializer for ExtraTuitionBudget model"""
    utilization_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = ExtraTuitionBudget
        fields = (
            'id', 'fiscal_year', 'total_budget', 'allocated_amount',
            'remaining_amount', 'allocation_count', 'utilization_percentage',
            'notes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'remaining_amount', 'created_at', 'updated_at')
    
    def get_utilization_percentage(self, obj):
        if obj.total_budget > 0:
            return round((obj.allocated_amount / obj.total_budget) * 100, 2)
        return 0.0
