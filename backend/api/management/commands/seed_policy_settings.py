"""Django management command to seed PolicySetting records"""
from django.core.management.base import BaseCommand
from api.models import PolicySetting


class Command(BaseCommand):
    help = 'Seed default PolicySetting records for DGG policy configuration'

    def handle(self, *args, **options):
        settings_data = [
            # Application Deadlines
            {
                'key': 'deadline_fall', 'category': 'application_deadlines', 'field_label': 'Fall Semester Deadline',
                'field_key': 'fall_deadline', 'value': 'May 1', 'unit': 'date', 'setting_type': 'deadline'
            },
            {
                'key': 'deadline_winter', 'category': 'application_deadlines', 'field_label': 'Winter Semester Deadline',
                'field_key': 'winter_deadline', 'value': 'July 15', 'unit': 'date', 'setting_type': 'deadline'
            },
            
            # PSSSP - Tuition
            {
                'key': 'psssp_tuition_max', 'category': 'psssp_tuition', 'field_label': 'Maximum Tuition Per Semester',
                'field_key': 'max_per_semester', 'value': '5000', 'unit': '$', 'setting_type': 'tuition_cap', 'stream': 'PSSSP'
            },
            
            # PSSSP - Living Allowance
            {
                'key': 'psssp_living_ft_nodep', 'category': 'psssp_living', 'field_label': 'Full-Time (No Dependents)',
                'field_key': 'fulltime_no_dependents', 'value': '1200', 'unit': '$/mo', 'setting_type': 'living_allowance', 'stream': 'PSSSP'
            },
            {
                'key': 'psssp_living_ft_dep', 'category': 'psssp_living', 'field_label': 'Full-Time (With Dependents)',
                'field_key': 'fulltime_with_dependents', 'value': '1800', 'unit': '$/mo', 'setting_type': 'living_allowance', 'stream': 'PSSSP'
            },
            
            # DGGR - Living Allowance
            {
                'key': 'dggr_living_ft_nodep', 'category': 'dggr_living', 'field_label': 'Full-Time (No Dependents)',
                'field_key': 'fulltime_no_dependents', 'value': '1000', 'unit': '$/mo', 'setting_type': 'living_allowance', 'stream': 'DGGR'
            },
            
            # DGGR - Graduation Bursary
            {
                'key': 'dggr_grad_bachelor', 'category': 'dggr_grad_bursary', 'field_label': "Bachelor's Degree Award",
                'field_key': 'bachelor_degree', 'value': '3000', 'unit': '$', 'setting_type': 'credential_amount', 'stream': 'DGGR'
            },
            {
                'key': 'dggr_grad_masters', 'category': 'dggr_grad_bursary', 'field_label': "Master's Degree Award",
                'field_key': 'masters_degree', 'value': '5000', 'unit': '$', 'setting_type': 'credential_amount', 'stream': 'DGGR'
            },

            # DGGR - Extra Tuition
            {
                'key': 'dggr_extra_tuition_max', 'category': 'dggr_extra_tuition', 'field_label': 'Maximum Extra Tuition Coverage',
                'field_key': 'max_per_semester', 'value': '5000', 'unit': '$', 'setting_type': 'tuition_cap', 'stream': 'DGGR'
            },
            {
                'key': 'dggr_extra_tuition_threshold', 'category': 'dggr_extra_tuition', 'field_label': 'Threshold for Extra Coverage',
                'field_key': 'threshold_per_semester', 'value': '3000', 'unit': '$', 'setting_type': 'tuition_cap', 'stream': 'DGGR'
            },
            
            # System Config
            {
                'key': 'system_finance_email', 'category': 'system_config', 'field_label': 'Finance Dept Email',
                'field_key': 'finance_email', 'value': 'finance@deline.ca', 'unit': 'email', 'setting_type': 'budget_cap'
            }
        ]
        
        created_count = 0
        updated_count = 0
        
        for data in settings_data:
            setting, created = PolicySetting.objects.update_or_create(
                key=data['key'],
                defaults={
                    'category': data.get('category'),
                    'field_label': data.get('field_label'),
                    'field_key': data.get('field_key'),
                    'value': data['value'],
                    'unit': data.get('unit', ''),
                    'setting_type': data['setting_type'],
                    'stream': data.get('stream'),
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Seed complete: {created_count} created, {updated_count} updated'))
