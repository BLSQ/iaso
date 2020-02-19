from django.db import transaction
from iaso.models import (
    Instance,
    OrgUnit,
    Form,
    FormVersion,
    MappingVersion,
    ExportRequest,
    ExportStatus,
)

from iaso.dhis2.status_queries import duplicate_ids_query


class ExportRequestBuilder:
    def __init__(self):
        self.form_mappings_cache = {}

    def get_form_mapping_versions(self, instance):
        # TODO use the ona_version to lookup the correct version
        # ona_version = instance.json()["_version"]
        ona_version = "latest"

        key = (instance.form_id, ona_version)
        if key in self.form_mappings_cache:
            return self.form_mappings_cache[key]

        # TODO filter on ona_version id

        mappings = [
            mapping.versions.last() for mapping in instance.form.mapping_set.all()
        ]
        self.form_mappings_cache[key] = mappings

        return self.form_mappings_cache[key]

    @transaction.atomic
    def build_export_request(
        self,
        periods=None,
        form_ids=None,
        orgunit_ids=None,
        launcher=None,
        force_export=False,
    ):

        # TODO ask martinD what filter need to be added for "accounts"
        # make all that filters optional (don't apply if empty) ?
        instances = Instance.objects
        if orgunit_ids:
            instances = instances.filter(org_unit__in=orgunit_ids)

        instances = instances.filter(period__in=periods, form_id__in=form_ids)

        # don't export duplicate instances
        instances = instances.exclude(id__in=duplicate_ids_query(instances))

        # don't export already exported instances except if forced to
        if not force_export:
            instances = instances.filter(last_export_success_at__isnull=True)

        params = {
            "periods": periods,
            "form_ids": form_ids,
            "orgunit_ids": orgunit_ids,
            "force_export": force_export,
        }

        if instances.count() == 0:
            raise Exception("no instance to export for " + str(params))

        export_request = ExportRequest()
        export_request.params = params
        export_request.launcher = launcher
        export_request.instance_count = instances.count()
        export_request.exported_count = 0
        export_request.errored_count = 0

        export_request.save()

        for instance in instances:
            for mapping_version in self.get_form_mapping_versions(instance):
                export_status = ExportStatus(
                    export_request=export_request,
                    instance=instance,
                    mapping_version=mapping_version,
                )
                export_status.save()

        return export_request
