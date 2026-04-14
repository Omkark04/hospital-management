"""
apps/core/models.py — Base abstract model for all domain entities.
All branch-scoped models inherit from BaseModel.
"""
import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model providing:
    - UUID primary key
    - Branch FK for multi-tenant isolation
    - Audit timestamps
    - Soft-delete via is_active
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_set",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]
