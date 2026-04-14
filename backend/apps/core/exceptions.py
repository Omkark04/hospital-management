"""
apps/core/exceptions.py — Custom DRF exception handler.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Returns a consistent error envelope:
    {
        "success": false,
        "error": {
            "code": "...",
            "message": "...",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "success": False,
            "error": {
                "code": response.status_code,
                "message": _get_error_message(response.data),
                "details": response.data,
            },
        }
    return response


def _get_error_message(data):
    if isinstance(data, dict):
        for key in ("detail", "non_field_errors"):
            if key in data:
                val = data[key]
                return str(val[0]) if isinstance(val, list) else str(val)
    if isinstance(data, list) and data:
        return str(data[0])
    return "An error occurred."
