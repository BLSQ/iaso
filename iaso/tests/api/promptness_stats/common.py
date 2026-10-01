"""Shared test data for the promptness stats API.

Form "Monthly facility report": period type MONTH, grace period 10 days, targets org units of type "Facility"
and org units of the group "Special targets". Period 202601 -> window 2026-01-01..2026-01-31, deadline 2026-02-10.

Timestamps are set on both `created_at` and `source_created_at`, since the timestamp to use is not decided yet.

    Ethiopia (Country)
    ├── Afar (Region)
    │   └── Awsi (District)
    │       └── HP H (Health post, in "Special targets" group) ... MISSING
    ├── Amhara (Region)
    │   └── North Gondar (District)
    │       ├── HF E (Facility, also in "Special targets") ...... LATE     (2026-03-01)
    │       ├── HF F (Facility) ................................. MISSING
    │       └── HF G (Facility, REJECTED) ....................... ignored  (on time submission)
    ├── Oromia (Region)
    │   ├── Jimma (District)
    │   │   ├── HF A (Facility) ................................. ON_TIME  (2026-01-15, and a later one 2026-02-20)
    │   │   ├── HF B (Facility) ................................. LATE     (2026-02-11 00:30)
    │   │   └── HF C (Facility) ................................. MISSING  (only deleted / empty file / other form /
    │   │                                                                   other period submissions)
    │   └── East Shewa (District)
    │       └── HF D (Facility) ................................. ON_TIME  (2026-02-10 23:30, deadline day)
    └── Somali (Region, no children)

Expected figures (expected / on_time / late / missing):
    Ethiopia 7/2/2/3 - Afar 1/0/0/1 - Amhara 2/0/1/1 - Oromia 4/2/1/1 - Somali 0/0/0/0
    Awsi 1/0/0/1 - North Gondar 2/0/1/1 - Jimma 3/1/1/1 - East Shewa 1/1/0/0
"""

import datetime

from django.utils import timezone

from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_COMPLETENESS_STATS_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
)
from iaso.test import APITestCase


ROW_KEYS = {
    "id",
    "name",
    "org_unit_type_id",
    "parent_org_unit",
    "has_children",
    "expected",
    "received",
    "completeness_percent",
    "on_time",
    "on_time_percent",
    "late",
    "late_percent",
    "missing",
    "missing_percent",
}
TOTALS_KEYS = ROW_KEYS - {"id", "name", "org_unit_type_id", "parent_org_unit", "has_children"}
PERIOD_KEYS = {"value", "start", "end", "grace_period_days", "deadline", "is_current", "is_provisional"}
RESPONSE_KEYS = {
    "period",
    "totals",
    "count",
    "has_next",
    "has_previous",
    "page",
    "pages",
    "limit",
    "results",
}


def aware(*args) -> datetime.datetime:
    return timezone.make_aware(datetime.datetime(*args))


