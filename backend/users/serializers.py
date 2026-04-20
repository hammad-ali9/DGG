from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow either 'username' or 'email' as the identifying field
        # SimpleJWT defaults to 'username', but our frontend sends 'email'
        if 'email' in attrs and 'username' not in attrs:
            attrs['username'] = attrs['email']
        return super().validate(attrs)

# Import the full-featured UserSerializer from api app so /auth/me/ PATCH
# can read and write all profile fields (banking, enrollment, eligibility, etc.)
# The api.UserSerializer has the nested Profile update logic already implemented.
from api.serializers import UserSerializer  # noqa: F401 — re-exported for views

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        # 'role' is intentionally excluded — all self-registered users are students.
        # Staff/director accounts must be created via the Django admin.
        fields = ('email', 'full_name', 'password', 'phone', 'beneficiary_number', 'treaty_number', 'dob')

    def create(self, validated_data):
        # Force role to 'student' regardless of any payload manipulation
        validated_data['role'] = 'student'
        user = User.objects.create_user(**validated_data)
        return user
