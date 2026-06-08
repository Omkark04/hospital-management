import csv
import io
from decimal import Decimal, InvalidOperation
from datetime import date, datetime
from django.db import transaction
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework import status
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
        writer.writerow([
            'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth',
            'Gender', 'Blood Group', 'Address', 'Chief Complaint',
            'Medical History', 'Weight Kg', 'Import Visit Date', 'Import Amount',
            'Import Notes', 'Referral Source', 'Created At'
        ])

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
                patient.chief_complaint,
                patient.medical_history,
                patient.weight_kg,
                patient.import_visit_date,
                patient.import_amount,
                patient.import_notes,
                patient.referral_source,
                patient.created_at.strftime('%Y-%m-%d %H:%M') if patient.created_at else ''
            ])
        return response


# ─────────────── Column name mapping ─────────────────────────
# Maps various header spellings from user spreadsheets to our internal keys.
COLUMN_MAP = {
    # First Name
    'first name': 'first_name',
    'firstname': 'first_name',
    'first_name': 'first_name',
    # Last Name
    'last name': 'last_name',
    'lastname': 'last_name',
    'last_name': 'last_name',
    # Full name (will be split into first + last)
    'patient name': 'full_name',
    'name': 'full_name',
    'patient_name': 'full_name',
    'patient': 'full_name',
    'patientname': 'full_name',
    'full name': 'full_name',
    'fullname': 'full_name',
    # Phone
    'phone': 'phone',
    'mobile': 'phone',
    'mobile number': 'phone',
    'mobile_number': 'phone',
    'number': 'phone',
    'contact': 'phone',
    'contact number': 'phone',
    'phone number': 'phone',
    'mobile num': 'phone',
    'mobile no': 'phone',
    'mobile no.': 'phone',
    'phone no': 'phone',
    'phone no.': 'phone',
    'contact no': 'phone',
    'contact no.': 'phone',
    'mob': 'phone',
    'mobile num': 'phone',
    'mobile no': 'phone',
    'mobile no.': 'phone',
    'phone num': 'phone',
    # Email
    'email': 'email',
    'email address': 'email',
    'email_address': 'email',
    # Gender
    'gender': 'gender',
    'sex': 'gender',
    'm/f': 'gender',
    # Blood Group
    'blood group': 'blood_group',
    'blood_group': 'blood_group',
    'bloodgroup': 'blood_group',
    # Address
    'address': 'address',
    # Age
    'age': 'age',
    'ag': 'age',
    # Date of Birth
    'date of birth': 'dob',
    'dob': 'dob',
    'birth date': 'dob',
    'birth_date': 'dob',
    # Problem / Chief Complaint
    'problem': 'chief_complaint',
    'diagnosis': 'chief_complaint',
    'chief complaint': 'chief_complaint',
    'chief_complaint': 'chief_complaint',
    'problem details': 'chief_complaint',
    'complaint': 'chief_complaint',
    'complaints': 'chief_complaint',
    'symptoms': 'chief_complaint',
    'disease': 'chief_complaint',
    'diseases': 'chief_complaint',
    'pain': 'chief_complaint',
    # Medicine / Medical History
    'medicine': 'medical_history',
    'medication': 'medical_history',
    'medical history': 'medical_history',
    'medical_history': 'medical_history',
    'past medicine': 'medical_history',
    'past history': 'medical_history',
    'past medical history': 'medical_history',
    'medicines': 'medical_history',
    'meds': 'medical_history',
    'current medicine': 'medical_history',
    'prescribed medicine': 'medical_history',
    # Referral
    'refer by': 'referral_source',
    'referred by': 'referral_source',
    'referral': 'referral_source',
    'referral source': 'referral_source',
    'referral_source': 'referral_source',
    'referred': 'referral_source',
    'refer': 'referral_source',
    # Duration
    'duration of pain': 'duration',
    'duration': 'duration',
    'duration of pac': 'duration',
    'duration pain': 'duration',
    # Clinic import fields
    'weight': 'weight_kg',
    'wt': 'weight_kg',
    'weight kg': 'weight_kg',
    'weight (kg)': 'weight_kg',
    'kg': 'weight_kg',
    'amount': 'import_amount',
    'total amount': 'import_amount',
    'fee': 'import_amount',
    'fees': 'import_amount',
    'fe': 'import_amount',
    'charges': 'import_amount',
    'date': 'import_visit_date',
    'visit date': 'import_visit_date',
    'consultation date': 'import_visit_date',
    'registration date': 'import_visit_date',
    'new': 'import_notes',
    'new old': 'import_notes',
    'new/old': 'import_notes',
    'case type': 'import_notes',
    'patient type': 'import_notes',
    'remarks': 'import_notes',
    'remark': 'import_notes',
    'notes': 'import_notes',
}


