from django.test import TestCase, tag
from django.db.models import Count, Func, Value, Case, When, BooleanField
from django.db.models.expressions import RawSQL
from django.contrib.postgres.aggregates import ArrayAgg
from ..models import (
    OrgUnit,
    Form,
    InstanceFile,
    Profile,
    Instance,
    OrgUnitType,
    Account,
    Project,
    DataSource,
    SourceVersion,
    User,
)
from datetime import datetime, date
from django.contrib.gis.geos import Point

from django.conf import settings


class DuplicatesTestCase(TestCase):
    def setUp(self):
        account = Account(name="Zelda")

        source = DataSource.objects.create(name="Korogu")
        version = SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()

        self.project = Project(
            name="Hyrule", app_id="magic.countries.hyrule.collect", account=account
        )
        self.project.save()

        source.projects.add(self.project)

        unit_type = OrgUnitType(name="Village", short_name="Vil")
        unit_type.save()
        self.project.unit_types.add(unit_type)
        self.village_unit_type = unit_type

        user = User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = Profile(user=user, account=account)
        p.save()
        self.user = user

        self.village_1 = OrgUnit.objects.create(
            name="Akkala", org_unit_type=unit_type, version=version
        )
        self.village_2 = OrgUnit.objects.create(
            name="Kakariko", org_unit_type=unit_type, version=version
        )
        form = Form(name="Quantity FORM")
        form.period_type = "monthly"
        form.single_per_period = True
        form.save()
        self.form = form

    def build_instance(self, org_unit, instance_uuid, period):

        instance = Instance()
        instance.uuid = instance_uuid
        instance.export_id = "EVENT_DHIS2_UID"
        instance.created_at = datetime.strptime(
            "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
        )
        instance.org_unit = org_unit
        instance.json = {"question1": "1"}
        instance.location = Point(1.5, 7.3)
        instance.period = period
        instance.form = self.form
        instance.save()
        # force to past creation date
        # looks the the first save don't take it
        instance.created_at = datetime.strptime(
            "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
        )
        instance.save()
        return instance

    def uuid(self, number):
        return str(number) + "b7c3954-f69a-4b99-83b1-db73957b32b" + str(number)

    def test_duplications(self):

        self.build_instance(self.village_1, self.uuid(1), "201901")
        self.build_instance(self.village_1, self.uuid(2), "201901")
        self.build_instance(self.village_1, self.uuid(3), "201902")
        self.build_instance(self.village_1, self.uuid(4), "201903")

        self.build_instance(self.village_2, self.uuid(5), "201901")
        self.build_instance(self.village_2, self.uuid(6), "201902")
        self.build_instance(self.village_2, self.uuid(7), "201903")

        settings.DEBUG = True
        duplicate_ids_query = (
            Instance.objects.values("period", "form", "org_unit")
            .annotate(ids=ArrayAgg("id"))
            .annotate(c=Func("ids", Value(1), function="array_length"))
            .filter(form__in=Form.objects.filter(single_per_period=True))
            .filter(c__gt=1)
            .annotate(id=Func("ids", function="unnest"))
            .values("id")
        )

        instances = Instance.objects.annotate(
            duplicated=Case(
                When(id__in=duplicate_ids_query, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            )
        ).prefetch_related("form")

        for instance in instances:
            print(
                instance.uuid,
                instance.org_unit_id,
                instance.form.name,
                instance.period,
                instance.duplicated,
            )

        self.assertEqual(
            [instance.uuid for instance in instances if instance.duplicated],
            [self.uuid(1), self.uuid(2)],
        )

        self.assertEqual(
            [
                instance.uuid
                for instance in instances.order_by("uuid")
                if not instance.duplicated
            ],
            [self.uuid(3), self.uuid(4), self.uuid(5), self.uuid(6), self.uuid(7)],
        )

        print()
        print(
            "duplicated",
            Instance.objects.values("period", "form")
            .annotate(duplicated_count=Count("id"))
            .filter(id__in=duplicate_ids_query)
            .values_list("duplicated_count", "period", "form"),
        )

        print()
        print(
            "ready",
            Instance.objects.values("period", "form")
            .annotate(ready_count=Count("id"))
            .exclude(id__in=duplicate_ids_query)
            .values_list("ready_count", "period", "form"),
        )

        {}
