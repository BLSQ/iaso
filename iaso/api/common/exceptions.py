from rest_framework.exceptions import APIException


class Custom403Exception(APIException):
    """This custom 403 exception is created to make use of the custom 403 snackbar handling on front-end"""

    status_code = 403
    default_detail = "Forbidden"
