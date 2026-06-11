from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.template.loader import get_template
import zipfile
from io import BytesIO
from xhtml2pdf import pisa
from storage.dropbox_service import upload_file, get_shared_link, delete_file, download_file, get_space_usage

from users.permissions import IsOwnerOrDoctorOrReceptionist, IsPatient, IsOwner
from users.models import UserRole
from .models import Bill
from .serializers import BillSerializer, PaymentUpdateSerializer


def branch_qs(qs, user):
    if user.role == UserRole.OWNER:
        from branches.models import Branch
        ids = Branch.objects.filter(hospital__owner=user).values_list('id', flat=True)
        return qs.filter(branch_id__in=ids)
    return qs.filter(branch=user.branch)


class BillListCreateView(generics.ListCreateAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        qs = Bill.objects.all()
        qs = branch_qs(qs, self.request.user)
        
        # Search by patient name, phone, or UHID
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(patient__first_name__icontains=search) |
                Q(patient__last_name__icontains=search) |
                Q(patient__phone__icontains=search) |
                Q(patient__uhid__icontains=search)
            ).distinct()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(payment_status=status_filter)
            
        # Filter by Udhari (is_udhari=True)
        udhari_filter = self.request.query_params.get('is_udhari')
        if udhari_filter:
            if udhari_filter.lower() == 'true':
                qs = qs.filter(is_udhari=True)
            elif udhari_filter.lower() == 'false':
                qs = qs.filter(is_udhari=False)

        # Filter by Udhari due date
        udhari_due_date = self.request.query_params.get('udhari_due_date')
        if udhari_due_date:
            qs = qs.filter(udhari_due_date=udhari_due_date)

        # Filter by date range (created_after/created_before on created_at)
        created_after = self.request.query_params.get('created_after')
        if created_after:
            qs = qs.filter(created_at__date__gte=created_after)
        created_before = self.request.query_params.get('created_before')
        if created_before:
            qs = qs.filter(created_at__date__lte=created_before)

        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
            
        # Filter by branch (Owner only)
        branch_id = self.request.query_params.get('branch')
        if branch_id and self.request.user.role == UserRole.OWNER:
            qs = qs.filter(branch_id=branch_id)

        # Ordering (default is -created_at)
        ordering = self.request.query_params.get('ordering')
        if ordering:
            valid_orderings = ('created_at', '-created_at', 'total_amount', '-total_amount')
            if ordering in valid_orderings:
                qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')
            
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BillDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def get_queryset(self):
        return branch_qs(Bill.objects.all(), self.request.user)

    def perform_update(self, serializer):
        # Clear old PDF URL when bill is updated to force regeneration
        serializer.save(pdf_url="")


