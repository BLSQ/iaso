from django.core.management.base import BaseCommand
from iaso.models import OrgUnit, DataSource, SourceVersion, Group, GroupSet


class Command(BaseCommand):
    help = """Copy a complete pyramid. After usage, there will be a full copy, just 
              with a different version. Both pyramids will be totally unlinked.
    """

    def add_arguments(self, parser):
        parser.add_argument("--source_source_name", type=str)
        parser.add_argument("--source_version", type=int)
        parser.add_argument("--destination_source_name", type=str)
        parser.add_argument("--destination_version", type=int)
        parser.add_argument(
            "-f", "--force", action="store_true", help="Will proceed to delete destination version if it already exists"
        )

    def handle(self, *args, **options):
        source_source_name = options.get("source_source_name")
        source_version_number = options.get("source_version")
        destination_source_name = options.get("destination_source_name")
        destination_version_number = options.get("destination_version")
        force = options.get("force")

        source_source = DataSource.objects.get(name=source_source_name)
        source_version = SourceVersion.objects.get(number=source_version_number, data_source=source_source)
        print("source_version", source_version)

        destination_source, created = DataSource.objects.get_or_create(name=destination_source_name)
        destination_version, created = SourceVersion.objects.get_or_create(
            number=destination_version_number, data_source=destination_source
        )

        version_count = OrgUnit.objects.filter(version=destination_version).count()
        if version_count > 0 and not force:
            print(
                "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                % version_count
            )
            return
        else:
            OrgUnit.objects.filter(version=destination_version).delete()
            print(("%d org units records deleted" % version_count).upper())

        group_sets = GroupSet.objects.filter(source_version=source_version)
        group_set_matching = {}
        print("********* Copying groupsets")
        for gs in group_sets:
            old_id = gs.id
            gs.id = None
            gs.source_version = destination_version
            gs.save()
            group_set_matching[old_id] = gs.id
        print("group_set_matching", group_set_matching)
        print("********* Copying groups")
        groups = Group.objects.filter(source_version=source_version)
        group_matching = {}
        for g in groups:
            old_id = g.id
            original_group_sets = list(g.group_sets.all())
            g.id = None
            g.source_version = destination_version
            g.save()

            for gs in original_group_sets:
                print(gs, gs.id)
                matching_gs = group_set_matching.get(gs.id)
                g.group_sets.add(matching_gs)

            group_matching[old_id] = g.id

        source_units = OrgUnit.objects.filter(version=source_version)

        old_new_dict = {}
        new_units = []
        new_root_units = []
        index = 0
        print("group_matching", group_matching)
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
                print("Copied:", index)

        index = 0
        for unit in new_units:
            if unit.parent_id is not None:
                unit.parent_id = old_new_dict[unit.parent_id]
                unit.save(skip_calculate_path=True)
            else:
                new_root_units.append(unit)

            index = index + 1
            if index % 100 == 0:
                print("Parent fixed:", index)

        for unit in new_root_units:
            self.stdout.write(f"Setting path for the hierarchy starting with org unit {unit.name}")
            unit.save(update_fields=["path"])
