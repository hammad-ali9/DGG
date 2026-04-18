from .models import Notification


def create_notification(user, title, message, link=None):
    """
    Creates a notification for a user.
    """
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        link=link
    )


# ---------------------------------------------------------------------------
# Notification message templates
# ---------------------------------------------------------------------------

class NotificationTemplates:
    """Centralised message templates for all policy-related notification events."""

    # Finance / approval
    FINANCE_APPROVAL_TITLE = "Payment Scheduled"
    FINANCE_APPROVAL_MSG = (
        "Payment of ${amount} scheduled for {student_name} — {form_title}"
    )

    SSW_PAYMENT_QUEUED_TITLE = "Payment Queued for Your Submission"
    SSW_PAYMENT_QUEUED_MSG = (
        "The submission for '{form_title}' by {student_name} has been approved "
        "and a payment of ${amount} has been queued for processing."
    )

    # Student status change
    STATUS_CHANGE_TITLE = "Application Update: {status}"
    STATUS_REVIEWED_MSG = "Your application has been reviewed by staff."
    STATUS_FORWARDED_MSG = "Your application has been forwarded to the Director for final approval."
    STATUS_ACCEPTED_MSG = "Congratulations! Your application has been APPROVED for ${amount}."
    STATUS_REJECTED_MSG = "Your application was not approved. Reason: {reason}"
    STATUS_GENERIC_MSG = "Your application for '{form_title}' is now '{status}'."

    # Form B overdue
    FORMB_OVERDUE_TITLE = "Form B Overdue: {institution_name}"
    FORMB_OVERDUE_MSG = (
        "The enrollment confirmation (Form B) for {student_name} at "
        "{institution_name} is overdue (due {due_date}). "
        "Please follow up with the registrar at {registrar_email}."
    )

    # Appeal escalation
    APPEAL_ESCALATED_STUDENT_TITLE = "Appeal Escalated"
    APPEAL_ESCALATED_STUDENT_MSG = (
        "Your appeal has been escalated to {level} level for further review."
    )
    APPEAL_ESCALATED_STAFF_TITLE = "Appeal Escalated"
    APPEAL_ESCALATED_STAFF_MSG = (
        "An appeal from {student_name} has been escalated to {level} level "
        "by Director {director_name}."
    )

    # Suspension
    SUSPENDED_TITLE = "Account Suspended"
    SUSPENDED_MSG = (
        "Your account has been suspended. "
        "Please contact the DGG Education Department for more information."
    )
    SUSPENSION_LIFTED_TITLE = "Account Suspension Lifted"
    SUSPENSION_LIFTED_MSG = (
        "Your account suspension has been lifted. "
        "You may now submit new applications."
    )

    # Guardian consent
    GUARDIAN_CONSENT_TITLE = "Guardian Consent Required"
    GUARDIAN_CONSENT_MSG = (
        "A submission from {student_name} (under 18) requires guardian consent "
        "on file before information can be shared. "
        "Submission reference: {reference}."
    )

    # Late exception
    LATE_EXCEPTION_STUDENT_TITLE = "Late Submission Exception Approved"
    LATE_EXCEPTION_STUDENT_MSG = (
        "Your late submission for '{form_title}' has been approved by the "
        "Director and will be processed."
    )
    LATE_EXCEPTION_ADMIN_TITLE = "Director Exception Approved"
    LATE_EXCEPTION_ADMIN_MSG = (
        "Director {director_name} approved a late submission exception for "
        "{student_name} — {form_title}."
    )


# ---------------------------------------------------------------------------
# PolicyNotificationService
# ---------------------------------------------------------------------------

