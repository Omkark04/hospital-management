import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from users.models import CustomUser, UserRole

try:
    user = CustomUser.objects.get(id=1)
    print(f"User 1 role was: {user.role}")
    user.role = UserRole.OWNER
    user.save()
    print(f"User 1 role is now: {user.role}")
except Exception as e:
    print("Error:", e)
