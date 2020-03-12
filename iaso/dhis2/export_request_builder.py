from django.db import transaction
from iaso.models import Instance, ExportRequest, ExportStatus


class ExportRequestBuilder:
    def __init__(self):
        self.form_mappings_cache = {}

    def get_form_mapping_versions(self, instance):
        ona_version = instance.json.get("_version") or instance.json.get("version")
        if ona_version is None:
            raise Exception("No version specified in instance json : " + str(instance))

        key = (instance.form_id, ona_version)
        if key in self.form_mappings_cache:
            return self.form_mappings_cache[key]

        mappings = []
        for form_mapping in instance.form.mapping_set.all():
            for form_mapping_version in form_mapping.versions.all():
                if str(form_mapping_version.form_version.version_id) == str(
                    ona_version
                ):
                    mappings.append(form_mapping_version)

        if len(mappings) == 0:
            raise Exception(
                "No form mapping version for the form version '"
                + instance.form.name
                + "' for version '"
                + str(ona_version)
                + "'"
            )
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
        instances = instances.with_status().exclude(status=Instance.STATUS_DUPLICATED)

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