class PaymentUpdateView(APIView):
    """Quick endpoint to update payment amount only (Receptionist workflow)."""
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def patch(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PaymentUpdateSerializer(bill, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # If the bill is now paid, clear the old PDF URL to force regeneration
        if bill.payment_status == 'paid':
            bill.pdf_url = ""
            bill.save()
            
        return Response(BillSerializer(bill).data)


class MyBillsView(generics.ListAPIView):
    """Patient views their own bills."""
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsPatient]

    def get_queryset(self):
        return Bill.objects.filter(patient__phone=self.request.user.phone)


class BillPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)

        force_refresh = request.query_params.get('refresh') == 'true'
        direct_download = request.query_params.get('download') == 'true'
        uhid = getattr(bill.patient, 'uhid', 'unknown')
        filename = f"bill_{bill.id}_{uhid}.pdf"
        dropbox_path = f"/hms/bills/{filename}"

        if force_refresh and bill.pdf_url:
            delete_file(dropbox_path)
            bill.pdf_url = ""
            bill.save()

        # Serve raw binary PDF if direct download is requested
        if direct_download and bill.pdf_url and not force_refresh:
            file_bytes = download_file(dropbox_path)
            if file_bytes:
                response = HttpResponse(file_bytes, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response

        if bill.pdf_url and not force_refresh:
            return Response({'pdf_url': bill.pdf_url})

        # Render HTML to PDF
        template = get_template('billing/invoice.html')
        html = template.render({'bill': bill})
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)

        if not pdf.err:
            pdf_bytes = result.getvalue()
            upload_result = upload_file(pdf_bytes, dropbox_path)
            
            if upload_result:
                shared_link = get_shared_link(dropbox_path)
                if shared_link:
                    final_link = shared_link.replace('?dl=0', '?dl=1')
                    bill.pdf_url = final_link
                    bill.save()

            if direct_download:
                response = HttpResponse(pdf_bytes, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response

            return Response({'pdf_url': bill.pdf_url or ""})

        return Response({'detail': 'Error generating PDF.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BulkInvoiceManagementView(APIView):
    """Owner endpoint to bulk download or delete Dropbox PDF invoices with filters."""
    permission_classes = [IsAuthenticated, IsOwner]

    def _get_filtered_queryset(self, request):
        branch_id = request.query_params.get('branch')
        date_param = request.query_params.get('date')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = Bill.objects.exclude(pdf_url="")
        if branch_id:
            qs = qs.filter(branch_id=branch_id)
        if date_param:
            qs = qs.filter(created_at__date=date_param)
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)
        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
        return qs

    def get(self, request):
        action = request.query_params.get('action', 'download')

        if action == 'usage':
            usage_data = get_space_usage()
            if usage_data is not None:
                return Response(usage_data)
            return Response({'detail': 'Dropbox is not configured or usage check failed.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        qs = self._get_filtered_queryset(request)

        if action == 'delete':
            return self.delete(request)

        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            added_files = 0
            for bill in qs:
                # Deduce expected file name on Dropbox
                uhid = getattr(bill.patient, 'uhid', 'unknown')
                filename = f"bill_{bill.id}_{uhid}.pdf"
                dropbox_path = f"/hms/bills/{filename}"
                file_bytes = download_file(dropbox_path)
                if file_bytes:
                    zip_file.writestr(filename, file_bytes)
                    added_files += 1

        if added_files == 0:
            return Response(
                {'detail': 'No matching invoice PDFs found in Dropbox for the selected filters.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        zip_buffer.seek(0)
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="bulk_invoices.zip"'
        return response

    def delete(self, request):
        qs = self._get_filtered_queryset(request)
        count = 0
        for bill in qs:
            uhid = getattr(bill.patient, 'uhid', 'unknown')
            filename = f"bill_{bill.id}_{uhid}.pdf"
            dropbox_path = f"/hms/bills/{filename}"
            delete_file(dropbox_path)
            bill.pdf_url = ""
            bill.save()
            count += 1
        return Response({'detail': f'Successfully deleted {count} invoice PDFs from Dropbox.'})


class BillSendReminderView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrDoctorOrReceptionist]

    def post(self, request, pk):
        try:
            bill = Bill.objects.select_related('patient', 'branch').get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)

        balance = bill.balance_due
        if balance <= 0:
            bill.is_udhari = False
            bill.save()
            return Response({'detail': 'This bill is already fully paid.'}, status=status.HTTP_400_BAD_REQUEST)

        patient = bill.patient
        branch = bill.branch
        due_str = bill.udhari_due_date.strftime('%d-%b-%Y') if bill.udhari_due_date else 'N/A'
        
        # WhatsApp link
        raw_phone = patient.phone or ""
        phone = "".join(c for c in raw_phone if c.isdigit())
        clean_phone = f"91{phone}" if len(phone) == 10 else phone
        wa_text = f"Hi {patient.get_full_name()}, this is a friendly reminder that an outstanding payment of Rs. {balance} is due on {due_str} for your bill #{bill.id} at {branch.name}. Thank you."
        import urllib.parse
        wa_link = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(wa_text)}"

        subject = f"Friendly Reminder: Outstanding Payment - {branch.name}"
        message = (
            f"Dear {patient.get_full_name()},\n\n"
            f"This is a friendly reminder regarding your outstanding bill #{bill.id} at {branch.name}.\n\n"
            f"Details of the payment:\n"
            f" - Pending Amount: Rs. {balance:.2f}\n"
            f" - Due Date: {due_str}\n\n"
            f"You can quickly connect with us on WhatsApp or pay at the clinic:\n"
            f"WhatsApp Quick Contact: {wa_link}\n\n"
            f"If you have already settled this payment, please disregard this message.\n\n"
            f"Best regards,\n"
            f"{branch.name} Administration"
        )

        from django.conf import settings
        from django.core.mail import send_mail
        import datetime

        # Send email
        email_sent = False
        if patient.email:
            try:
                from notifications.email import send_udhari_reminder_email
                send_udhari_reminder_email(bill, wa_link)
                email_sent = True
            except Exception as e:
                return Response({'detail': f'Email Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Update reminder date
        bill.udhari_last_reminder_date = datetime.date.today()
        bill.save()

        return Response({
            'detail': 'Reminder sent successfully.',
            'email_sent': email_sent,
            'whatsapp_link': wa_link
        }, status=status.HTTP_200_OK)
