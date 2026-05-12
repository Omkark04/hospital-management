import jwt
import datetime
from math import radians, cos, sin, asin, sqrt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from .models import Attendance, Employee, AttendanceStatus

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance in meters between two points 
    on the earth (specified in decimal degrees)
    """
    if lon1 is None or lat1 is None or lon2 is None or lat2 is None:
        return float('inf')
        
    # convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(radians, [float(lon1), float(lat1), float(lon2), float(lat2)])

    # haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 6371000 # Radius of earth in meters
    return c * r

def is_in_shift_window(t_now, shift_time, duration_hours=1):
    now_mins = t_now.hour * 60 + t_now.minute
    start_mins = shift_time.hour * 60 + shift_time.minute
    end_mins = start_mins + duration_hours * 60
    if end_mins >= 1440: # crosses midnight
        return (start_mins <= now_mins < 1440) or (0 <= now_mins <= (end_mins % 1440))
    return start_mins <= now_mins <= end_mins

class GenerateQRTokenView(APIView):
    """
    Only Doctor can display the attendance kiosk QR.
    Active ONLY during the 1-hour morning check-in and evening check-out windows.
    Refreshes every 45 seconds to prevent screenshot abuse.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Only doctors manage the kiosk QR
        if user.role != 'doctor':
            return Response({'error': 'Only doctors can display the attendance kiosk.'}, status=status.HTTP_403_FORBIDDEN)

        # Doctor's branch is taken directly from their profile
        branch = user.branch
        if not branch:
            return Response({'error': 'Doctor has no assigned branch.'}, status=status.HTTP_400_BAD_REQUEST)

        now_time = datetime.datetime.now().time()
        in_morning = is_in_shift_window(now_time, branch.shift_start_time, 1)
        in_evening = is_in_shift_window(now_time, branch.shift_end_time, 1)

        start_str = branch.shift_start_time.strftime('%H:%M')
        start_end_time = (datetime.datetime.combine(datetime.date.today(), branch.shift_start_time) + datetime.timedelta(hours=1)).time()
        start_end_str = start_end_time.strftime('%H:%M')

        end_str = branch.shift_end_time.strftime('%H:%M')
        end_end_time = (datetime.datetime.combine(datetime.date.today(), branch.shift_end_time) + datetime.timedelta(hours=1)).time()
        end_end_str = end_end_time.strftime('%H:%M')

        window_msg = f"Check-in Window: {start_str} - {start_end_str} | Check-out Window: {end_str} - {end_end_str}"

        if not (in_morning or in_evening):
            return Response({
                'error': f"QR Kiosk inactive. Active only during morning check-in ({start_str}-{start_end_str}) and evening check-out ({end_str}-{end_end_str}).",
                'window_info': window_msg
            }, status=status.HTTP_403_FORBIDDEN)

        # Generate a short-lived JWT
        payload = {
            'branch_id': branch.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=45),
            'iat': datetime.datetime.utcnow(),
            'iss': 'hms_attendance'
        }

        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        return Response({
            'qr_token': token,
            'window_info': window_msg,
            'is_morning': in_morning,
            'is_evening': in_evening
        })


