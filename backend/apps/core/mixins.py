"""
apps/core/mixins.py — Reusable ViewSet mixins.
"""


class BranchFilterMixin:
    """
    Automatically scopes querysets to the requesting user's branch.
    Owners bypass the filter and see all branches.
    Apply to any ViewSet that is branch-scoped.
    """
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == "owner":
            return qs  # owner sees all branches
        return qs.filter(branch=user.branch)


class AuditMixin:
    """
    Injects created_by / updated_by on save (if the model supports it).
    """
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