def normalize_header(header):
    """Lowercase, strip whitespace and common trailing characters."""
    return header.strip().lower().replace('_', ' ').strip()


def parse_gender(value):
    """Convert various gender representations to model choices."""
    v = value.strip().lower()
    if v in ('m', 'male', 'पुरुष'):
        return 'male'
    elif v in ('f', 'female', 'स्त्री', 'महिला'):
        return 'female'
    elif v:
        return 'other'
    return None


def age_to_dob(age_str):
    """Convert age string to approximate date of birth."""
    try:
        age = int(float(str(age_str).strip()))
        if 0 < age < 150:
            return date(date.today().year - age, 1, 1)
    except (ValueError, TypeError):
        pass
    return None


def clean_phone(phone_str):
    """Extract 10-digit phone number from various formats."""
    if not phone_str:
        return ''
    raw = str(phone_str).strip()
    if 'e' in raw.lower():
        try:
            raw = str(int(Decimal(raw)))
        except (InvalidOperation, ValueError):
            pass
    digits = ''.join(c for c in raw if c.isdigit())
    # Handle 91XXXXXXXXXX format
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    # Handle +91 prefix stored as float by Excel (e.g., 919876543210.0)
    if len(digits) > 10 and digits.startswith('91'):
        digits = digits[2:]
    return digits[:15]  # max_length of phone field


def parse_decimal(value):
    if value in (None, ''):
        return None
    raw = str(value).strip().replace(',', '').replace('₹', '').replace('Rs.', '').replace('Rs', '')
    if not raw:
        return None
    try:
        return Decimal(raw)
    except (InvalidOperation, ValueError):
        return None


def parse_import_date(value):
    if value in (None, ''):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    raw = str(value).strip()
    for fmt in (
        '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%y', '%d/%m/%y',
        '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%fZ',
    ):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def split_name(full_name):
    """Split a full name into (first_name, last_name)."""
    parts = str(full_name).strip().split()
    if not parts:
        return ('', '')
    first = parts[0].title()
    last = ' '.join(parts[1:]).title() if len(parts) > 1 else ''
    return (first, last)


def get_next_uhid_sequence(branch):
    """Return the next UHID prefix and sequence for this branch/year."""
    prefix = f"{branch.code}-{timezone.now().year}-"
    last_uhid = (
        Patient.objects.filter(uhid__startswith=prefix)
        .order_by('-uhid')
        .values_list('uhid', flat=True)
        .first()
    )
    if not last_uhid:
        return prefix, 1
    try:
        return prefix, int(last_uhid.split('-')[-1]) + 1
    except (ValueError, IndexError):
        return prefix, 1


def read_csv_rows(file_obj):
    """Read rows from CSV file, return (headers, rows)."""
    decoded = file_obj.read().decode('utf-8-sig')  # handle BOM
    io_string = io.StringIO(decoded)
    reader = csv.DictReader(io_string)
    headers = reader.fieldnames or []
    rows = list(reader)
    return headers, rows


def read_excel_rows(file_obj):
    """Read rows from Excel file, return (headers, rows)."""
    import openpyxl
    wb = openpyxl.load_workbook(file_obj, read_only=True, data_only=True)
    ws = wb.active

    rows_iter = ws.iter_rows(values_only=True)
    # First row = headers
    header_row = next(rows_iter, None)
    if not header_row:
        return [], []

    headers = [str(h).strip() if h else '' for h in header_row]
    rows = []
    for row in rows_iter:
        row_dict = {}
        for i, val in enumerate(row):
            if i < len(headers) and headers[i]:
                row_dict[headers[i]] = val if val is not None else ''
        # Skip completely empty rows
        if any(str(v).strip() for v in row_dict.values()):
            rows.append(row_dict)

    wb.close()
    return headers, rows


