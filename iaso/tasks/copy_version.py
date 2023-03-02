import logging

from django.utils.translation import gettext as _

from beanstalk_worker import task_decorator
from iaso.models import OrgUnit, DataSource, SourceVersion, Group, GroupSet, ERRORED

logger = logging.getLogger(__name__)


@task_decorator(task_name="copy_version")
def copy_version(
    source_source_id,
    source_version_number,
    destination_source_id=None,
    destination_version_number=None,
    force=False,
    task=None,
):

    the_task = task
    source_source = DataSource.objects.get(id=source_source_id)
    source_version = SourceVersion.objects.get(number=source_version_number, data_source=source_source)
    logger.debug("source_version", source_version)
    logger.debug("copying source_version %s" % str(source_version))

    if not destination_source_id:
        destination_source_id = source_source_id

    if not destination_version_number:
        version = SourceVersion.objects.filter(data_source_id=destination_source_id).latest("number")
        latest_version = version.number
        destination_version_number = latest_version + 1

    destination_source = DataSource.objects.get(id=destination_source_id)
    destination_version, created = SourceVersion.objects.get_or_create(
        number=destination_version_number, data_source=destination_source
    )
    source_version_count = OrgUnit.objects.filter(version=source_version).count()

    the_task.report_progress_and_stop_if_killed(progress_value=source_version_count, progress_message=_("Starting"))
    destination_version_count = OrgUnit.objects.filter(version=destination_version).count()
    if destination_version_count > 0 and not force:
        res_string = (
            "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
            % destination_version_count
        )
        logger.debug(res_string)
        the_task.status = ERRORED
        the_task.result = {"message": res_string}
        the_task.save()
        return
    else:
        OrgUnit.objects.filter(version=destination_version).delete()
        logger.debug(("%d org units records deleted" % destination_version_count).upper())

    group_sets = GroupSet.objects.filter(source_version=source_version)
    group_set_matching = {}
    logger.debug("********* Copying groupsets")
    for gs in group_sets:
        old_id = gs.id
        gs.id = None
        gs.source_version = destination_version
        gs.save()
        group_set_matching[old_id] = gs.id
    the_task.report_progress_and_stop_if_killed(progress_message=_("Copying groups"))

    logger.debug("********* Copying groups")
    groups = Group.objects.filter(source_version=source_version)
    group_matching = {}
    for g in groups:
        old_id = g.id
        original_group_sets = list(g.group_sets.all())
        g.id = None
        g.source_version = destination_version
        g.save()

        for gs in original_group_sets:
            matching_gs = group_set_matching.get(gs.id)
            g.group_sets.add(matching_gs)

        group_matching[old_id] = g.id

    source_units = OrgUnit.objects.filter(version=source_version)
    source_units_count = source_units.count()
    old_new_dict = {}
    new_units = []
    new_root_units = []
    index = 0
    logger.debug("group_matching", group_matching)
    for unit in source_units:
        original_groups = list(unit.groups.all())
        old_id = unit.id
        unit.id = None
        unit.path = None
        unit.version = destination_version
        unit.save(skip_calculate_path=True)
        new_units.append(unit)
        old_new_dict[old_id] = unit.id
        index = index + 1
        for g in original_groups:
            matching_group = group_matching[g.id]
            unit.groups.add(matching_group)

        if index % 100 == 0:
            the_task.report_progress_and_stop_if_killed(
                progress_value=index, end_value=source_units_count, progress_message=_("Copying org units")
            )

    index = 0
    for unit in new_units:
        if unit.parent_id is not None:
            unit.parent_id = old_new_dict[unit.parent_id]
            unit.save(skip_calculate_path=True)
        else:
            new_root_units.append(unit)

        index = index + 1
        if index % 100 == 0:
            logger.debug("Parent fixed: %d" % index)
            the_task.report_progress_and_stop_if_killed(progress_message=_("Fixing parents"))

    for unit in new_root_units:
        logger.debug(f"Setting path for the hierarchy starting with org unit {unit.name}")
        unit.save(update_fields=["path"])

    the_task.report_success(message="%d copied" % source_version_count)

    return the_task