class ScanQRAttendanceView(APIView):
    """
    Doctor, Receptionist, and Employee can scan the QR to mark attendance.
    Enforces rigid shift timing windows for check-in and check-out.
    """
    permission_classes = [IsAuthenticated]
    
    # Throttle to prevent spamming the endpoint
    from rest_framework.throttling import UserRateThrottle
    class QrScanThrottle(UserRateThrottle):
        rate = '5/min'
    
    throttle_classes = [QrScanThrottle]

    def post(self, request):
        user = request.user
        qr_token = request.data.get('qr_token')
        lat = request.data.get('lat')
        lng = request.data.get('lng')

        if not qr_token:
            return Response({'error': 'QR Token missing'}, status=status.HTTP_400_BAD_REQUEST)

        # Only Doctor, Receptionist, Employee can scan
        ALLOWED_ROLES = ['doctor', 'receptionist', 'employee']
        if user.role not in ALLOWED_ROLES:
            return Response({'error': 'Attendance marking is not available for your role.'}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'employee_profile'):
            return Response({'error': 'No employee profile found. Please contact your administrator.'}, status=status.HTTP_403_FORBIDDEN)

        employee = user.employee_profile

        try:
            # Validate token and expiration
            payload = jwt.decode(qr_token, settings.SECRET_KEY, algorithms=['HS256'])
            branch_id = payload.get('branch_id')
            
            if str(branch_id) != str(employee.branch_id):
                return Response({'error': 'You can only check-in at your assigned branch'}, status=status.HTTP_400_BAD_REQUEST)

        except jwt.ExpiredSignatureError:
            return Response({'error': 'QR Code expired. Please scan the latest one.'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid QR Code'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify shift timing windows
        branch = employee.branch
        now_time = datetime.datetime.now().time()
        in_morning = is_in_shift_window(now_time, branch.shift_start_time, 1)
        in_evening = is_in_shift_window(now_time, branch.shift_end_time, 1)

        if not (in_morning or in_evening):
            return Response({
                'error': 'Attendance scan is outside the permitted 1-hour shift check-in/out windows.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check location (Geofencing)
        is_flagged = False
        if branch.latitude and branch.longitude:
            if not lat or not lng:
                return Response({'error': 'GPS location required to mark attendance'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                lat_f = float(lat)
                lng_f = float(lng)
                if not (-90 <= lat_f <= 90) or not (-180 <= lng_f <= 180):
                    return Response({'error': 'Invalid GPS coordinates.'}, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError):
                return Response({'error': 'GPS coordinates must be valid numbers.'}, status=status.HTTP_400_BAD_REQUEST)

            distance = haversine(branch.longitude, branch.latitude, lng_f, lat_f)
            if distance > branch.attendance_radius_meters:
                is_flagged = True
                # Notify Doctor/Owner about out of bounds scan
                from notifications.models import Notification, NotificationType
                from users.models import CustomUser, UserRole
                supervisors = CustomUser.objects.filter(role__in=[UserRole.DOCTOR, UserRole.OWNER], branch=branch)
                if not supervisors.exists():
                    supervisors = CustomUser.objects.filter(role=UserRole.OWNER)
                    
                for sup in supervisors:
                    Notification.objects.create(
                        recipient=sup,
                        notification_type=NotificationType.GENERAL,
                        subject='Attendance Geofence Alert',
                        message=f"{user.get_full_name()} attempted to mark attendance {int(distance)}m away from branch {branch.name}."
                    )
                
                return Response({
                    'error': f"Attendance rejected: You are {int(distance)}m outside the designated branch location range. A warning has been sent to your supervisor."
                }, status=status.HTTP_403_FORBIDDEN)

        # Mark Attendance based on active window
        today = datetime.date.today()
        attendance = Attendance.objects.filter(employee=employee, date=today).first()

        if in_morning:
            if attendance:
                return Response({'error': 'You have already checked in for today\'s shift.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Record Check-in
            Attendance.objects.create(
                employee=employee,
                date=today,
                status=AttendanceStatus.PRESENT,
                check_in=now_time,
                recorded_lat=lat,
                recorded_lng=lng,
                is_flagged=is_flagged,
                marked_by=user
            )
            return Response({'message': 'Check-in successful!', 'status': 'in', 'flagged': is_flagged})

        elif in_evening:
            if not attendance:
                # Create record marking checkout directly if morning check-in was missed
                Attendance.objects.create(
                    employee=employee,
                    date=today,
                    status=AttendanceStatus.PRESENT,
                    check_out=now_time,
                    recorded_lat=lat,
                    recorded_lng=lng,
                    is_flagged=is_flagged,
                    marked_by=user,
                    notes='Missed morning check-in; recorded check-out directly.'
                )
                return Response({'message': 'Check-out successful (Morning check-in missed)!', 'status': 'out', 'flagged': is_flagged})
            
            if attendance.check_out:
                return Response({'error': 'You have already checked out for today\'s shift.'}, status=status.HTTP_400_BAD_REQUEST)

            # Process checkout
            attendance.check_out = now_time
            if lat and lng:
                attendance.recorded_lat = lat
                attendance.recorded_lng = lng
                if is_flagged:
                    attendance.is_flagged = True
            attendance.save()
            return Response({'message': 'Check-out successful!', 'status': 'out', 'flagged': is_flagged})
