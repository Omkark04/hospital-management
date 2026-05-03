import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import ProductCategory

with open('categories_list.txt', 'w') as f:
    for c in ProductCategory.objects.all():
        f.write(f"{c.name}\n")
