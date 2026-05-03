from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserRole(models.TextChoices):
    OWNER = 'owner', 'Owner'
    DOCTOR = 'doctor', 'Doctor'
    RECEPTIONIST = 'receptionist', 'Receptionist'
    NURSE = 'nurse', 'Nurse'
    PHARMACIST = 'pharmacist', 'Pharmacist'
    ACCOUNTANT = 'accountant', 'Accountant'
    MARKETING = 'marketing', 'Marketing'
    EMPLOYEE = 'employee', 'Employee'
    PATIENT = 'patient', 'Patient'


class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.OWNER)
        return self.create_user(username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True, null=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.PATIENT)

    # Branch FK — nullable for Owner (spans all branches) and Patient
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='staff_members'
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['first_name', 'role']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        db_table = 'users'

    def __str__(self):
        return f'{self.get_full_name()} ({self.role}) — {self.username}'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def is_owner(self):
        return self.role == UserRole.OWNER

    @property
    def is_doctor(self):
        return self.role == UserRole.DOCTOR

    @property
    def is_receptionist(self):
        return self.role == UserRole.RECEPTIONIST

    @property
    def is_employee(self):
        return self.role == UserRole.EMPLOYEE

    @property
    def is_patient(self):
        return self.role == UserRole.PATIENT
