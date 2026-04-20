from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Profile

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed default staff, finance, and director accounts'

    def handle(self, *args, **options):
        users_to_create = [
            {
                'email': 'director@deline.ca',
                'full_name': 'DGG Director',
                'role': 'director',
                'password': 'Deline2026!'
            },
            {
                'email': 'finance@deline.ca',
                'full_name': 'DGG Finance Officer',
                'role': 'finance',
                'password': 'Deline2026!'
            },
            {
                'email': 'staff@deline.ca',
                'full_name': 'DGG Education Staff',
                'role': 'admin', # 'admin' role is used for SSWs/Staff in internalportal
                'password': 'Deline2026!'
            }
        ]

        for user_data in users_to_create:
            email = user_data['email']
            
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': user_data['full_name'],
                    'role': user_data['role'],
                }
            )
            
            user.set_password(user_data['password'])
            user.role = user_data['role']
            user.save()
            
            # Also ensure they have a profile
            Profile.objects.get_or_create(user=user)
            
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f'{status} {user_data["role"]} account: {email} with password {user_data["password"]}'))

        self.stdout.write(self.style.SUCCESS('Staff seeding complete.'))
