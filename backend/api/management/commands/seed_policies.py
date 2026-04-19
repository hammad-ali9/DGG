from django.core.management.base import BaseCommand
from api.models import PolicySetting
from decimal import Decimal

class Command(BaseCommand):
    help = 'Seeds initial policy settings for DGG Scholarship Portal'

    def handle(self, *args, **options):
        policies = [
            # Tuition Caps
            {'key': 'psssp_tuition_cap', 'setting_type': 'tuition_cap', 'value': 5000.00, 'stream': 'PSSSP', 'description': 'Annual tuition cap for PSSSP'},
            {'key': 'ucepp_tuition_cap', 'setting_type': 'tuition_cap', 'value': 3500.00, 'stream': 'UCEPP', 'description': 'Annual tuition cap for UCEPP'},
            {'key': 'dggr_tuition_cap', 'setting_type': 'tuition_cap', 'value': 7500.00, 'stream': 'DGGR', 'description': 'Annual tuition cap for DGGR'},
            
            # Living Allowances (Monthly)
            {'key': 'living_allowance_single', 'setting_type': 'living_allowance', 'value': 1200.00, 'status': 'FT', 'dependent_count': 0, 'description': 'Monthly allowance for single student'},
            {'key': 'living_allowance_1_dep', 'setting_type': 'living_allowance', 'value': 1500.00, 'status': 'FT', 'dependent_count': 1, 'description': 'Monthly allowance with 1 dependent'},
            {'key': 'living_allowance_2_dep', 'setting_type': 'living_allowance', 'value': 1750.00, 'status': 'FT', 'dependent_count': 2, 'description': 'Monthly allowance with 2 dependents'},
            
            # Credential Graduation Awards
            {'key': 'grad_award_certificate', 'setting_type': 'credential_amount', 'value': 1000.00, 'credential_type': 'Certificate', 'description': 'Award for Certificate completion'},
            {'key': 'grad_award_diploma', 'setting_type': 'credential_amount', 'value': 2000.00, 'credential_type': 'Diploma', 'description': 'Award for Diploma completion'},
            {'key': 'grad_award_degree', 'setting_type': 'credential_amount', 'value': 3500.00, 'credential_type': 'Bachelor\'s Degree', 'description': 'Award for Degree completion'},
            {'key': 'grad_award_masters', 'setting_type': 'credential_amount', 'value': 5000.00, 'credential_type': 'Master\'s Degree', 'description': 'Award for Master\'s completion'},
            
            # Deadlines (Days before start etc - or fixed dates)
            {'key': 'fall_deadline_days', 'setting_type': 'deadline', 'value': 45.00, 'description': 'Days before Fall semester to apply'},
            {'key': 'winter_deadline_days', 'setting_type': 'deadline', 'value': 30.00, 'description': 'Days before Winter semester to apply'},
        ]

        for p_data in policies:
            obj, created = PolicySetting.objects.update_or_create(
                key=p_data['key'],
                defaults=p_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created policy: {p_data['key']}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated policy: {p_data['key']}"))

        self.stdout.write(self.style.SUCCESS('Successfully seeded all policies'))
