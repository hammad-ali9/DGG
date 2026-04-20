from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta
User = get_user_model()
from .models import (
    Profile, Application, Document, AuditLog, UserDocument,
    PolicySetting, Payment, FormBTracking, PaymentSchedule, ExtraTuitionBudget
)
from .serializers import (
    UserSerializer, ProfileSerializer, ApplicationSerializer, 
    DocumentSerializer, AuditLogSerializer, UserDocumentSerializer,
    PolicySettingSerializer, PaymentSerializer, FormBTrackingSerializer,
    PaymentScheduleSerializer
)
from .services import FundingCalculationService, ComplianceValidationService, DecisionLetterService
from core.utils import api_response

class RegisterView(viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer

    def create(self, request):
        user = User.objects.create_user(
            username=request.data.get('email'),
            email=request.data.get('email'),
            password=request.data.get('password'),
            first_name=request.data.get('firstName', ''),
            last_name=request.data.get('lastName', '')
        )
        Profile.objects.create(
            user=user,
            beneficiary_number=request.data.get('beneficiaryNo', ''),
            indian_status=request.data.get('treatyNum', ''),
            phone_number=request.data.get('phone', ''),
            date_of_birth=request.data.get('dob')
        )
        return Response({'status': 'user created'}, status=status.HTTP_201_CREATED)

class UserDetailView(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        
        # Update logic
        serializer = UserSerializer(request.user, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Staff/Director can see more, students only see their own
        if user.is_staff:
            return self.queryset.all()
        return self.queryset.filter(student=user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        application = self.get_object()
        application.status = Application.Status.APPROVED
        application.decision_by = request.user.username
        application.decision_notes = request.data.get('notes', '')
        application.save()
        
        AuditLog.objects.create(
            action=f"Approved Application {application.id}",
            performed_by=request.user,
            application=application,
            details=application.decision_notes
        )
        return Response({'status': 'application approved'})

    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        application = self.get_object()
        application.status = Application.Status.DENIED
        application.decision_by = request.user.username
        application.decision_notes = request.data.get('notes', '')
        application.save()
        
        AuditLog.objects.create(
            action=f"Denied Application {application.id}",
            performed_by=request.user,
            application=application,
            details=application.decision_notes
        )
        return Response({'status': 'application denied'})

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.queryset.all()
        return self.queryset.filter(application__student=self.request.user)

class UserDocumentViewSet(viewsets.ModelViewSet):
    queryset = UserDocument.objects.all()
    serializer_class = UserDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAdminUser]


# ===== NEW POLICY API ENDPOINTS (Requirement 2.2, 2.5, 2.8, 2.9, 2.14, 2.19) =====

class PolicySettingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing policy settings.
    Requirement 2.2: Centralized policy configuration for living allowances, tuition caps, etc.
    """
    queryset = PolicySetting.objects.filter(is_active=True)
    serializer_class = PolicySettingSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'all_settings']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        return PolicySetting.objects.filter(is_active=True).order_by('category', 'key')

    @action(detail=False, methods=['get'])
    def all_settings(self, request):
        """Returns all settings grouped by category for the dashboard"""
        settings = self.get_queryset()
        serializer = self.get_serializer(settings, many=True)
        
        grouped_data = {}
        for item in serializer.data:
            cat = item.get('category') or 'uncategorized'
            if cat not in grouped_data:
                grouped_data[cat] = []
            grouped_data[cat].append(item)
            
        return Response(grouped_data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Atomic update for multiple policy parameters"""
        settings_data = request.data.get('settings', [])
        if not settings_data:
             return Response({'detail': 'No settings provided'}, status=status.HTTP_400_BAD_REQUEST)
             
        updated_count = 0
        errors = []
        
        for data in settings_data:
            setting_id = data.get('id')
            if not setting_id:
                continue
            try:
                setting = PolicySetting.objects.get(id=setting_id)
                # Only update value for now as per dashboard requirements
                serializer = self.get_serializer(setting, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save(last_updated_by=request.user)
                    updated_count += 1
                else:
                    errors.append({setting_id: serializer.errors})
            except PolicySetting.DoesNotExist:
                errors.append({setting_id: 'Not found'})
        
        return Response({
            'status': 'success',
            'updated_count': updated_count,
            'errors': errors
        })


class FundingCalculationView(viewsets.ViewSet):
    """
    View for real-time funding amount calculations.
    POST /api/funding-calculation/ - Calculate funding amounts
    
    Request body:
    {
        "stream": "PSSSP",  # PSSSP, UCEPP, DGGR, C-DFN
        "enrollment_status": "FT",  # FT or PT
        "dependent_count": 0,
        "is_upgrading": false,
        "credential_type": "Bachelor's Degree"  # For graduation awards
    }
    
    Response:
    {
        "living_allowance": 1200.00,
        "tuition_cap": 5000.00,
        "credential_amount": 3000.00,
        "total_estimated": 9200.00
    }
    
    Requirement 2.2: Automatic funding calculations based on PolicySetting records
    """
    permission_classes = [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        try:
            stream = request.data.get('stream', 'PSSSP').upper()
            enrollment_status = request.data.get('enrollment_status', 'FT').upper()
            dependent_count = int(request.data.get('dependent_count', 0))
            is_upgrading = request.data.get('is_upgrading', False)
            credential_type = request.data.get('credential_type', '')
            
            result = {}
            
            # Calculate living allowance
            living_allowance = FundingCalculationService.calculate_living_allowance(
                stream, enrollment_status, dependent_count
            )
            result['living_allowance'] = float(living_allowance)
            
            # Calculate tuition cap
            tuition_cap = FundingCalculationService.get_tuition_cap(stream, is_upgrading)
            result['tuition_cap'] = float(tuition_cap)
            
            # Calculate credential amount if provided
            if credential_type:
                credential_amount = FundingCalculationService.calculate_graduation_award_amount(credential_type)
                result['credential_amount'] = float(credential_amount)
            
            # Calculate total estimated
            total = living_allowance + tuition_cap
            if credential_type:
                total = Decimal(str(result.get('credential_amount', 0)))
            result['total_estimated'] = float(total)
            
            return api_response(True, result, "Funding calculation completed")
        except Exception as e:
            return api_response(False, None, f"Calculation error: {str(e)}", status.HTTP_400_BAD_REQUEST)


class ComplianceValidationView(viewsets.ViewSet):
    """
    View for pre-submission compliance validation.
    POST /api/compliance-validation/ - Validate submission against policies
    
    Request body:
    {
        "form_type": "FormG",
        "submission_date": "2026-04-19",
        "travel_date": "2026-04-10",
        "completion_date": "2026-04-01",
        "enrollment_status": "FT",
        "student_age": 25,
        "is_suspended": false
    }
    
    Response:
    {
        "valid": true,
        "issues": [],
        "warnings": []
    }
    
    Requirement 2.6, 2.7, 2.11, 2.12, 2.16, 2.21, 2.23: Policy validation
    """
    permission_classes = [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        try:
            form_type = request.data.get('form_type', '')
            submission_date_str = request.data.get('submission_date', '')
            travel_date_str = request.data.get('travel_date', '')
            completion_date_str = request.data.get('completion_date', '')
            student_age = request.data.get('student_age', 0)
            is_suspended = request.data.get('is_suspended', False)
            
            issues = []
            warnings = []
            
            # Parse dates
            try:
                submission_date = datetime.strptime(submission_date_str, '%Y-%m-%d').date()
            except (ValueError, TypeError):
                submission_date = timezone.now().date()
            
            # Check suspension (Requirement 2.6)
            if is_suspended:
                issues.append("Student account is suspended")
            
            # Check age for guardian consent (Requirement 2.20)
            if student_age < 18:
                warnings.append("Student is under 18 - guardian consent required")
            
            # Validate timing windows
            if form_type == 'FormG' and travel_date_str:
                try:
                    travel_date = datetime.strptime(travel_date_str, '%Y-%m-%d').date()
                    is_valid, message = ComplianceValidationService.validate_submission_timing(
                        'FormG', submission_date, travel_date=travel_date
                    )
                    if not is_valid:
                        issues.append(message)
                except (ValueError, TypeError):
                    issues.append("Invalid travel date format")
            
            if form_type in ['FormE', 'FormF'] and completion_date_str:
                try:
                    completion_date = datetime.strptime(completion_date_str, '%Y-%m-%d').date()
                    is_valid, message = ComplianceValidationService.validate_submission_timing(
                        'FormE', submission_date, completion_date=completion_date
                    )
                    if not is_valid:
                        issues.append(message)
                except (ValueError, TypeError):
                    issues.append("Invalid completion date format")
            
            valid = len(issues) == 0
            
            return api_response(True, {
                'valid': valid,
                'issues': issues,
                'warnings': warnings
            }, "Compliance validation completed")
        except Exception as e:
            return api_response(False, None, f"Validation error: {str(e)}", status.HTTP_400_BAD_REQUEST)


class FormBTrackingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Form B enrollment confirmation tracking.
    - GET /api/form-b-tracking/ - List all Form B tracking records (SSW/Director only)
    - GET /api/form-b-tracking/{id}/ - Retrieve specific tracking record
    - PUT /api/form-b-tracking/{id}/ - Update tracking status (SSW only)
    
    Requirement 2.5: Track Form B enrollment confirmation status
    """
    queryset = FormBTracking.objects.all()
    serializer_class = FormBTrackingSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAdminUser()]
        elif self.action in ['update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        # Filter by submission if provided
        submission_id = self.request.query_params.get('submission_id')
        if submission_id:
            return FormBTracking.objects.filter(form_a_submission_id=submission_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            return FormBTracking.objects.filter(status=status_filter)
        
        return FormBTracking.objects.all().order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        """Mark Form B as received from registrar"""
        tracking = self.get_object()
        tracking.status = 'received'
        tracking.received_at = timezone.now()
        tracking.notes = request.data.get('notes', '')
        tracking.save()
        
        return api_response(True, FormBTrackingSerializer(tracking).data, "Form B marked as received")


class PaymentScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing monthly payment schedules.
    - GET /api/payment-schedule/ - List payment schedules (Finance/SSW/Director only)
    - GET /api/payment-schedule/{id}/ - Retrieve specific schedule entry
    - PUT /api/payment-schedule/{id}/ - Update schedule status (Finance only)
    
    Query parameters:
    - submission_id: Filter by submission
    - status: Filter by payment status
    
    Requirement 2.19: Monthly living allowance disbursement tracking
    """
    queryset = PaymentSchedule.objects.all()
    serializer_class = PaymentScheduleSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        queryset = PaymentSchedule.objects.all()
        
        # Staff can see everything, students only their own
        if not self.request.user.is_staff:
            queryset = queryset.filter(payment__student=self.request.user)
        
        # Filter by submission
        submission_id = self.request.query_params.get('submission_id')
        if submission_id:
            queryset = queryset.filter(payment__submission_id=submission_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('month_year')


class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing overall payment records.
    - GET /api/payments/ - List payments (Self for students, ALL for Staff)
    - GET /api/payments/{id}/ - Retrieve specific payment
    
    Requirement 2.4: Transparency and tracking of approved funding disbursements
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Payment.objects.all()
        
        # Security: Students see only their own, Staff see everything
        if not self.request.user.is_staff:
            queryset = queryset.filter(student=self.request.user)
            
        # Optional filters
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        submission_id = self.request.query_params.get('submission_id')
        if submission_id:
            queryset = queryset.filter(submission_id=submission_id)
            
        return queryset.order_by('-created_at')


class DecisionLetterView(viewsets.ViewSet):
    """
    View for retrieving decision letters.
    GET /api/submissions/{id}/decision-letter/ - Retrieve decision letter
    
    Response:
    {
        "id": 123,
        "reference_number": "APP-2026-000123",
        "decision_letter_text": "Dear [Student Name]...",
        "status": "accepted",
        "generated_at": "2026-04-19T10:30:00Z"
    }
    
    Requirement 2.8: Automatic decision letter generation and retrieval
    """
    permission_classes = [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'], url_path='submissions/(?P<submission_id>[^/.]+)/decision-letter')
    def get_letter(self, request, submission_id=None):
        try:
            from forms.models import FormSubmission
            submission = FormSubmission.objects.get(id=submission_id)
            
            if not submission.decision_letter_text:
                return api_response(
                    False, None,
                    "No decision letter available for this submission.",
                    status.HTTP_404_NOT_FOUND
                )
            
            reference_number = f"APP-{submission.submitted_at.year}-{submission.id:06d}"
            
            return api_response(True, {
                'id': submission.id,
                'reference_number': reference_number,
                'decision_letter_text': submission.decision_letter_text,
                'status': submission.status,
                'generated_at': submission.decided_at.isoformat() if submission.decided_at else None
            }, "Decision letter retrieved")
        except Exception as e:
            return api_response(False, None, f"Error retrieving letter: {str(e)}", status.HTTP_400_BAD_REQUEST)


class BudgetStatusView(viewsets.ViewSet):
    """
    View for monitoring DGGR budget status.
    GET /api/budget-status/ - Get current fiscal year budget status
    
    Response:
    {
        "fiscal_year": "2025-2026",
        "total_budget": 36000.00,
        "allocated_amount": 12500.00,
        "remaining_amount": 23500.00,
        "allocation_count": 5,
        "utilization_percentage": 34.72
    }
    
    Requirement 2.14: DGGR extra tuition budget cap monitoring
    """
    permission_classes = [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        try:
            fiscal_year = ExtraTuitionBudget.get_current_fiscal_year()
            budget, created = ExtraTuitionBudget.objects.get_or_create(
                fiscal_year=fiscal_year,
                defaults={
                    'total_budget': 36000.00,
                    'allocated_amount': 0.00,
                    'remaining_amount': 36000.00
                }
            )
            
            utilization = (budget.allocated_amount / budget.total_budget * 100) if budget.total_budget > 0 else 0
            
            return api_response(True, {
                'fiscal_year': budget.fiscal_year,
                'total_budget': float(budget.total_budget),
                'allocated_amount': float(budget.allocated_amount),
                'remaining_amount': float(budget.remaining_amount),
                'allocation_count': budget.allocation_count,
                'utilization_percentage': round(utilization, 2)
            }, "Budget status retrieved")
        except Exception as e:
            return api_response(False, None, f"Error retrieving budget: {str(e)}", status.HTTP_400_BAD_REQUEST)
