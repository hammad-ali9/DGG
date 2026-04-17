from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
from .models import Profile, Application, Document, AuditLog, UserDocument

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('beneficiary_number', 'indian_status', 'phone_number', 'mailing_address', 'is_sfa_active', 'profile_completeness', 'preferred_name', 'date_of_birth', 'gender', 'pronouns', 'alt_phone_number')

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'profile')

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
