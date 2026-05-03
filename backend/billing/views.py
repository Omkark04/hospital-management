from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import HttpResponse
from django.template.loader import get_template
from io import BytesIO
from xhtml2pdf import pisa
from storage.dropbox_service import upload_file, get_shared_link, delete_file

from users.permissions import IsOwnerOrReceptionist, IsPatient
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
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        qs = Bill.objects.all()
        qs = branch_qs(qs, self.request.user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(payment_status=status_filter)
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BillDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def get_queryset(self):
        return branch_qs(Bill.objects.all(), self.request.user)


class PaymentUpdateView(APIView):
    """Quick endpoint to update payment amount only (Receptionist workflow)."""
    permission_classes = [IsAuthenticated, IsOwnerOrReceptionist]

    def patch(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'detail': 'Bill not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = PaymentUpdateSerializer(bill, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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

        # 1. Check if PDF already exists on Dropbox (and not forcing refresh)
        force_refresh = request.query_params.get('refresh') == 'true'
        filename = f"bill_{bill.id}_{bill.patient.uhid}.pdf"
        dropbox_path = f"/hms/bills/{filename}"

        if force_refresh and bill.pdf_url:
            # Delete old file from Dropbox if it exists
            delete_file(dropbox_path)
            # Clear database link to ensure fresh state
            bill.pdf_url = ""
            bill.save()

        if bill.pdf_url and not force_refresh:
            return Response({'pdf_url': bill.pdf_url})

        # 2. Render HTML to PDF
        template = get_template('billing/invoice.html')
        html = template.render({'bill': bill})
        result = BytesIO()
        pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)

        if not pdf.err:
            pdf_bytes = result.getvalue()
            
            # 3. Upload to Dropbox
            upload_result = upload_file(pdf_bytes, dropbox_path)
            
            if upload_result:
                # 4. Get shareable link
                shared_link = get_shared_link(dropbox_path)
                if shared_link:
                    # Convert dl=0 to dl=1 for direct download
                    final_link = shared_link.replace('?dl=0', '?dl=1')
                    bill.pdf_url = final_link
                    bill.save()
                    return Response({'pdf_url': final_link})
            
            # Fallback: Serve PDF directly if Dropbox fails
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        return Response({'detail': 'Error generating PDF.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
