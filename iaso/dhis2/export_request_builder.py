from django.db import transaction
from iaso.models import Instance, ExportRequest, ExportStatus
from django.core.paginator import Paginator


class NothingToExportError(Exception):
    pass


class NoVersionError(Exception):
    pass


class NoFormMappingError(Exception):
    pass


class ExportRequestBuilder:
    def __init__(self):
        self.form_mappings_cache = {}

    @transaction.atomic
    def build_export_request(self, filters, launcher=None, force_export=False):
        instances = Instance.objects

        # normal filters
        instances = instances.for_filters(**filters)

        # add account from Launcher
        instances = instances.filter(project__account=launcher.iaso_profile.account)
        # don't export duplicate instances
        instances = instances.with_status().exclude(status=Instance.STATUS_DUPLICATED)
        # don't export deleted instances
        instances = instances.filter(deleted=False)
        # don't export instances with json empty or test devices
        instances = instances.exclude(file="").exclude(device__test_device=True)

        # don't export already exported instances except if forced to
        if not force_export:
            instances = instances.filter(last_export_success_at__isnull=True)

        params = {"filters": filters, "force_export": force_export}

        if instances.count() == 0:
            raise NothingToExportError("no instance to export for " + str(params))

        export_request = ExportRequest()
        export_request.params = params
        export_request.launcher = launcher
        export_request.instance_count = instances.count()
        export_request.exported_count = 0
        export_request.errored_count = 0

        export_request.save()
        # make paginator deterministic
        instances = instances.order_by("id")
        paginator = Paginator(instances, 200)

        for page in range(1, paginator.num_pages + 1):
            export_statuses = []
            for instance in paginator.page(page).object_list:
                for mapping_version in self.get_form_mapping_versions(instance):
                    export_status = ExportStatus(
                        export_request=export_request,
                        instance=instance,
                        mapping_version=mapping_version,
                    )
                    export_statuses.append(export_status)

            ExportStatus.objects.bulk_create(export_statuses)

        return export_request

    def get_form_mapping_versions(self, instance):
        ona_version = instance.json.get("_version") or instance.json.get("version")
        if ona_version is None:
            raise NoVersionError(
                "No version specified (_version or version) in instance json : "
                + str(instance.id)
                + " "
                + str(instance.json)
            )

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
            raise NoFormMappingError(
                "No form mapping version for the form version '"
                + instance.form.name
                + "' for version '"
                + str(ona_version)
                + "'"
            )
        self.form_mappings_cache[key] = mappings

        return self.form_mappings_cache[key]
