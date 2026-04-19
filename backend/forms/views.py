from rest_framework import viewsets, permissions, status, decorators, parsers
from rest_framework.response import Response
from .models import Form, FormField, FormSubmission, SubmissionAnswer, SubmissionNote
from .serializers import FormSerializer, FormSubmissionSerializer, FormFieldSerializer, SubmissionNoteSerializer
from notifications.models import Notification
from users.permissions import IsAdminUser, IsStudentUser, IsOwnerOrAdmin, IsDirectorUser
from core.utils import api_response
from django.utils import timezone
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from decimal import Decimal
from api.models import FormBTracking, Payment, PaymentSchedule, ExtraTuitionBudget
from api.services import FundingCalculationService, ComplianceValidationService, DecisionLetterService
from django.contrib.auth import get_user_model

User = get_user_model()

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer
    parser_classes = (parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        if self.action == 'submit':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """
        Enhanced form submission with comprehensive policy enforcement.
        
        Phases:
        1. Validate student eligibility (suspension, age)
        2. Validate timing and policy (deadlines, windows)
        3. Validate eligibility-specific requirements (duplicate funding, SFA denial)
        4. Handle late submissions (set is_late, require director exception)
        5. Calculate amounts using FundingCalculationService
        6. Create FormSubmission with policy fields
        7. Create FormBTracking for Form A submissions
        8. Generate backend reference number
        """
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

        student = request.user if request.user.is_authenticated else None
        submission_date = timezone.now()
        
        # ===== PHASE 1: Validate Student Eligibility =====
        if student:
            # Check suspension status (Requirement 2.6)
            if student.is_suspended:
                if student.suspended_until and student.suspended_until >= submission_date.date():
                    return api_response(
                        False,
                        None,
                        "Your account is currently suspended. Please contact the DGG Education Department.",
                        status.HTTP_403_FORBIDDEN
                    )
            
            # Check age and guardian consent requirement (Requirement 2.20)
            if student.dob:
                age = (submission_date.date() - student.dob).days // 365
                if age < 18:
                    # Flag for guardian consent requirement
                    data['guardian_consent_on_file'] = False
        
        # ===== PHASE 2: Validate Timing and Policy =====
        # Check semester deadlines (Requirement 2.7)
        is_late = False
        deadline_check = ComplianceValidationService.validate_semester_deadline(submission_date.date())
        if not deadline_check['valid']:
            is_late = True
            data['is_late'] = True
            # Late submissions require director exception
            if not data.get('director_exception_approved', False):
                return api_response(
                    False,
                    None,
                    "This submission is past the semester deadline. A Director exception is required.",
                    status.HTTP_400_BAD_REQUEST
                )
        
        # Extract answers for policy validation
        answers_dict = {}
        if isinstance(data.get('answers'), list):
            for ans in data['answers']:
                field_label = ans.get('field_label', '')
                answer_text = ans.get('answer_text', '')
                answers_dict[field_label] = answer_text
        
        # Validate form-specific timing windows
        form_title = form.title.lower()
        
        # Travel Claim (Form G) - 30-day window (Requirement 2.11)
        if 'travel' in form_title.lower() or 'form g' in form_title.lower():
            travel_date_str = answers_dict.get('Travel Date', '')
            if travel_date_str:
                try:
                    travel_date = datetime.strptime(travel_date_str, '%Y-%m-%d').date()
                    timing_valid, timing_msg = ComplianceValidationService.validate_submission_timing(
                        'FormG', submission_date.date(), travel_date=travel_date
                    )
                    if not timing_valid:
                        return api_response(False, None, timing_msg, status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    return api_response(False, None, "A valid travel date is required for travel claim submissions.", status.HTTP_400_BAD_REQUEST)
        
        # Graduation Award (Form E) and Practicum Award (Form F) - 6-month window (Requirement 2.12)
        if 'graduation' in form_title.lower() or 'practicum' in form_title.lower():
            completion_date_str = answers_dict.get('Completion Date', '')
            if completion_date_str:
                try:
                    completion_date = datetime.strptime(completion_date_str, '%Y-%m-%d').date()
                    timing_valid, timing_msg = ComplianceValidationService.validate_submission_timing(
                        'FormE', submission_date.date(), completion_date=completion_date
                    )
                    if not timing_valid:
                        return api_response(False, None, timing_msg, status.HTTP_400_BAD_REQUEST)
                except (ValueError, TypeError):
                    return api_response(False, None, "A valid completion date is required for this submission.", status.HTTP_400_BAD_REQUEST)
        
        # ===== PHASE 3: Validate Eligibility-Specific Requirements =====
        
        # Check for duplicate funding (Requirement 2.23)
        eligibility_q8 = answers_dict.get('Eligibility q8', '').lower()
        if eligibility_q8 == 'yes':
            return api_response(
                False,
                None,
                "Students receiving PSSSP or UCEPP from another First Nation organisation are not eligible for the C-DFN stream.",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Check for SFA denial letter requirement (Requirement 2.21)
        eligibility_q3 = answers_dict.get('Eligibility q3', '').lower()
        bursary_stream = answers_dict.get('Bursary Stream', '').upper()
        
        if eligibility_q3 == 'no' and 'PSSSP' in bursary_stream:
            # Check if SFA Denial Letter file is present
            sfa_denial_found = False
            if isinstance(data.get('answers'), list):
                for ans in data['answers']:
                    if ans.get('field_label') == 'SFA Denial Letter' and ans.get('answer_file'):
                        sfa_denial_found = True
                        break
            
            if not sfa_denial_found:
                return api_response(
                    False,
                    None,
                    "An SFA denial letter is required for C-DFN PSSSP applications where SFA has not been applied for.",
                    status.HTTP_400_BAD_REQUEST
                )
        
        # ===== PHASE 4: Handle Late Submissions =====
        if is_late:
            data['is_late'] = True
        
        # ===== PHASE 5: Calculate Amounts Using FundingCalculationService =====
        
        # Determine program stream (Requirement 2.3)
        eligibility_q7 = answers_dict.get('Eligibility q7', '').lower()
        is_upgrading = eligibility_q7 == 'yes'
        
        program_stream = 'psssp'  # Default
        if is_upgrading:
            program_stream = 'ucepp'
        elif 'dggr' in bursary_stream.lower():
            program_stream = 'dggr'
        elif 'c-dfn' in bursary_stream.lower():
            program_stream = 'c-dfn'
        
        data['program_stream'] = program_stream
        
        # Calculate amounts based on form type
        calculated_amount = Decimal('0.00')
        
        if 'form a' in form_title.lower() or 'new student' in form_title.lower():
            # Form A - Living Allowance + Tuition
            enrollment_status = answers_dict.get('Enrollment Status', 'FT').upper()
            dependent_count = int(answers_dict.get('Dependent Count', 0)) if answers_dict.get('Dependent Count', '').isdigit() else 0
            
            living_allowance = FundingCalculationService.calculate_living_allowance(
                program_stream.upper(), enrollment_status, dependent_count
            )
            tuition_cap = FundingCalculationService.get_tuition_cap(program_stream.upper(), is_upgrading)
            calculated_amount = living_allowance + tuition_cap
        
        elif 'graduation' in form_title.lower() or 'form e' in form_title.lower():
            # Form E - Graduation Award
            credential_type = answers_dict.get('Credential Type', '')
            calculated_amount = FundingCalculationService.calculate_graduation_award_amount(credential_type)
        
        elif 'travel' in form_title.lower() or 'form g' in form_title.lower():
            # Form G - Travel Claim (use submitted amount or calculate)
            claimed_amount = answers_dict.get('Claimed Amount', '0')
            try:
                calculated_amount = Decimal(claimed_amount)
            except:
                calculated_amount = Decimal('0.00')
        
        elif 'practicum' in form_title.lower() or 'form f' in form_title.lower():
            # Form F - Practicum Award
            claimed_amount = answers_dict.get('Claimed Amount', '0')
            try:
                calculated_amount = Decimal(claimed_amount)
            except:
                calculated_amount = Decimal('0.00')
        
        # Set calculated amount if not already provided
        if calculated_amount > 0:
            data['amount'] = float(calculated_amount)
        
        # ===== PHASE 6: Create FormSubmission with Policy Fields =====
        serializer = FormSubmissionSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            submission = serializer.save(form=form, student=student)
            
            # ===== PHASE 7: Create FormBTracking for Form A Submissions =====
            if 'form a' in form_title.lower() or 'new student' in form_title.lower():
                registrar_email = answers_dict.get('Registrar / Official Email', '')
                institution_name = answers_dict.get('Institution Name', 'Unknown Institution')
                
                if registrar_email:
                    due_date = submission_date.date() + timedelta(days=30)
                    FormBTracking.objects.create(
                        form_a_submission=submission,
                        registrar_email=registrar_email,
                        institution_name=institution_name,
                        status='pending',
                        due_date=due_date
                    )
            
            # ===== PHASE 8: Generate Backend Reference Number =====
            # Reference number is the submission ID formatted as APP-YYYY-XXXXXX
            reference_number = f"APP-{submission_date.year}-{submission.id:06d}"
            
            # Send notification to student
            if student:
                Notification.objects.create(
                    user=student,
                    title="Application Received",
                    message=f"Your application for '{form.title}' has been successfully submitted and is awaiting review. Reference: {reference_number}",
                    link="/dashboard"
                )
            
            # Send notification to admins
            admins = User.objects.filter(role='admin')
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title="New Application Received",
                    message=f"A new submission for '{form.title}' has been received from {student.full_name if student else 'Guest'}. Reference: {reference_number}",
                    link="/staff/applications"
                )
            
            # Add reference number to response
            response_data = FormSubmissionSerializer(submission).data
            response_data['reference_number'] = reference_number
            
            return api_response(True, response_data, "Form submitted successfully", status.HTTP_201_CREATED)
        
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
        elif self.action in ['approve_late_submission', 'escalate_appeal']:
            permission_classes = [IsDirectorUser]
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
        from api.models import Payment, PaymentSchedule, ExtraTuitionBudget
        from dateutil.relativedelta import relativedelta
        
        submission = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(FormSubmission.STATUS_CHOICES):
            return api_response(False, None, "Invalid status", status.HTTP_400_BAD_REQUEST)
        
        # ===== PHASE 1: Validate travel claim approval timing (Requirement 2.16) =====
        if new_status == 'accepted':
            form_title = submission.form.title.lower() if submission.form else ''
            if 'travel' in form_title or 'formg' in form_title:
                # Extract travel_date from submission answers
                travel_date = None
                for answer in submission.answers.all():
                    if 'travel' in answer.field.label.lower() and 'date' in answer.field.label.lower():
                        try:
                            travel_date = datetime.strptime(answer.answer_text, '%Y-%m-%d').date()
                            break
                        except (ValueError, TypeError, AttributeError):
                            pass
                
                if travel_date:
                    # Validate travel approval timing
                    is_valid, message = ComplianceValidationService.validate_travel_approval_timing(travel_date)
                    if not is_valid:
                        return api_response(False, None, message, status.HTTP_400_BAD_REQUEST)
        
        # ===== PHASE 2: Generate decision letter (Requirement 2.8) =====
        if new_status in ['accepted', 'rejected']:
            try:
                letter_text = DecisionLetterService.generate_letter_for_status_change(submission, new_status)
                if letter_text:
                    submission.decision_letter_text = letter_text
            except Exception as e:
                # Log error but don't block status update
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Decision letter generation failed for submission {submission.id}: {str(e)}")
        
        # Update status and timestamps
        submission.status = new_status
        
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
        
        # ===== PHASE 3: Create Payment record (Requirement 2.4) =====
        payment = None
        if new_status == 'accepted' and submission.student:
            try:
                # Determine payment type from form type
                form_title = submission.form.title.lower() if submission.form else ''
                payment_type = 'tuition'  # default
                
                if 'living' in form_title or 'forma' in form_title or 'formc' in form_title:
                    payment_type = 'living_allowance'
                elif 'graduation' in form_title or 'forme' in form_title:
                    payment_type = 'graduation_award'
                elif 'travel' in form_title and 'graduation' not in form_title:
                    if 'gtb' in form_title.lower():
                        payment_type = 'graduation_travel_bursary'
                    else:
                        payment_type = 'travel_claim'
                elif 'practicum' in form_title or 'formf' in form_title:
                    payment_type = 'practicum_award'
                
                payment = Payment.objects.create(
                    submission=submission,
                    student=submission.student,
                    payment_type=payment_type,
                    amount=submission.amount,
                    status='scheduled',
                    scheduled_date=timezone.now().date()
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Payment creation failed for submission {submission.id}: {str(e)}")
        
        # ===== PHASE 4: Create PaymentSchedule entries (Requirement 2.19) =====
        if new_status == 'accepted' and payment and submission.student:
            try:
                form_title = submission.form.title.lower() if submission.form else ''
                # Check if this is a living allowance form (Form A or Form C)
                is_living_allowance = ('living' in form_title or 'forma' in form_title or 'formc' in form_title or 
                                      'new student' in form_title or 'continuing' in form_title)
                
                if is_living_allowance:
                    # Extract semStart and semEnd from submission answers
                    sem_start = None
                    sem_end = None
                    
                    for answer in submission.answers.all():
                        field_label = answer.field.label.lower() if answer.field else ''
                        if 'sem' in field_label and 'start' in field_label:
                            try:
                                sem_start = datetime.strptime(answer.answer_text, '%Y-%m-%d').date()
                            except (ValueError, TypeError, AttributeError):
                                pass
                        elif 'sem' in field_label and 'end' in field_label:
                            try:
                                sem_end = datetime.strptime(answer.answer_text, '%Y-%m-%d').date()
                            except (ValueError, TypeError, AttributeError):
                                pass
                    
                    if sem_start and sem_end:
                        # Calculate number of months
                        current = sem_start
                        month_count = 0
                        while current <= sem_end:
                            month_count += 1
                            current += relativedelta(months=1)
                        
                        if month_count > 0:
                            monthly_amount = submission.amount / Decimal(str(month_count))
                            
                            # Create PaymentSchedule entries for each month
                            current = sem_start
                            while current <= sem_end:
                                month_first = current.replace(day=1)
                                PaymentSchedule.objects.create(
                                    payment=payment,
                                    month_year=month_first,
                                    amount=monthly_amount,
                                    status='scheduled'
                                )
                                current += relativedelta(months=1)
                    else:
                        # Create single entry if dates not found
                        PaymentSchedule.objects.create(
                            payment=payment,
                            month_year=timezone.now().date().replace(day=1),
                            amount=submission.amount,
                            status='scheduled'
                        )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"PaymentSchedule creation failed for submission {submission.id}: {str(e)}")
        
        # ===== PHASE 5: Allocate DGGR budget (Requirement 2.14) =====
        if new_status == 'accepted' and submission.program_stream == 'dggr':
            try:
                FundingCalculationService.allocate_dggr_budget(submission.amount)
                # Add internal note about budget allocation
                SubmissionNote.objects.create(
                    submission=submission,
                    author=request.user,
                    text=f"DGGR budget allocation: ${submission.amount} allocated to ExtraTuitionBudget"
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"DGGR budget allocation failed for submission {submission.id}: {str(e)}")
        
        # ===== PHASE 6: Create Finance notifications (Requirement 2.9) =====
        if new_status == 'accepted':
            try:
                finance_users = User.objects.filter(role='finance')
                for finance_user in finance_users:
                    student_name = submission.student.full_name if submission.student else 'Unknown'
                    form_title = submission.form.title if submission.form else 'Unknown Form'
                    Notification.objects.create(
                        user=finance_user,
                        title="Payment Scheduled",
                        message=f"Payment of ${submission.amount} scheduled for {student_name} - {form_title}",
                        link=f"/staff/submissions/{submission.id}"
                    )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Finance notification creation failed for submission {submission.id}: {str(e)}")
        
        # ===== PHASE 7: Add audit logging =====
        try:
            audit_text = f"Status changed to '{new_status}' by {request.user.email}"
            if new_status == 'rejected' and submission.decision_reason:
                audit_text += f". Reason: {submission.decision_reason}"
            if new_status == 'accepted' and payment:
                audit_text += f". Payment reference: {payment.reference_number}"
            
            SubmissionNote.objects.create(
                submission=submission,
                author=request.user,
                text=audit_text
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Audit logging failed for submission {submission.id}: {str(e)}")
        
        # ===== Student and SSW Notifications =====
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

    @decorators.action(detail=True, methods=['post'], url_path='approve-late', permission_classes=[IsDirectorUser])
    def approve_late_submission(self, request, pk=None):
        """
        Director-only endpoint to approve late submissions.
        Sets director_exception_approved=True to allow late submissions past semester deadlines.
        
        Requirement 2.7: Semester Deadline Enforcement - Director exception workflow
        """
        submission = self.get_object()
        
        # Verify submission is marked as late
        if not submission.is_late:
            return api_response(
                False,
                None,
                "This submission is not marked as late. Director exception not needed.",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Set director exception approval
        submission.director_exception_approved = True
        submission.save()
        
        # Create audit log entry
        audit_text = f"Director exception approved by {request.user.email} for late submission"
        SubmissionNote.objects.create(
            submission=submission,
            author=request.user,
            text=audit_text
        )
        
        # Notify student of exception approval
        if submission.student:
            Notification.objects.create(
                user=submission.student,
                title="Late Submission Exception Approved",
                message=f"Your late submission for '{submission.form.title}' has been approved by the Director and will be processed.",
                link=f"/dashboard"
            )
        
        # Notify all admins/SSW of the exception approval
        admin_users = User.objects.filter(role='admin')
        for admin_user in admin_users:
            Notification.objects.create(
                user=admin_user,
                title="Director Exception Approved",
                message=f"Director {request.user.full_name} approved a late submission exception for {submission.student.full_name if submission.student else 'Unknown'} - {submission.form.title}",
                link=f"/staff/submissions/{submission.id}"
            )
        
        return api_response(
            True,
            FormSubmissionSerializer(submission).data,
            "Late submission exception approved by Director"
        )

    @decorators.action(detail=True, methods=['post'], url_path='escalate', permission_classes=[IsDirectorUser])
    def escalate_appeal(self, request, pk=None):
        """
        Director-only endpoint to escalate appeals to higher governance levels.
        Updates escalation_level field and notifies all directors and admins.
        
        Requirement 2.22: Appeal Escalation Path - escalation_level field and API endpoint
        """
        submission = self.get_object()
        escalation_level = request.data.get('escalation_level')
        
        # Validate escalation_level
        valid_levels = ['none', 'director', 'beneficiary_services', 'ceo', 'dkdk']
        if escalation_level not in valid_levels:
            return api_response(
                False,
                None,
                f"Invalid escalation level. Must be one of: {', '.join(valid_levels)}",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Verify this is an appeal submission (FormH)
        form_title = submission.form.title.lower() if submission.form else ''
        if 'formh' not in form_title and 'appeal' not in form_title:
            return api_response(
                False,
                None,
                "Escalation is only available for appeal submissions (FormH).",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Store previous escalation level for audit trail
        previous_level = submission.escalation_level
        
        # Update escalation level
        submission.escalation_level = escalation_level
        submission.save()
        
        # Create audit log entry
        audit_text = f"Appeal escalated from '{previous_level}' to '{escalation_level}' by Director {request.user.email}"
        escalation_reason = request.data.get('reason', '')
        if escalation_reason:
            audit_text += f". Reason: {escalation_reason}"
        
        SubmissionNote.objects.create(
            submission=submission,
            author=request.user,
            text=audit_text
        )
        
        # Notify student of escalation
        if submission.student:
            escalation_msg = f"Your appeal has been escalated to {escalation_level.replace('_', ' ').title()} level for further review."
            Notification.objects.create(
                user=submission.student,
                title="Appeal Escalated",
                message=escalation_msg,
                link=f"/dashboard"
            )
        
        # Notify all directors and admins of the escalation
        director_users = User.objects.filter(role='director')
        admin_users = User.objects.filter(role='admin')
        
        for user in director_users.union(admin_users):
            # Don't notify the director who performed the escalation
            if user.id != request.user.id:
                student_name = submission.student.full_name if submission.student else 'Unknown'
                Notification.objects.create(
                    user=user,
                    title="Appeal Escalated",
                    message=f"An appeal from {student_name} has been escalated to {escalation_level.replace('_', ' ').title()} level by Director {request.user.full_name}.",
                    link=f"/staff/submissions/{submission.id}"
                )
        
        return api_response(
            True,
            FormSubmissionSerializer(submission).data,
            f"Appeal escalated to {escalation_level.replace('_', ' ').title()} level"
        )
