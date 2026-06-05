from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from users.models import CustomUser, UserRole
from branches.models import Hospital, Branch
from patients.models import Patient
import io
import csv
import openpyxl

class PatientImportExportTests(APITestCase):
    def setUp(self):
        # 1. Create a Hospital Owner
        self.owner = CustomUser.objects.create_user(
            username='owner_user',
            password='password123',
            first_name='Owner',
            last_name='User',
            role=UserRole.OWNER
        )

        # 2. Create a Hospital
        self.hospital = Hospital.objects.create(
            name='Test Hospital',
            owner=self.owner
        )

        # 3. Create a Branch
        self.branch = Branch.objects.create(
            hospital=self.hospital,
            name='Main Branch',
            address='123 Test Street'
        )

        # 4. Create a Receptionist
        self.receptionist = CustomUser.objects.create_user(
            username='receptionist_user',
            password='password123',
            first_name='Receptionist',
            last_name='User',
            role=UserRole.RECEPTIONIST,
            branch=self.branch
        )

        self.import_url = reverse('patient-import')
        self.export_url = reverse('patient-export')
        
        # Authenticate client
        self.client.force_authenticate(user=self.receptionist)

    def test_csv_import_success(self):
        # Create CSV content
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow([
            'Patient Name', 'M/F', 'Age', 'Mobile Number', 'Address', 
            'Medicine', 'Diagnosis/Problem', 'Refer By', 'Duration of Pain'
        ])
        writer.writerow([
            'PURUSHOTTAM JADHAV', 'M', '45', '9876543210', 'Pune, Maharashtra',
            'Aspirin 75mg', 'Chronic Back Pain', 'Dr. Mahesh', '6 months'
        ])
        
        csv_file = SimpleUploadedFile(
            "test_patients.csv", 
            csv_buffer.getvalue().encode('utf-8'), 
            content_type="text/csv"
        )

        response = self.client.post(self.import_url, {'file': csv_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 1)
        self.assertEqual(response.data['updated'], 0)

        # Retrieve created patient
        patient = Patient.objects.get(phone='9876543210', branch=self.branch)
        self.assertEqual(patient.first_name, 'Purushottam')
        self.assertEqual(patient.last_name, 'Jadhav')
        self.assertEqual(patient.gender, 'male')
        self.assertEqual(patient.address, 'Pune, Maharashtra')
        self.assertEqual(patient.medical_history, 'Aspirin 75mg')
        self.assertIn('Chronic Back Pain', patient.chief_complaint)
        self.assertIn('Duration: 6 months', patient.chief_complaint)
        self.assertEqual(patient.referral_source, 'Dr. Mahesh')
        # Calculated DOB from age 45
        self.assertIsNotNone(patient.dob)
        self.assertEqual(patient.dob.year, Patient.objects.first().created_at.year - 45)

    def test_excel_import_success(self):
        # Create Excel workbook in memory
        wb = openpyxl.Workbook()
        ws = wb.active
        
        # Headers
        headers = [
            'Patient Name', 'M/F', 'Age', 'Mobile Number', 'Address', 
            'Medicine', 'Diagnosis/Problem', 'Refer By', 'Duration of Pain'
        ]
        ws.append(headers)
        
        # Row data
        row_data = [
            'SHUBHAM SHARMA', 'Male', '30', '9876543211', 'Mumbai',
            'Paracetamol', 'Fever', 'Self', '2 days'
        ]
        ws.append(row_data)
        
        excel_buffer = io.BytesIO()
        wb.save(excel_buffer)
        excel_buffer.seek(0)

        excel_file = SimpleUploadedFile(
            "test_patients.xlsx", 
            excel_buffer.getvalue(), 
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        response = self.client.post(self.import_url, {'file': excel_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 1)
        self.assertEqual(response.data['updated'], 0)

        # Retrieve patient
        patient = Patient.objects.get(phone='9876543211', branch=self.branch)
        self.assertEqual(patient.first_name, 'Shubham')
        self.assertEqual(patient.last_name, 'Sharma')
        self.assertEqual(patient.gender, 'male')
        self.assertEqual(patient.medical_history, 'Paracetamol')
        self.assertIn('Fever', patient.chief_complaint)
        self.assertIn('Duration: 2 days', patient.chief_complaint)

    def test_import_updates_existing_patient(self):
        # Create a patient first
        existing_patient = Patient.objects.create(
            first_name='Rahul',
            last_name='Kumar',
            phone='9876543212',
            gender='male',
            branch=self.branch,
            registered_by=self.receptionist,
            address='Old Address'
        )

        # Import update via CSV
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        writer.writerow(['Patient Name', 'Mobile Number', 'Address', 'Diagnosis/Problem'])
        writer.writerow(['Rahul Kumar New', '9876543212', 'New Address Info', 'High BP'])

        csv_file = SimpleUploadedFile(
            "update_patients.csv", 
            csv_buffer.getvalue().encode('utf-8'), 
            content_type="text/csv"
        )

        response = self.client.post(self.import_url, {'file': csv_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 0)
        self.assertEqual(response.data['updated'], 1)

        # Verify details were updated and not duplicated
        self.assertEqual(Patient.objects.filter(phone='9876543212', branch=self.branch).count(), 1)
        
        updated_patient = Patient.objects.get(phone='9876543212', branch=self.branch)
        self.assertEqual(updated_patient.first_name, 'Rahul')
        self.assertEqual(updated_patient.last_name, 'Kumar New')
        self.assertEqual(updated_patient.address, 'New Address Info')
        self.assertEqual(updated_patient.chief_complaint, 'High BP')

    def test_export_patients(self):
        # Create a test patient
        Patient.objects.create(
            first_name='Amit',
            last_name='Singh',
            phone='9876543213',
            gender='male',
            branch=self.branch,
            registered_by=self.receptionist,
            chief_complaint='Headache',
            referral_source='Google'
        )

        response = self.client.get(self.export_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="patients_export.csv"', response['Content-Disposition'])

        # Read exported CSV contents
        content = response.content.decode('utf-8')
        lines = content.split('\r\n')
        
        # Verify header is present and contains referral source
        headers = lines[0].split(',')
        self.assertIn('Referral Source', headers)
        self.assertIn('Chief Complaint', headers)

        # Verify row contents
        found_patient = False
        for line in lines[1:]:
            if '9876543213' in line:
                found_patient = True
                self.assertIn('Amit', line)
                self.assertIn('Singh', line)
                self.assertIn('Headache', line)
                self.assertIn('Google', line)
        self.assertTrue(found_patient)
