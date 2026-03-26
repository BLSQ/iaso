import re

from iaso.test import APITestCase


class BaseApiTestCase(APITestCase):
    @staticmethod
    def camel_case_to_snake_case(value):
        pattern = re.compile(r"(?<!^)(?=[A-Z])")
        return pattern.sub("_", value).lower()

    @staticmethod
    def snake_case_to_camel_case(value):
        camel_string = "".join(x.capitalize() for x in value.lower().split("_"))

        return value[0].lower() + camel_string[1:]
