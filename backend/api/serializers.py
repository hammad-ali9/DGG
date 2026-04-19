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
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'phone', 'dob', 
            'beneficiary_number', 'preferred_name', 'mailing_address', 'town_city', 
            'postal_code', 'indian_status', 'is_sfa_active', 'gender', 'pronouns', 
            'alternate_phone', 'institute', 'institution_name', 'program_credential',
            'enrollment_status', 'num_dependents'
        )
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Update User fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update Profile fields
        if profile_data:
            profile, _ = Profile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
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
    class Meta:
        model = PolicySetting
        fields = (
            'id', 'key', 'setting_type', 'value', 'stream', 'status',
            'dependent_count', 'credential_type', 'description', 'is_active',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


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
