"""
Seed script for PolicySetting records
Run with: python manage.py shell < seed_policy_settings.py
"""

from decimal import Decimal
from api.models import PolicySetting

def seed_policy_settings():
    """Seed default PolicySetting records for all living allowance rates, tuition caps, and credential amounts"""
    
    settings_data = [
        # Living Allowance Rates - PSSSP
        {
            'key': 'living_allowance_psssp_ft_single',
            'setting_type': 'living_allowance',
            'value': Decimal('1200.00'),
            'stream': 'PSSSP',
            'status': 'FT',
            'dependent_count': 0,
            'description': 'PSSSP Full-Time Single Student Living Allowance'
        },
        {
            'key': 'living_allowance_psssp_ft_dependents',
            'setting_type': 'living_allowance',
            'value': Decimal('1800.00'),
            'stream': 'PSSSP',
            'status': 'FT',
            'dependent_count': 1,
            'description': 'PSSSP Full-Time Student with Dependents Living Allowance'
        },
        {
            'key': 'living_allowance_psssp_pt_single',
            'setting_type': 'living_allowance',
            'value': Decimal('800.00'),
            'stream': 'PSSSP',
            'status': 'PT',
            'dependent_count': 0,
            'description': 'PSSSP Part-Time Single Student Living Allowance'
        },
        {
            'key': 'living_allowance_psssp_pt_dependents',
            'setting_type': 'living_allowance',
            'value': Decimal('1200.00'),
            'stream': 'PSSSP',
            'status': 'PT',
            'dependent_count': 1,
            'description': 'PSSSP Part-Time Student with Dependents Living Allowance'
        },
        
        # Living Allowance Rates - UCEPP
        {
            'key': 'living_allowance_ucepp_ft',
            'setting_type': 'living_allowance',
            'value': Decimal('1000.00'),
            'stream': 'UCEPP',
            'status': 'FT',
            'description': 'UCEPP Full-Time Living Allowance'
        },
        {
            'key': 'living_allowance_ucepp_pt',
            'setting_type': 'living_allowance',
            'value': Decimal('600.00'),
            'stream': 'UCEPP',
            'status': 'PT',
            'description': 'UCEPP Part-Time Living Allowance'
        },
        
        # Tuition Caps
        {
            'key': 'tuition_cap_psssp',
            'setting_type': 'tuition_cap',
            'value': Decimal('5000.00'),
            'stream': 'PSSSP',
            'description': 'PSSSP Tuition Cap'
        },
        {
            'key': 'tuition_cap_ucepp',
            'setting_type': 'tuition_cap',
            'value': Decimal('2000.00'),
            'stream': 'UCEPP',
            'description': 'UCEPP Tuition Cap (Upgrading Programs)'
        },
        
        # Credential Award Amounts (Form E - Graduation Awards)
        {
            'key': 'credential_high_school_diploma',
            'setting_type': 'credential_amount',
            'value': Decimal('500.00'),
            'credential_type': 'High School Diploma',
            'description': 'Graduation Award for High School Diploma'
        },
        {
            'key': 'credential_certificate',
            'setting_type': 'credential_amount',
            'value': Decimal('1000.00'),
            'credential_type': 'Certificate',
            'description': 'Graduation Award for Certificate'
        },
        {
            'key': 'credential_trades_certificate',
            'setting_type': 'credential_amount',
            'value': Decimal('2000.00'),
            'credential_type': 'Trades Certificate of Qualification',
            'description': 'Graduation Award for Trades Certificate of Qualification'
        },
        {
            'key': 'credential_trades_journeyperson',
            'setting_type': 'credential_amount',
            'value': Decimal('3000.00'),
            'credential_type': 'Trades Journeyperson Licence',
            'description': 'Graduation Award for Trades Journeyperson Licence'
        },
        {
            'key': 'credential_diploma',
            'setting_type': 'credential_amount',
            'value': Decimal('2000.00'),
            'credential_type': 'Diploma',
            'description': 'Graduation Award for Diploma'
        },
        {
            'key': 'credential_pilot_licence',
            'setting_type': 'credential_amount',
            'value': Decimal('3000.00'),
            'credential_type': 'Professional Pilot Licence',
            'description': 'Graduation Award for Professional Pilot Licence'
        },
        {
            'key': 'credential_red_seal',
            'setting_type': 'credential_amount',
            'value': Decimal('3000.00'),
            'credential_type': 'Red Seal',
            'description': 'Graduation Award for Red Seal'
        },
        {
            'key': 'credential_bachelor',
            'setting_type': 'credential_amount',
            'value': Decimal('3000.00'),
            'credential_type': "Bachelor's Degree",
            'description': "Graduation Award for Bachelor's Degree"
        },
        {
            'key': 'credential_master',
            'setting_type': 'credential_amount',
            'value': Decimal('5000.00'),
            'credential_type': "Master's Degree",
            'description': "Graduation Award for Master's Degree"
        },
        {
            'key': 'credential_doctorate',
            'setting_type': 'credential_amount',
            'value': Decimal('5000.00'),
            'credential_type': 'Doctorate (PhD)',
            'description': 'Graduation Award for Doctorate (PhD)'
        },
        {
            'key': 'credential_juris_doctor',
            'setting_type': 'credential_amount',
            'value': Decimal('5000.00'),
            'credential_type': 'Juris Doctor / Bachelor of Laws',
            'description': 'Graduation Award for Juris Doctor / Bachelor of Laws'
        },
        {
            'key': 'credential_medical',
            'setting_type': 'credential_amount',
            'value': Decimal('5000.00'),
            'credential_type': 'MD or DDS',
            'description': 'Graduation Award for MD or DDS'
        },
        
        # Budget Caps
        {
            'key': 'dggr_extra_tuition_annual_cap',
            'setting_type': 'budget_cap',
            'value': Decimal('36000.00'),
            'stream': 'DGGR',
            'description': 'DGGR Extra Tuition Annual Cap (Fiscal Year: April 1 - March 31)'
        },
        {
            'key': 'graduation_travel_bursary_cap',
            'setting_type': 'budget_cap',
            'value': Decimal('5000.00'),
            'description': 'Graduation Travel Bursary Cap'
        },
    ]
    
    created_count = 0
    updated_count = 0
    
    for setting_data in settings_data:
        setting, created = PolicySetting.objects.update_or_create(
            key=setting_data['key'],
            defaults={
                'setting_type': setting_data['setting_type'],
                'value': setting_data['value'],
                'stream': setting_data.get('stream'),
                'status': setting_data.get('status'),
                'dependent_count': setting_data.get('dependent_count'),
                'credential_type': setting_data.get('credential_type'),
                'description': setting_data.get('description', ''),
                'is_active': True,
            }
        )
        
        if created:
            created_count += 1
            print(f"✓ Created: {setting_data['key']} = ${setting_data['value']}")
        else:
            updated_count += 1
            print(f"✓ Updated: {setting_data['key']} = ${setting_data['value']}")
    
    print(f"\n✓ Seed complete: {created_count} created, {updated_count} updated")
    return created_count, updated_count


if __name__ == '__main__':
    seed_policy_settings()
