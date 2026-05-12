import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import CallLog

class TelecallingExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = CallLog.objects.all()
        
        # Branch-wise filtering
        user = request.user
        if user.role == 'owner':
            qs = qs.filter(patient__branch__hospital__owner=user)
        elif hasattr(user, 'branch') and user.branch:
            qs = qs.filter(patient__branch=user.branch)

        if start_date:
            qs = qs.filter(timestamp__gte=start_date)
        if end_date:
            qs = qs.filter(timestamp__lte=end_date + " 23:59:59")

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="telecalling_logs.csv"'

        writer = csv.writer(response)
        writer.writerow(['Patient Name', 'Patient Phone', 'Caller Name', 'Call Type', 'Quick Note', 'Custom Note', 'Timestamp'])

        for log in qs:
            writer.writerow([
                log.patient.get_full_name(),
                log.patient.phone,
                log.caller.get_full_name() if log.caller else 'Unknown',
                log.get_call_type_display(),
                log.quick_note.title if log.quick_note else '',
                log.custom_note,
                log.timestamp.strftime('%Y-%m-%d %H:%M') if log.timestamp else ''
            ])
        return response
