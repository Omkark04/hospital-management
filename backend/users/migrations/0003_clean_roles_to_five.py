# Generated manually — restrict role choices to exactly 5 roles
# and convert any legacy roles to 'employee'

from django.db import migrations, models


def convert_legacy_roles(apps, schema_editor):
    """Convert any users with removed roles (nurse, pharmacist, accountant, marketing) to 'employee'."""
    CustomUser = apps.get_model('users', 'CustomUser')
    legacy_roles = ['nurse', 'pharmacist', 'accountant', 'marketing']
    updated = CustomUser.objects.filter(role__in=legacy_roles).update(role='employee')
    if updated:
        print(f"Converted {updated} users with legacy roles to 'employee'.")


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_customuser_role'),
    ]

    operations = [
        # Step 1: convert any leftover legacy roles to 'employee'
        migrations.RunPython(convert_legacy_roles, migrations.RunPython.noop),

        # Step 2: restrict the field choices to 5 roles
        migrations.AlterField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('owner', 'Owner'),
                    ('doctor', 'Doctor'),
                    ('receptionist', 'Receptionist'),
                    ('employee', 'Employee'),
                    ('patient', 'Patient'),
                ],
                default='patient',
                max_length=20,
            ),
        ),
    ]