class PromptnessStatsTestCase(APITestCase):
    maxDiff = None

    URL = "/api/promptness_stats/"
    EXPORT_CSV_URL = "/api/promptness_stats/export_csv/"

    PERIOD = "202601"
    # Date at which the tests run by default: long after the deadline, so figures are final
    TODAY = datetime.datetime(2026, 9, 28, 12, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.version, cls.project = cls.create_account_datasource_version_project(
            "source", "account", "project"
        )
        (
            cls.other_account,
            cls.other_data_source,
            cls.other_version,
            cls.other_project,
        ) = cls.create_account_datasource_version_project("other source", "other account", "other project")

        # Users
        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_COMPLETENESS_STATS_PERMISSION]
        )
        cls.user_registry_read = cls.create_user_with_profile(
            username="user_registry_read", account=cls.account, permissions=[CORE_REGISTRY_READ_PERMISSION]
        )
        cls.user_registry_write = cls.create_user_with_profile(
            username="user_registry_write", account=cls.account, permissions=[CORE_REGISTRY_WRITE_PERMISSION]
        )
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account)

        # Org unit types
        cls.type_country = cls.create_org_unit_type("Country", category="test", projects=[cls.project])
        cls.type_region = cls.create_org_unit_type("Region", category="test", projects=[cls.project])
        cls.type_district = cls.create_org_unit_type("District", category="test", projects=[cls.project])
        cls.type_facility = cls.create_org_unit_type("Facility", category="test", projects=[cls.project])
        cls.type_health_post = cls.create_org_unit_type("Health post", category="test", projects=[cls.project])
        cls.type_other_account = cls.create_org_unit_type(
            "Other account type", category="test", projects=[cls.other_project]
        )

        # Org units
        cls.ethiopia = cls.create_ou("Ethiopia", cls.type_country)
        cls.afar = cls.create_ou("Afar", cls.type_region, cls.ethiopia)
        cls.amhara = cls.create_ou("Amhara", cls.type_region, cls.ethiopia)
        cls.oromia = cls.create_ou("Oromia", cls.type_region, cls.ethiopia)
        cls.somali = cls.create_ou("Somali", cls.type_region, cls.ethiopia)

        cls.awsi = cls.create_ou("Awsi", cls.type_district, cls.afar)
        cls.north_gondar = cls.create_ou("North Gondar", cls.type_district, cls.amhara)
        cls.jimma = cls.create_ou("Jimma", cls.type_district, cls.oromia)
        cls.east_shewa = cls.create_ou("East Shewa", cls.type_district, cls.oromia)

        cls.hf_a = cls.create_ou("HF A", cls.type_facility, cls.jimma)
        cls.hf_b = cls.create_ou("HF B", cls.type_facility, cls.jimma)
        cls.hf_c = cls.create_ou("HF C", cls.type_facility, cls.jimma)
        cls.hf_d = cls.create_ou("HF D", cls.type_facility, cls.east_shewa)
        cls.hf_e = cls.create_ou("HF E", cls.type_facility, cls.north_gondar)
        cls.hf_f = cls.create_ou("HF F", cls.type_facility, cls.north_gondar)
        cls.hf_g = cls.create_ou(
            "HF G", cls.type_facility, cls.north_gondar, validation_status=m.OrgUnit.VALIDATION_REJECTED
        )
        cls.hp_h = cls.create_ou("HP H", cls.type_health_post, cls.awsi)

        cls.other_account_ou = m.OrgUnit.objects.create(
            name="Other account OU",
            org_unit_type=cls.type_other_account,
            version=cls.other_version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        # Users restricted to a part of the pyramid
        cls.user_restricted = cls.create_user_with_profile(
            username="user_restricted",
            account=cls.account,
            permissions=[CORE_COMPLETENESS_STATS_PERMISSION],
            org_units=[cls.oromia],
        )

        # Groups
        cls.group_special = m.Group.objects.create(name="Special targets", source_version=cls.version)
        cls.group_special.org_units.set([cls.hp_h, cls.hf_e])

        # Forms
        cls.form = m.Form.objects.create(
            name="Monthly facility report", period_type="MONTH", promptness_grace_period_days=10
        )
        cls.form.org_unit_types.add(cls.type_facility)
        cls.form.org_unit_groups.add(cls.group_special)

        cls.other_form = m.Form.objects.create(name="Other form", period_type="MONTH", promptness_grace_period_days=10)
        cls.other_form.org_unit_types.add(cls.type_facility)

        cls.form_without_grace_period = m.Form.objects.create(
            name="Form without grace period", period_type="MONTH", promptness_grace_period_days=None
        )
        cls.form_without_grace_period.org_unit_types.add(cls.type_facility)

        cls.form_without_period_type = m.Form.objects.create(
            name="Form without period type", period_type=None, promptness_grace_period_days=10
        )
        cls.form_without_period_type.org_unit_types.add(cls.type_facility)

        cls.form_quarterly = m.Form.objects.create(
            name="Quarterly form", period_type="QUARTER", promptness_grace_period_days=15
        )
        cls.form_quarterly.org_unit_types.add(cls.type_facility)

        cls.project.forms.add(
            cls.form,
            cls.other_form,
            cls.form_without_grace_period,
            cls.form_without_period_type,
            cls.form_quarterly,
        )

        cls.form_other_account = m.Form.objects.create(
            name="Other account form", period_type="MONTH", promptness_grace_period_days=10
        )
        cls.other_project.forms.add(cls.form_other_account)

        # Submissions
        cls.create_submission(cls.hf_a, aware(2026, 1, 15, 10, 0))  # on time
        cls.create_submission(cls.hf_a, aware(2026, 2, 20, 10, 0))  # late, but not the earliest one
        cls.create_submission(cls.hf_b, aware(2026, 2, 11, 0, 30))  # late (just after the deadline)
        cls.create_submission(cls.hf_c, aware(2026, 1, 10, 10, 0), deleted=True)  # deleted: ignored
        cls.create_submission(cls.hf_c, aware(2026, 1, 12, 10, 0), file="")  # no file: ignored
        cls.create_submission(cls.hf_c, aware(2026, 1, 10, 10, 0), form=cls.other_form)  # other form: ignored
        cls.create_submission(cls.hf_c, aware(2026, 2, 5, 10, 0), period="202602")  # other period: ignored
        cls.create_submission(cls.hf_d, aware(2026, 2, 10, 23, 30))  # on time (deadline day is inclusive)
        cls.create_submission(cls.hf_e, aware(2026, 3, 1, 10, 0))  # late
        cls.create_submission(cls.hf_g, aware(2026, 1, 5, 10, 0))  # rejected org unit: ignored

    @classmethod
    def create_ou(cls, name, org_unit_type, parent=None, validation_status=m.OrgUnit.VALIDATION_VALID):
        return m.OrgUnit.objects.create(
            name=name,
            org_unit_type=org_unit_type,
            parent=parent,
            version=cls.version,
            validation_status=validation_status,
        )

    @classmethod
    def create_submission(cls, org_unit, submitted_at, form=None, period=None, file=None, **kwargs):
        instance = m.Instance.objects.create(
            form=form or cls.form,
            org_unit=org_unit,
            period=period or cls.PERIOD,
            project=cls.project,
            file=cls.create_file_mock(name="test.xml") if file is None else file,
            source_created_at=submitted_at,
            source_updated_at=submitted_at,
            **kwargs,
        )
        # `created_at` is `auto_now_add`: force it with an update
        m.Instance.objects.filter(pk=instance.pk).update(created_at=submitted_at)
        return instance

    def get_serializer_params(self, **kwargs):
        params = {"form_id": self.form.id, "period": self.PERIOD, "parent_org_unit_id": self.ethiopia.id}
        params.update(kwargs)
        return {key: value for key, value in params.items() if value is not None}

    @staticmethod
    def counts(expected, on_time, late, missing, received, completeness_pct, on_time_pct, late_pct, missing_pct):
        return {
            "expected": expected,
            "received": received,
            "completeness_percent": completeness_pct,
            "on_time": on_time,
            "on_time_percent": on_time_pct,
            "late": late,
            "late_percent": late_pct,
            "missing": missing,
            "missing_percent": missing_pct,
        }

    def row(self, org_unit, has_children, *counts):
        return {
            "id": org_unit.id,
            "name": org_unit.name,
            "org_unit_type_id": org_unit.org_unit_type_id,
            "parent_org_unit": {"id": org_unit.parent.id, "name": org_unit.parent.name} if org_unit.parent else None,
            "has_children": has_children,
            **self.counts(*counts),
        }

    # Expected rows / totals, see the module docstring
    def expected_ethiopia_totals(self):
        return self.counts(7, 2, 2, 3, 4, 57.1, 28.6, 28.6, 42.9)

    def expected_afar_row(self):
        return self.row(self.afar, True, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0)

    def expected_amhara_row(self):
        return self.row(self.amhara, True, 2, 0, 1, 1, 1, 50.0, 0.0, 50.0, 50.0)

    def expected_oromia_row(self):
        return self.row(self.oromia, True, 4, 2, 1, 1, 3, 75.0, 50.0, 25.0, 25.0)

    def expected_somali_row(self):
        return self.row(self.somali, False, 0, 0, 0, 0, 0, None, None, None, None)

    def expected_awsi_row(self):
        return self.row(self.awsi, True, 1, 0, 0, 1, 0, 0.0, 0.0, 0.0, 100.0)

    def expected_north_gondar_row(self):
        return self.row(self.north_gondar, True, 2, 0, 1, 1, 1, 50.0, 0.0, 50.0, 50.0)

    def expected_jimma_row(self):
        return self.row(self.jimma, True, 3, 1, 1, 1, 2, 66.7, 33.3, 33.3, 33.3)

    def expected_east_shewa_row(self):
        return self.row(self.east_shewa, True, 1, 1, 0, 0, 1, 100.0, 100.0, 0.0, 0.0)
