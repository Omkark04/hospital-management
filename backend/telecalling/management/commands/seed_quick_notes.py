from django.core.management.base import BaseCommand
from telecalling.models import QuickNote

class Command(BaseCommand):
    help = 'Seed default Quick Notes for telecalling module'

    def handle(self, *args, **kwargs):
        notes = [
            "No Answer",
            "Busy / Line Engaged",
            "Call Back Later",
            "Appointment Confirmed",
            "Wrong Number",
            "Not Interested",
            "Rescheduled Appointment"
        ]

        for text in notes:
            QuickNote.objects.get_or_create(title=text)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(notes)} Quick Notes'))
