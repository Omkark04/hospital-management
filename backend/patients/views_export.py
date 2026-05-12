import csv
import io
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from .models import Patient

class PatientExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = Patient.objects.all()
        # Branch filter
        user = request.user
        if user.role == 'owner':
            qs = qs.filter(branch__hospital__owner=user)
        elif hasattr(user, 'branch') and user.branch:
            qs = qs.filter(branch=user.branch)

        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="patients_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth', 'Gender', 'Blood Group', 'Address', 'Created At'])

        for patient in qs:
            writer.writerow([
                patient.first_name,
                patient.last_name,
                patient.email,
                patient.phone,
                patient.dob,
                patient.gender,
                patient.blood_group,
                patient.address,
                patient.created_at.strftime('%Y-%m-%d %H:%M') if patient.created_at else ''
            ])
        return response

class PatientImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=400)

        if not file_obj.name.endswith('.csv'):
            return Response({'error': 'Please upload a CSV file'}, status=400)

        try:
            decoded_file = file_obj.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            branch = request.user.branch if hasattr(request.user, 'branch') else None

            created_count = 0
            updated_count = 0

            for row in reader:
                phone = row.get('Phone', '').strip()
                if not phone:
                    continue

                defaults = {
                    'first_name': row.get('First Name', '').strip(),
                    'last_name': row.get('Last Name', '').strip(),
                    'email': row.get('Email', '').strip() or None,
                    'gender': row.get('Gender', '').strip() or None,
                    'blood_group': row.get('Blood Group', '').strip() or None,
                    'address': row.get('Address', '').strip(),
                }
                
                # If creating new, assign branch if available
                patient_exists = Patient.objects.filter(phone=phone).exists()
                if not patient_exists and branch:
                    defaults['branch'] = branch

                patient, created = Patient.objects.update_or_create(
                    phone=phone,
                    defaults=defaults
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

            return Response({
                'message': f'Successfully imported data. {created_count} created, {updated_count} updated.'
            })

        except Exception as e:
            return Response({'error': f'Error processing file: {str(e)}'}, status=400)
