from iaso.api.forms import HasFormPermission
from iaso.api.query_params import APP_ID
from iaso.models import Form


class HasFormPredefinedFilterPermission(HasFormPermission):
    def has_object_permission(self, request, view, obj) -> bool:
        if not self.has_permission(request, view):
            return False

        ok_forms = Form.objects_include_deleted.filter_for_user_and_app_id(
            request.user, request.query_params.get(APP_ID)
        )

        return ok_forms.filter(id=obj.form_id).exists()
