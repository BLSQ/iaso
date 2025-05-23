# *Experimental* !!!
# DO NOT USE IN PROD

# This command should fix OrgUnit with group in different source version

from django.core.management.base import BaseCommand
from django.db import connection

from iaso.models import Group, OrgUnit


class Command(BaseCommand):
    def handle(self, *args, **options):
        print("Bad orgunits", get_count())
        fix_ourgunit_group()
        print("Bad orgunits", get_count())


count_query = """
select count(*)
from iaso_group_org_units go
         join iaso_group on (iaso_group.id = go.group_id)
         join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)
where iaso_orgunit.version_id != iaso_group.source_version_id
"""


def get_count():
    connection.cursor()
    cur = connection.cursor()
    cur.execute(count_query)
    (count,) = cur.fetchone()
    return count


def fix_ourgunit_group():
    connection.cursor()
    cur = connection.cursor()

    query = """
    select distinct       
           iaso_orgunit.id            as orgunit_id
    from iaso_group_org_units go
             join iaso_group on (iaso_group.id = go.group_id)
             join iaso_orgunit on (iaso_orgunit.id = go.orgunit_id)
    where iaso_orgunit.version_id != iaso_group.source_version_id
    -- limit 10
    """

    cur.execute(query)

    for i, (orgunit_id,) in enumerate(cur.fetchall()):
        ou = (
            OrgUnit.objects.prefetch_related("groups")
            .prefetch_related("groups__source_version")
            .prefetch_related("version")
            .get(pk=orgunit_id)
        )
        print("====", i, ou, ou.groups.all())

        new_groups = []
        for group in ou.groups.all():
            if group.source_version_id == ou.version_id:
                print(f"correct {group}")
                new_groups.append(group)
                continue
            # check if a group with same name exist in orgunit version, else create it
            try:
                new_group = ou.version.group_set.get(name=group.name)
                print(f"fix {group} ->  {new_group} (existing)")
            except Group.DoesNotExist:
                new_group = ou.version.group_set.create(name=group.name, source_ref=group.source_ref)
                print(f"fix {group} ->  {new_group} (created)")
            new_groups.append(new_group)
        # print(new_groups)
        ou.groups.set(new_groups)
