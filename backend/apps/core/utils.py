"""
apps/core/utils.py — Shared utility functions.
"""
import uuid
from django.utils import timezone


def generate_invoice_number(branch_code: str) -> str:
    """
    Generate a unique invoice number.
    Format: INV-<BRANCH>-<YEAR><MONTH>-<UUID4[:6]>
    Example: INV-MUM-202502-A3F9E1
    """
    now = timezone.now()
    uid = str(uuid.uuid4()).replace('-', '').upper()[:6]
    return f"INV-{branch_code.upper()}-{now.strftime('%Y%m')}-{uid}"