class PolicyNotificationService:
    """
    Centralised service for creating policy-related notifications.

    All methods are static so they can be called without instantiation.
    Each method is safe to call even when optional related objects are absent.
    """

    @staticmethod
    def notify_finance_approval(submission):
        """
        Notify all Finance users that a payment has been scheduled.
        Also notify the SSW who forwarded the submission (Req 2.9).

        Args:
            submission: FormSubmission instance with status='accepted'.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        student_name = submission.student.full_name if submission.student else "Unknown"
        form_title = submission.form.title if submission.form else "Unknown Form"
        amount = submission.amount

        # Notify all Finance users
        finance_users = User.objects.filter(role='finance')
        for finance_user in finance_users:
            create_notification(
                user=finance_user,
                title=NotificationTemplates.FINANCE_APPROVAL_TITLE,
                message=NotificationTemplates.FINANCE_APPROVAL_MSG.format(
                    amount=amount,
                    student_name=student_name,
                    form_title=form_title,
                ),
                link=f"/staff/submissions/{submission.id}",
            )

        # Notify the SSW who forwarded the submission
        if submission.forwarded_by:
            create_notification(
                user=submission.forwarded_by,
                title=NotificationTemplates.SSW_PAYMENT_QUEUED_TITLE,
                message=NotificationTemplates.SSW_PAYMENT_QUEUED_MSG.format(
                    form_title=form_title,
                    student_name=student_name,
                    amount=amount,
                ),
                link=f"/staff/submissions/{submission.id}",
            )

    @staticmethod
    def notify_student_status_change(submission, new_status):
        """
        Notify the student that their submission status has changed (Req 2.5).

        Args:
            submission: FormSubmission instance.
            new_status: The new status string.
        """
        if not submission.student:
            return

        form_title = submission.form.title if submission.form else "Unknown Form"
        title = NotificationTemplates.STATUS_CHANGE_TITLE.format(
            status=new_status.capitalize()
        )

        if new_status == 'reviewed':
            msg = NotificationTemplates.STATUS_REVIEWED_MSG
        elif new_status == 'forwarded':
            msg = NotificationTemplates.STATUS_FORWARDED_MSG
        elif new_status == 'accepted':
            msg = NotificationTemplates.STATUS_ACCEPTED_MSG.format(
                amount=submission.amount
            )
        elif new_status == 'rejected':
            msg = NotificationTemplates.STATUS_REJECTED_MSG.format(
                reason=submission.decision_reason or "No reason provided"
            )
        else:
            msg = NotificationTemplates.STATUS_GENERIC_MSG.format(
                form_title=form_title,
                status=new_status,
            )

        create_notification(
            user=submission.student,
            title=title,
            message=msg,
            link="/dashboard",
        )

    @staticmethod
    def notify_formb_overdue(form_b_tracking, admin_users):
        """
        Notify SSW/admin users that a Form B enrollment confirmation is overdue (Req 2.5).

        Args:
            form_b_tracking: FormBTracking instance.
            admin_users: QuerySet or iterable of users to notify.
        """
        submission = form_b_tracking.form_a_submission
        student_name = (
            submission.student.full_name
            if submission and submission.student
            else "Unknown"
        )

        for user in admin_users:
            create_notification(
                user=user,
                title=NotificationTemplates.FORMB_OVERDUE_TITLE.format(
                    institution_name=form_b_tracking.institution_name
                ),
                message=NotificationTemplates.FORMB_OVERDUE_MSG.format(
                    student_name=student_name,
                    institution_name=form_b_tracking.institution_name,
                    due_date=form_b_tracking.due_date,
                    registrar_email=form_b_tracking.registrar_email,
                ),
                link=f"/staff/submissions/{submission.id}" if submission else "/staff/applications",
            )

    @staticmethod
    def notify_appeal_escalated(submission, escalation_level, escalated_by):
        """
        Notify student, directors, and admins when an appeal is escalated (Req 2.22).

        Args:
            submission: FormSubmission instance (FormH).
            escalation_level: String value of the new escalation level.
            escalated_by: CustomUser who performed the escalation (Director).
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        level_display = escalation_level.replace('_', ' ').title()
        director_name = escalated_by.full_name if escalated_by else "Unknown"
        student_name = submission.student.full_name if submission.student else "Unknown"

        # Notify student
        if submission.student:
            create_notification(
                user=submission.student,
                title=NotificationTemplates.APPEAL_ESCALATED_STUDENT_TITLE,
                message=NotificationTemplates.APPEAL_ESCALATED_STUDENT_MSG.format(
                    level=level_display
                ),
                link="/dashboard",
            )

        # Notify directors and admins (excluding the escalating director)
        staff_users = User.objects.filter(role__in=['director', 'admin'])
        for user in staff_users:
            if user.id != escalated_by.id:
                create_notification(
                    user=user,
                    title=NotificationTemplates.APPEAL_ESCALATED_STAFF_TITLE,
                    message=NotificationTemplates.APPEAL_ESCALATED_STAFF_MSG.format(
                        student_name=student_name,
                        level=level_display,
                        director_name=director_name,
                    ),
                    link=f"/staff/submissions/{submission.id}",
                )

    @staticmethod
    def notify_student_suspended(student):
        """
        Notify a student that their account has been suspended (Req 2.6).

        Args:
            student: CustomUser instance with is_suspended=True.
        """
        create_notification(
            user=student,
            title=NotificationTemplates.SUSPENDED_TITLE,
            message=NotificationTemplates.SUSPENDED_MSG,
            link="/dashboard",
        )

    @staticmethod
    def notify_student_suspension_lifted(student):
        """
        Notify a student that their suspension has been lifted (Req 2.6).

        Args:
            student: CustomUser instance whose suspension has been cleared.
        """
        create_notification(
            user=student,
            title=NotificationTemplates.SUSPENSION_LIFTED_TITLE,
            message=NotificationTemplates.SUSPENSION_LIFTED_MSG,
            link="/dashboard",
        )

    @staticmethod
    def notify_guardian_consent_required(submission, admin_users):
        """
        Notify SSW/admin users that a submission from an under-18 student
        requires guardian consent (Req 2.20).

        Args:
            submission: FormSubmission instance.
            admin_users: QuerySet or iterable of users to notify.
        """
        student_name = (
            submission.student.full_name
            if submission.student
            else "Unknown"
        )
        reference = f"APP-{submission.submitted_at.year}-{submission.id:06d}" if submission.id else "N/A"

        for user in admin_users:
            create_notification(
                user=user,
                title=NotificationTemplates.GUARDIAN_CONSENT_TITLE,
                message=NotificationTemplates.GUARDIAN_CONSENT_MSG.format(
                    student_name=student_name,
                    reference=reference,
                ),
                link=f"/staff/submissions/{submission.id}" if submission.id else "/staff/applications",
            )

    @staticmethod
    def notify_late_exception_approved(submission, director):
        """
        Notify student and admins when a Director approves a late submission
        exception (Req 2.7).

        Args:
            submission: FormSubmission instance with director_exception_approved=True.
            director: CustomUser (Director) who approved the exception.
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()

        form_title = submission.form.title if submission.form else "Unknown Form"
        student_name = submission.student.full_name if submission.student else "Unknown"
        director_name = director.full_name if director else "Unknown"

        # Notify student
        if submission.student:
            create_notification(
                user=submission.student,
                title=NotificationTemplates.LATE_EXCEPTION_STUDENT_TITLE,
                message=NotificationTemplates.LATE_EXCEPTION_STUDENT_MSG.format(
                    form_title=form_title
                ),
                link="/dashboard",
            )

        # Notify all admins
        admin_users = User.objects.filter(role='admin')
        for admin_user in admin_users:
            create_notification(
                user=admin_user,
                title=NotificationTemplates.LATE_EXCEPTION_ADMIN_TITLE,
                message=NotificationTemplates.LATE_EXCEPTION_ADMIN_MSG.format(
                    director_name=director_name,
                    student_name=student_name,
                    form_title=form_title,
                ),
                link=f"/staff/submissions/{submission.id}",
            )
