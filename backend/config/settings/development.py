"""
Development settings — extends base.py.
Reads DATABASE_URL from .env.
"""
from .base import *  # noqa
import environ

env = environ.Env()
environ.Env.read_env()

DEBUG = True

ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": env.db("DATABASE_URL", default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}")
}

# Django Debug Toolbar (optional)
INSTALLED_APPS += ["debug_toolbar"]  # noqa
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa
INTERNAL_IPS = ["127.0.0.1"]

CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
