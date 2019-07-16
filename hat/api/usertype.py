from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.shortcuts import get_object_or_404

from hat.users.models import UserType, Permission
from hat.audit.models import log_modification, PROFILE_API


class UserTypeViewSet(viewsets.ViewSet):
    """
    Institution API to list all user types.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ['menupermissions.x_management_users']

    def list(self, request):
        queryset =  UserType.objects.filter(is_erased=False)
        res = map(lambda userType: userType.as_dict(), queryset)

        return Response(res)

    def create(self, request):
        name = request.data.get("name", None)
        permissions = request.data.get("permissions", None)
        new_user_type = UserType()
        new_user_type.name = name
        new_user_type.save()
        permission_list = []
        if permissions:
            for permission_id in permissions:
                new_permission = get_object_or_404(Permission, id=permission_id)
                permission_list.append(new_permission)

        new_user_type.permissions.set(permission_list)
        new_user_type.save()
        log_modification(None, new_user_type, PROFILE_API, request.user)
        res = map(lambda userType: userType.as_dict(), UserType.objects.filter(is_erased=False))

        return Response(res)

    def partial_update(self, request, pk=None):
        is_erased = request.data.get("is_erased", False)

        user_type = get_object_or_404(UserType, pk=pk)
        original_user_type = user_type
        user_type.is_erased = is_erased
        user_type.save()

        log_modification(original_user_type, user_type, PROFILE_API, request.user)

        res = map(lambda userType: userType.as_dict(), UserType.objects.filter(is_erased=False))

        return Response(res)

