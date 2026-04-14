"""
Production settings — extends base.py.
Reads all secrets from Railway environment variables.
"""
from .base import *  # noqa
import environ
import dj_database_url

env = environ.Env()

DEBUG = False

DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,
        conn_health_checks=True,
    )
}

SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