class PatientImportView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=400)

        filename = file_obj.name.lower()
        if filename.endswith('.xls'):
            return Response({
                'error': 'Old Excel format (.xls) is not supported. Please save your file as .xlsx or .csv and try again.'
            }, status=400)

        is_excel = filename.endswith('.xlsx')
        is_csv = filename.endswith('.csv')

        if not (is_csv or is_excel):
            return Response({
                'error': 'Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx) file.'
            }, status=400)

        try:
            # ── 1. Read the file ──────────────────────────────
            if is_excel:
                headers, rows = read_excel_rows(file_obj)
            else:
                headers, rows = read_csv_rows(file_obj)

            if not headers or not rows:
                return Response({'error': 'File is empty or has no data rows.'}, status=400)

            # ── 2. Map headers to internal field names ────────
            field_map = {}  # original_header -> internal_key
            for h in headers:
                normalized = normalize_header(h)
                if normalized in COLUMN_MAP:
                    field_map[h] = COLUMN_MAP[normalized]

            # Must have at least phone to proceed
            has_phone = 'phone' in field_map.values()
            has_name = 'full_name' in field_map.values() or 'first_name' in field_map.values()
            if not has_phone:
                return Response({
                    'error': 'Could not find a "Phone" or "Mobile Number" column in your file. '
                             'Please ensure your file has a column with phone numbers.',
                    'detected_columns': headers
                }, status=400)

            # ── 3. Determine branch ───────────────────────────
            branch = getattr(request.user, 'branch', None)
            if not branch and request.user.role == 'owner':
                # Owner: use the first branch of their hospital
                from branches.models import Branch
                branch = Branch.objects.filter(hospital__owner=request.user).first()

            if not branch:
                return Response({
                    'error': 'Cannot determine branch. Please ensure your account is linked to a branch.'
                }, status=400)

            phone_headers = [
                original_header
                for original_header, internal_key in field_map.items()
                if internal_key == 'phone'
            ]
            import_phones = set()
            for row in rows:
                for phone_header in phone_headers:
                    phone = clean_phone(row.get(phone_header, ''))
                    if phone and len(phone) >= 10:
                        import_phones.add(phone)
                        break

            existing_by_phone = {
                patient.phone: patient
                for patient in Patient.objects.filter(phone__in=import_phones, branch=branch)
            }
            uhid_prefix, next_uhid_sequence = get_next_uhid_sequence(branch)

            # ── 4. Process each row ───────────────────────────
            created_count = 0
            updated_count = 0
            skipped_rows = []
            errors = []
            patients_to_create = []
            patients_to_update = {}
            update_fields = set()

            for row_num, row in enumerate(rows, start=2):  # start=2 because row 1 is header
                try:
                    # Extract mapped values
                    mapped = {}
                    import_note_parts = []
                    for original_header, internal_key in field_map.items():
                        val = row.get(original_header, '')
                        if val is None:
                            normalized_val = ''
                        elif isinstance(val, (datetime, date)):
                            normalized_val = val
                        elif isinstance(val, float):
                            if val.is_integer():
                                normalized_val = str(int(val))
                            else:
                                normalized_val = str(val).strip()
                        else:
                            normalized_val = str(val).strip()

                        if internal_key == 'import_notes' and str(normalized_val).strip():
                            import_note_parts.append(f'{original_header}: {normalized_val}')
                        else:
                            mapped[internal_key] = normalized_val

                    # Phone is required
                    phone = clean_phone(mapped.get('phone', ''))
                    if not phone or len(phone) < 10:
                        skipped_rows.append({'row': row_num, 'reason': 'Missing or invalid phone number. Keep mobile numbers as text in CSV/Excel.'})
                        continue

                    # Name handling
                    first_name = mapped.get('first_name', '')
                    last_name = mapped.get('last_name', '')
                    if not first_name and 'full_name' in mapped and mapped['full_name']:
                        first_name, last_name = split_name(mapped['full_name'])

                    if not first_name:
                        skipped_rows.append({'row': row_num, 'reason': 'Missing patient name'})
                        continue

                    # Gender
                    gender = parse_gender(str(mapped.get('gender', '')) if mapped.get('gender') else '') or 'other'

                    # DOB: prefer explicit DOB, fallback to age calculation
                    dob = None
                    if mapped.get('dob'):
                        dob_val = mapped['dob']
                        if isinstance(dob_val, (datetime, date)):
                            if isinstance(dob_val, datetime):
                                dob = dob_val.date()
                            else:
                                dob = dob_val
                        else:
                            dob = parse_import_date(dob_val)
                    if not dob and mapped.get('age'):
                        dob = age_to_dob(mapped['age'])

                    # Build chief complaint (combine problem + duration)
                    complaint_parts = []
                    if mapped.get('chief_complaint'):
                        complaint_parts.append(mapped['chief_complaint'])
                    if mapped.get('duration'):
                        complaint_parts.append(f"Duration: {mapped['duration']}")
                    chief_complaint = ' | '.join(complaint_parts) if complaint_parts else ''

                    # Medical history (from medicine column)
                    medical_history = mapped.get('medical_history', '')

                    # Referral source
                    referral_source = mapped.get('referral_source', '')
                    weight_kg = parse_decimal(mapped.get('weight_kg'))
                    import_amount = parse_decimal(mapped.get('import_amount'))
                    import_visit_date = parse_import_date(mapped.get('import_visit_date'))
                    import_notes = ' | '.join(import_note_parts)

                    # Build defaults dict
                    defaults = {
                        'first_name': str(first_name).strip()[:100],
                        'last_name': str(last_name).strip()[:100],
                        'gender': gender,
                    }

                    # Only set optional fields if they have values (don't overwrite with blanks)
                    if mapped.get('email') and '@' in str(mapped['email']):
                        defaults['email'] = str(mapped['email']).strip()[:254]
                    if mapped.get('blood_group'):
                        defaults['blood_group'] = str(mapped['blood_group']).strip()[:10]
                    if mapped.get('address'):
                        defaults['address'] = str(mapped['address']).strip()
                    if dob:
                        defaults['dob'] = dob
                    if chief_complaint:
                        defaults['chief_complaint'] = str(chief_complaint).strip()
                    if medical_history:
                        defaults['medical_history'] = str(medical_history).strip()
                    if referral_source:
                        defaults['referral_source'] = str(referral_source).strip()[:255]
                    if weight_kg is not None:
                        defaults['weight_kg'] = weight_kg
                    if import_amount is not None:
                        defaults['import_amount'] = import_amount
                    if import_visit_date:
                        defaults['import_visit_date'] = import_visit_date
                    if import_notes:
                        defaults['import_notes'] = import_notes

                    existing = existing_by_phone.get(phone)

                    if existing:
                        # Update: only overwrite non-blank fields
                        for key, val in defaults.items():
                            if val:  # don't overwrite with empty
                                setattr(existing, key, val)
                                update_fields.add(key)
                        if existing.pk:
                            patients_to_update[existing.pk] = existing
                            updated_count += 1
                    else:
                        # Create new patient
                        defaults['uhid'] = f"{uhid_prefix}{str(next_uhid_sequence).zfill(5)}"
                        next_uhid_sequence += 1
                        defaults['phone'] = phone
                        defaults['branch'] = branch
                        defaults['registered_by'] = request.user
                        patient = Patient(**defaults)
                        patients_to_create.append(patient)
                        existing_by_phone[phone] = patient
                        created_count += 1

                except Exception as e:
                    errors.append({'row': row_num, 'error': str(e)})

            if patients_to_create or patients_to_update:
                with transaction.atomic():
                    if patients_to_update and update_fields:
                        update_fields.add('updated_at')
                        now = timezone.now()
                        for patient in patients_to_update.values():
                            patient.updated_at = now
                        Patient.objects.bulk_update(
                            list(patients_to_update.values()),
                            sorted(update_fields),
                            batch_size=500,
                        )
                    if patients_to_create:
                        Patient.objects.bulk_create(patients_to_create, batch_size=500)

            # ── 5. Build response ─────────────────────────────
            result = {
                'message': f'Import complete. {created_count} created, {updated_count} updated.',
                'created': created_count,
                'updated': updated_count,
                'total_rows': len(rows),
            }

            if skipped_rows:
                result['skipped'] = skipped_rows
                result['skipped_count'] = len(skipped_rows)
            if errors:
                result['errors'] = errors[:20]  # cap at 20
                result['error_count'] = len(errors)

            # Include which columns were detected for transparency
            result['detected_columns'] = {
                h: field_map.get(h, '(ignored)')
                for h in headers if h.strip()
            }

            return Response(result)

        except Exception as e:
            return Response({'error': f'Error processing file: {str(e)}'}, status=400)
