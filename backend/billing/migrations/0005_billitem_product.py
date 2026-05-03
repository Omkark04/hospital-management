from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0004_bill_pdf_url'),
        ('products', '0004_product_for_patients_product_for_public'),
    ]

    operations = [
        migrations.AddField(
            model_name='billitem',
            name='product',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='bill_items', to='products.product'),
        ),
    ]
