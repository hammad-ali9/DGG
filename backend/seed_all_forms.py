import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from programs.models import Program
from forms.models import Form, FormField

User = get_user_model()

def seed():
    print("Seeding full form library (A-H + Specialized)...")
    
    # 1. Ensure Admin exists
    admin = User.objects.filter(role='admin').first()
    if not admin:
        admin = User.objects.create_superuser(
            email='staff@deline.ca',
            password='Deline2026!',
            full_name='System Admin',
            role='admin'
        )
        print("Created default admin.")

    # 2. Ensure Program exists
    program, _ = Program.objects.get_or_create(
        title='Deline Got’ı̨nę Government Education Program',
        defaults={
            'description': 'Primary education and student support program.',
            'created_by': admin
        }
    )

    # 3. Define Form Library
    # The titles must be inclusive of the "FormX" code so the frontend fuzzy-matching works.
    forms_to_seed = [
        {'title': 'FormA - Admission & New Student Application', 'purpose': 'application'},
        {'title': 'FormC - Continuing Student Application', 'purpose': 'application'},
        {'title': 'FormD - Change of Circumstances', 'purpose': 'application'},
        {'title': 'FormE - Graduation Award Application', 'purpose': 'application'},
        {'title': 'FormF - Practicum Report & Award', 'purpose': 'application'},
        {'title': 'FormG - Travel Claim Submission', 'purpose': 'application'},
        {'title': 'FormGTB - Graduation Travel Bursary', 'purpose': 'application'},
        {'title': 'FormH - Appeal Submission', 'purpose': 'application'},
        {'title': 'Academic Scholarship Application', 'purpose': 'application'},
        {'title': 'Hardship Bursary Application', 'purpose': 'application'},
    ]

    for f_data in forms_to_seed:
        form, created = Form.objects.update_or_create(
            title=f_data['title'],
            program=program,
            defaults={
                'purpose': f_data['purpose'],
                'created_by': admin,
                'is_active': True
            }
        )
        
        # Ensure at least a declaration field exists
        FormField.objects.get_or_create(
            form=form,
            label='Declaration of Accuracy',
            defaults={'field_type': 'checkbox', 'is_required': True, 'order': 99}
        )
        print(f"{'Created' if created else 'Updated'} Form: {form.title}")

    print("Form library seeding complete!")

if __name__ == "__main__":
    seed()
