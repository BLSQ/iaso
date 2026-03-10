from django.urls import Resolver404, resolve
from djangorestframework_camel_case.middleware import CamelCaseMiddleWare


class CustomCamelCaseMiddleWare(CamelCaseMiddleWare):
    def __call__(self, request):
        # we only execute this middleware on profiles API at the moment
        route = ""
        try:
            route = resolve(request.path_info).route
        except Resolver404:
            pass

        if route.startswith("/api/v2/profiles"):
            return super().__call__(request)
        return self.get_response(request)
