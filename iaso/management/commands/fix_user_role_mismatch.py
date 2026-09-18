"""
IA-5429

When bulk updating users to assign roles, the user's Django auth groups were not properly updated,
leaving the users actual permissions out of sync with their roles.

This command is a one-time fix for existing users affected by this issue.
"""

from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Exists, OuterRef

from iaso.models import Profile, UserRole


class Command(BaseCommand):
    help = "Identify and fix mismatches between user roles and Django auth groups."

    def add_arguments(self, parser):
        parser.add_argument(
            "--account-id",
            type=int,
            help="Filter users by a specific account ID.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be changed without applying any changes.",
        )
        parser.add_argument(
            "--clean-up-groups",
            action="store_true",
            help="Also remove Django groups that are linked to a UserRole the user does not have.",
        )

    def handle(self, *args, **options):
        account_id = options.get("account_id")
        dry_run = options.get("dry_run")
        clean_up_groups = options.get("clean_up_groups")

        missing_groups_subquery = UserRole.objects.filter(iaso_profile=OuterRef("pk")).exclude(
            group__user=OuterRef("user")
        )

        extra_groups_subquery = Group.objects.filter(user=OuterRef("user"), iaso_user_role__isnull=False).exclude(
            iaso_user_role__iaso_profile=OuterRef("pk")
        )

        if clean_up_groups:
            profiles_filter = Exists(missing_groups_subquery) | Exists(extra_groups_subquery)
        else:
            profiles_filter = Exists(missing_groups_subquery)

        profiles = (
            Profile.objects.filter(profiles_filter)
            .select_related("user", "account")
            .prefetch_related("user_roles__group")
        )

        if account_id:
            profiles = profiles.filter(account_id=account_id)

        affected_count = 0
        total_groups_added = 0
        total_groups_removed = 0

        self.stdout.write(f"Analyzing users{' for account ' + str(account_id) if account_id else ''}...")

        role_groups = set(Group.objects.filter(iaso_user_role__isnull=False))

        for profile in profiles:
            user = profile.user

            expected_groups = {role.group for role in profile.user_roles.all() if role.group}
            current_groups = set(user.groups.all())

            missing_groups = expected_groups - current_groups
            extra_groups = (current_groups & role_groups) - expected_groups

            if missing_groups or (extra_groups and clean_up_groups):
                affected_count += 1
                self.stdout.write(f"{user.username} (id: {user.id}, account_id: {profile.account.id})")

                if missing_groups:
                    group_names = ", ".join(g.name for g in missing_groups)
                    self.stdout.write(f" - Missing groups: [{group_names}]")
                    total_groups_added += len(missing_groups)

                if extra_groups and clean_up_groups:
                    group_names = ", ".join(g.name for g in extra_groups)
                    self.stdout.write(f" - Extra groups (to be removed): [{group_names}]")
                    total_groups_removed += len(extra_groups)

                if not dry_run:
                    with transaction.atomic():
                        if missing_groups:
                            user.groups.add(*missing_groups)
                            self.stdout.write(self.style.SUCCESS(f" - Added missing groups for {user.username}"))
                        if extra_groups and clean_up_groups:
                            user.groups.remove(*extra_groups)
                            self.stdout.write(self.style.SUCCESS(f" - Removed extra groups for {user.username}"))

        self.stdout.write("\nSummary:")
        self.stdout.write(f" - Affected users: {affected_count}")
        self.stdout.write(f" - Groups added: {total_groups_added}")
        if clean_up_groups:
            self.stdout.write(f" - Groups removed: {total_groups_removed}")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run enabled. No changes were actually saved."))
