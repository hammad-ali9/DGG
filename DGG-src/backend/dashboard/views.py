from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.contrib.auth import get_user_model
from programs.models import Program
from forms.models import FormSubmission, Form
from core.utils import api_response
from users.permissions import IsAdminUser

User = get_user_model()

class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Sum, Count
        
        # Calculate real stats from the database
        submissions = FormSubmission.objects.all()
        accepted_submissions = submissions.filter(status='accepted')
        
        # Breakdown by status
        status_counts = submissions.values('status').annotate(total=Count('id'))
        status_dict = {
            'pending': 0, 'reviewed': 0, 'forwarded': 0, 'accepted': 0, 'rejected': 0
        }
        for s in status_counts:
            status_dict[s['status']] = s['total']

        # Manual breakdown for "Stream Split" and totals per stream
        # In a real system, this would come from a 'program' field on the submission or student
        cdfn_subs = submissions.filter(form__title__icontains='FormA')
        dggr_subs = submissions.filter(form__title__icontains='Top-Up')
        ucepp_subs = submissions.filter(form__title__icontains='UCEPP')
        
        total_subs_count = submissions.count()
        stream_counts = {
            'pssp': cdfn_subs.count(), 
            'dggr': dggr_subs.count(),
            'ucepp': ucepp_subs.count(),
            'pssp_percent': (cdfn_subs.count() / total_subs_count * 100) if total_subs_count > 0 else 0,
            'dggr_percent': (dggr_subs.count() / total_subs_count * 100) if total_subs_count > 0 else 0,
            'ucepp_percent': (ucepp_subs.count() / total_subs_count * 100) if total_subs_count > 0 else 0,
        }

        stream_totals = {
            'pssp': cdfn_subs.filter(status='accepted').aggregate(total=Sum('amount'))['total'] or 0,
            'dggr': dggr_subs.filter(status='accepted').aggregate(total=Sum('amount'))['total'] or 0,
            'ucepp': ucepp_subs.filter(status='accepted').aggregate(total=Sum('amount'))['total'] or 0,
        }

        # Form B stats (Awaiting vs Received)
        # This is approximated by checking if an "accepted" submission exists without a Form B (Form B being Form 2 in our seed)
        form_b_stats = {
            'received': submissions.filter(form__title__icontains='FormB').count(),
            'awaiting': submissions.filter(form__title__icontains='FormA').count() - submissions.filter(form__title__icontains='FormB').count()
        }

        # Breakdown by form titles for specific cards
        from django.db.models.functions import Lower
        submissions_by_form = submissions.annotate(form_title=Lower('form__title')).values('form_title').annotate(count=Count('id'))
        form_stats_dict = {s['form_title']: s['count'] for s in submissions_by_form}

        stats = {
            "total_students": User.objects.filter(role='student').count(),
            "total_programs": Program.objects.all().count(),
            "total_forms": Form.objects.all().count(),
            "total_submissions": total_subs_count,
            "total_funding_approved": accepted_submissions.aggregate(total=Sum('amount'))['total'] or 0,
            "pending_funding_total": submissions.filter(status='forwarded').aggregate(total=Sum('amount'))['total'] or 0,
            "submissions_by_status": status_dict,
            "submissions_by_form": form_stats_dict,
            "stream_split": stream_counts,
            "stream_totals": stream_totals,
            "form_b_stats": form_b_stats,
            "flags_count": submissions.filter(status='forwarded').count(), 
            "recent_submissions": submissions.order_by('-submitted_at')[:10].values(
                'id', 'form__title', 'student__full_name', 'status', 'submitted_at'
            )
        }
        return api_response(True, stats, "Dashboard stats retrieved successfully")
