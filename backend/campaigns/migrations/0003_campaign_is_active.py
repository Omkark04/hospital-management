from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaign',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
