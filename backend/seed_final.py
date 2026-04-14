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
    print("Seeding full form library...")
    
    admin = User.objects.filter(role='admin').first()
    if not admin:
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='password123',
            full_name='System Admin',
            role='admin'
        )

    program, _ = Program.objects.get_or_create(
        title='Deline Got’ı̨nę Government Education Program',
        defaults={'description': 'Primary education and student support program.', 'created_by': admin}
    )

    forms_to_seed = [
        {'title': 'FormA - New Student Application', 'purpose': 'application'},
        {'title': 'FormB - Student Profile Update', 'purpose': 'application'},
        {'title': 'FormC - Travel Assistance', 'purpose': 'application'},
        {'title': 'FormD - Specialized Training', 'purpose': 'application'},
        {'title': 'FormE - Emergency Funding', 'purpose': 'application'},
        {'title': 'FormF - Laptop & Tech Support', 'purpose': 'application'},
        {'title': 'FormG - Graduation Award', 'purpose': 'application'},
        {'title': 'FormH - Summer Student Employment', 'purpose': 'application'},
        {'title': 'Scholarship - Academic Excellence', 'purpose': 'application'},
        {'title': 'Hardship - Secondary Support', 'purpose': 'application'},
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
        # Ensure at least one field exists for the declaration
        FormField.objects.get_or_create(
            form=form,
            label='Declaration of Accuracy',
            defaults={'field_type': 'checkbox', 'is_required': True, 'order': 99}
        )
        print(f"{'Created' if created else 'Updated'} Form: {form.title}")

    print("Form library seeding complete!")

if __name__ == "__main__":
    seed()
