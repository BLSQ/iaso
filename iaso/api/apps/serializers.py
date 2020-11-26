from rest_framework import serializers
from rest_framework.response import Response
from ..projects import ProjectSerializer
from iaso.models import Project, Form, FeatureFlag
from hat.audit import models as audit_models
import logging
logger = logging.getLogger(__name__)


class AppSerializer(ProjectSerializer):
    """We override the project serializer to "switch" the id and app_id fields. It means that within the "apps" API,
    the app_id field from the Project model is used as the primary key."""

    class Meta(ProjectSerializer.Meta):
        model = Project
        fields = ["id", "name","app_id", "forms", "feature_flags", "needs_authentication", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
        # extra_kwargs = {'name': {'required': True}}
        # validators = [
        #     RequiredValidator(
        #         fields=('name')
        #     )
        # ]
    @staticmethod
    def get_feature_flags(obj: FeatureFlag):
        return ([v.as_dict() for v in obj.all()],)

    id = serializers.CharField(read_only=True, source="app_id")

    def create(self, request):
        # app = Project(**request)
        app = Project()
        logger.error(request)
        # org_unit.groups.set(new_groups)

        forms = []
        for form in request.forms:
            temp_form = get_object_or_404(Form, id=form)
            forms.append(temp_form)
        app.forms.set(forms)

        audit_models.log_modification(None, app, source="app_api", user=request.user)

        app.save()
        # account = self.context["request"].user.iaso_profile.account
        # project = account.project_set.first()  # not wonderful, there should maybe be a default project rather than this
        # ds.projects.add(project)
        return app

    def update(self, request, pk=None):
        # breakpoint()
        logger.error(request)
        # print(request)

        # algo_id = request.data.get("algoId", -1)
        # source_origin_id = request.data.get("sourceOriginId", -1)
        # version_origin = request.data.get("versionOrigin", -1)
        # source_destination_id = request.data.get("sourceDestinationId", -1)
        # version_destination = request.data.get("versionDestination", -1)
        #
        # algorithm = MatchingAlgorithm.objects.get(id=algo_id)
        # source_1 = DataSource.objects.get(id=source_origin_id)
        # version_1 = SourceVersion.objects.get(number=version_origin, data_source=source_1)
        # source_2 = DataSource.objects.get(id=source_destination_id)
        # version_2 = SourceVersion.objects.get(number=version_destination, data_source=source_2)
        # algo_module = importlib.import_module(algorithm.name)
        # algo = algo_module.Algorithm()
        # algo.match(version_1, version_2, request.user)
        return Response(True)
