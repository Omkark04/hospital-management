from django.db import models


class Hospital(models.Model):
    name = models.CharField(max_length=200)
    owner = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.CASCADE,
        related_name='hospitals',
        limit_choices_to={'role': 'owner'}
    )
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    logo_url = models.URLField(blank=True)  # Cloudinary URL (set later)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Hospital'
        verbose_name_plural = 'Hospitals'
        db_table = 'hospitals'

    def __str__(self):
        return self.name


class Branch(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=200)
    address = models.TextField()
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Branch'
        verbose_name_plural = 'Branches'
        db_table = 'branches'
        unique_together = ('hospital', 'name')

    def __str__(self):
        return f'{self.name} — {self.hospital.name}'

    @property
    def code(self):
        """Short branch code used for UHID generation."""
        return self.name[:3].upper()


class BranchService(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Branch Service'
        verbose_name_plural = 'Branch Services'
        db_table = 'branch_services'

    def __str__(self):
        return f'{self.name} @ {self.branch.name}'
