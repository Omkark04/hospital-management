from django.core.management.base import BaseCommand
from patients.models import Department, Treatment

class Command(BaseCommand):
    help = 'Seed default Departments and Treatments matching the local dev database'

    def handle(self, *args, **kwargs):
        data = {
            "Spine & Joint Treatments": [
                "Back Pain (Lower & Upper)",
                "Slip Disc (Disc Bulge / Herniation)",
                "Sciatica Pain",
                "Neck Pain (Cervical Spondylosis)",
                "Shoulder Pain (Frozen Shoulder)",
                "Knee Pain (Gap, Swelling, Stiffness)",
                "Ligament Injuries (ACL / PCL)",
                "Difficulty in Walking / Bending"
            ],
            "Ayurvedic Therapies": [
                "Janu Basti — Knee Therapy",
                "Kati Basti — Back Therapy",
                "Snehan — Oil Massage Therapy",
                "Potli Therapy",
                "Lep Therapy",
                "Steam Therapy"
            ],
            "Sujok Therapy": [
                "Pain Management through Sujok",
                "Spine & Joint Specific Sujok",
                "Non-Invasive Drug-Free Therapy"
            ],
            "Advanced Therapy Support": [
                "Electric Stimulation Therapy",
                "Chiropractic Gun Therapy",
                "Dual Head Hammer Massage",
                "Crazy Fit Machine Therapy",
                "Full Body Massage Chair Relaxation"
            ],
            "Counseling & Lifestyle Guidance": [
                "Pain Management Counseling",
                "Posture Correction Guidance",
                "Lifestyle Modification Advice"
            ],
            "General Ayurveda": [
                "General Checkup"
            ]
        }

        created_depts = 0
        created_treats = 0

        for dept_name, treatments in data.items():
            dept, created = Department.objects.get_or_create(
                name=dept_name,
                defaults={"description": f"Default treatments for {dept_name}"}
            )
            if created:
                created_depts += 1
            
            for treat_name in treatments:
                _, t_created = Treatment.objects.get_or_create(
                    department=dept,
                    name=treat_name,
                    defaults={"description": f"Default treatment: {treat_name}"}
                )
                if t_created:
                    created_treats += 1

        self.stdout.write(self.style.SUCCESS(
            f'Seeding finished. Created {created_depts} departments and {created_treats} treatments.'
        ))
