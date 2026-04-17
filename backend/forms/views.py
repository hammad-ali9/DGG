from rest_framework import viewsets, permissions, status, decorators, parsers
from rest_framework.response import Response
from .models import Form, FormField, FormSubmission, SubmissionAnswer, SubmissionNote
from .serializers import FormSerializer, FormSubmissionSerializer, FormFieldSerializer, SubmissionNoteSerializer
from notifications.models import Notification
from users.permissions import IsAdminUser, IsStudentUser, IsOwnerOrAdmin
from core.utils import api_response

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    parser_classes = (parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        form = self.get_object()
        
        # Extract data into a mutable dict
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        
        # Add form ID so the serializer can validate it
        data['form'] = form.id

        # Handle indexed FormData answers (e.g., answers[0]field_label)
        if 'answers[0]field_label' in data or 'answers[0]answer_text' in data:
            answers = []
            i = 0
            while f'answers[{i}]field_label' in data or f'answers[{i}]answer_text' in data:
                ans = {
                    'field_label': data.get(f'answers[{i}]field_label'),
                    'answer_text': data.get(f'answers[{i}]answer_text'),
                }
                # Check for file
                file_key = f'answers[{i}]answer_file'
                if file_key in request.FILES:
                    ans['answer_file'] = request.FILES[file_key]
                answers.append(ans)
                i += 1
            data['answers'] = answers

        serializer = FormSubmissionSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            student = request.user if request.user.is_authenticated else None
            submission = serializer.save(form=form, student=student)
            
            # Send notification to student
            if student:
                Notification.objects.create(
                    user=student,
                    title="Application Received",
                    message=f"Your application for '{form.title}' has been successfully submitted and is awaiting review.",
                    link="/dashboard"
                )
            
            # Send notification to admins
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admins = User.objects.filter(role='admin')
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title="New Application Received",
                    message=f"A new submission for '{form.title}' has been received from {student.full_name if student else 'Guest'}.",
                    link="/staff/applications"
                )

            return api_response(True, serializer.data, "Form submitted successfully", status.HTTP_201_CREATED)
        return api_response(False, serializer.errors, "Submission failed", status.HTTP_400_BAD_REQUEST)

class FormSubmissionViewSet(viewsets.ModelViewSet):
    queryset = FormSubmission.objects.all()
    serializer_class = FormSubmissionSerializer
    parser_classes = (parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser)
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsOwnerOrAdmin]
        elif self.action in ['update_status', 'add_note']:
            permission_classes = [IsAdminUser]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return FormSubmission.objects.none()
            
        if user.role in ['admin', 'director']:
            return FormSubmission.objects.all().order_by('-submitted_at')
        return FormSubmission.objects.filter(student=user).order_by('-submitted_at')

    @decorators.action(detail=True, methods=['put'], url_path='status', permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        from django.utils import timezone
        submission = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(FormSubmission.STATUS_CHOICES):
            submission.status = new_status
            
            # Auto-timestamps based on status
            if new_status == 'reviewed':
                submission.reviewed_at = timezone.now()
                submission.reviewed_by = request.user
                if 'amount' in request.data:
                    submission.amount = request.data.get('amount')
            elif new_status == 'forwarded':
                submission.forwarded_at = timezone.now()
                submission.forwarded_by = request.user
            elif new_status in ['accepted', 'rejected']:
                submission.decided_at = timezone.now()
                submission.decided_by = request.user
                submission.decision_reason = request.data.get('reason', '')
            
            submission.save()
            
            # Notification logic
            if submission.student:
                title = f"Application Update: {new_status.capitalize()}"
                msg = f"Your application for '{submission.form.title}' is now '{new_status}'."
                
                if new_status == 'reviewed':
                    msg = f"Your application has been reviewed by staff."
                elif new_status == 'forwarded':
                    msg = f"Your application has been forwarded to the Director for final approval."
                elif new_status == 'accepted':
                    msg = f"Congratulations! Your application has been APPROVED for ${submission.amount}."
                elif new_status == 'rejected':
                    msg = f"Your application was not approved. Reason: {submission.decision_reason}"

                Notification.objects.create(
                    user=submission.student,
                    title=title,
                    message=msg,
                    link=f"/dashboard"
                )
            
            return api_response(True, FormSubmissionSerializer(submission).data, "Submission updated")
        return api_response(False, None, "Invalid status", status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=True, methods=['post'], url_path='notes', permission_classes=[IsAdminUser])
    def add_note(self, request, pk=None):
        submission = self.get_object()
        text = request.data.get('text')
        if text:
            note = SubmissionNote.objects.create(
                submission=submission,
                author=request.user,
                text=text
            )
            serializer = SubmissionNoteSerializer(note)
            return api_response(True, serializer.data, "Internal note added")
        return api_response(False, None, "Note text is required", status.HTTP_400_BAD_REQUEST)
