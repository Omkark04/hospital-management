from django.db import models
from patients.models import Patient
from users.models import CustomUser

class QuickNote(models.Model):
    title = models.CharField(max_length=100)
    text = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Quick Note'
        verbose_name_plural = 'Quick Notes'
        db_table = 'telecalling_quick_notes'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class CallTypeChoices(models.TextChoices):
    CALL = 'call', 'Call'
    WHATSAPP = 'whatsapp', 'WhatsApp'
    SMS = 'sms', 'SMS'
    NOTE = 'note', 'Note'

class CallLog(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='call_logs')
    caller = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='made_calls')
    call_type = models.CharField(max_length=15, choices=CallTypeChoices.choices, default=CallTypeChoices.CALL)
    quick_note = models.ForeignKey(QuickNote, on_delete=models.SET_NULL, null=True, blank=True)
    custom_note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Call Log'
        verbose_name_plural = 'Call Logs'
        db_table = 'telecalling_call_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.call_type.capitalize()} to {self.patient.get_full_name()} by {self.caller.get_full_name() if self.caller else "Unknown"}'
