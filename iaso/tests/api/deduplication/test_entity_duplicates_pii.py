import json

from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
    CORE_SUBMISSIONS_PII_PERMISSION,
)
from iaso.test import APITestCase


class EntityDuplicatesPiiAPITestCase(APITestCase):
    """The entity duplicates API must hide the PII of the entities' attributes from users without the PII permission."""

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        source = m.DataSource.objects.create(name="Source")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.account.default_version = version
        cls.account.save()
        cls.project = m.Project.objects.create(name="Project", app_id="project", account=cls.account)
        source.projects.add(cls.project)
        cls.org_unit = m.OrgUnit.objects.create(name="Clinic", version=version, validation_status="VALID")

        possible_fields = [
            {"name": "first_name", "label": "First name", "type": "text"},
            {"name": "muac", "label": "MUAC", "type": "decimal"},
            {"name": "district", "label": "District", "type": "text"},
        ]
        # Form with a PII configuration: only `muac` and `district` are not personal data.
        cls.form = m.Form.objects.create(
            name="Visit", form_id="visit", non_pii_fields=["muac", "district"], possible_fields=possible_fields
        )
        # Form without PII configuration: never filtered.
        cls.open_form = m.Form.objects.create(name="Open", form_id="open", possible_fields=possible_fields)
        for form in (cls.form, cls.open_form):
            form.projects.add(cls.project)
            m.FormVersion.objects.create(form=form, version_id="1", form_descriptor={})

        cls.entity_type = m.EntityType.objects.create(name="Child", account=cls.account, reference_form=cls.form)
        cls.open_entity_type = m.EntityType.objects.create(
            name="Open child", account=cls.account, reference_form=cls.open_form
        )

        cls.entity1 = cls.create_entity(cls.entity_type, cls.form, "Amina", "12.5", "North")
        cls.entity2 = cls.create_entity(cls.entity_type, cls.form, "Aminata", "12.4", "North")
        analyze = m.EntityDuplicateAnalyzis.objects.create(
            algorithm="levenshtein",
            metadata={"entity_type_id": cls.entity_type.id, "fields": ["first_name", "muac"]},
        )
        cls.duplicate = m.EntityDuplicate.objects.create(
            entity1=cls.entity1, entity2=cls.entity2, analyze=analyze, similarity_score=90
        )

        cls.open_entity1 = cls.create_entity(cls.open_entity_type, cls.open_form, "Fatou", "13.1", "South")
        cls.open_entity2 = cls.create_entity(cls.open_entity_type, cls.open_form, "Fatoumata", "13.0", "South")
        open_analyze = m.EntityDuplicateAnalyzis.objects.create(
            algorithm="levenshtein",
            metadata={"entity_type_id": cls.open_entity_type.id, "fields": ["first_name", "muac"]},
        )
        cls.open_duplicate = m.EntityDuplicate.objects.create(
            entity1=cls.open_entity1, entity2=cls.open_entity2, analyze=open_analyze, similarity_score=90
        )

        cls.user = cls.create_user_with_profile(
            username="user", account=cls.account, permissions=[CORE_ENTITIES_DUPLICATES_READ_PERMISSION]
        )
        cls.pii_user = cls.create_user_with_profile(
            username="pii_user",
            account=cls.account,
            permissions=[CORE_ENTITIES_DUPLICATES_READ_PERMISSION, CORE_SUBMISSIONS_PII_PERMISSION],
        )

    @classmethod
    def create_entity(cls, entity_type, form, first_name, muac, district):
        entity = m.Entity.objects.create(entity_type=entity_type, account=cls.account)
        instance = cls.create_form_instance(
            form=form,
            project=cls.project,
            org_unit=cls.org_unit,
            entity=entity,
            json={"first_name": first_name, "muac": muac, "district": district, "_version": "1"},
        )
        entity.attributes = instance
        entity.save()
        return entity

    def get_list(self):
        return self.assertJSONResponse(self.client.get("/api/entityduplicates/"), status.HTTP_200_OK)

    def get_duplicate(self, duplicate):
        return self.assertJSONResponse(self.client.get(f"/api/entityduplicates/{duplicate.id}/"), status.HTTP_200_OK)

    def get_detail_fields(self, duplicate):
        data = self.assertJSONResponse(
            self.client.get(
                "/api/entityduplicates/detail/", {"entities": f"{duplicate.entity1.id},{duplicate.entity2.id}"}
            ),
            status.HTTP_200_OK,
        )
        return {row["the_field"]["field"]: (row["entity1"]["value"], row["entity2"]["value"]) for row in data["fields"]}

    def find_in_list(self, data, duplicate):
        return next(row for row in data["results"] if row["id"] == duplicate.id)

    def test_list_and_retrieve_hide_pii_without_permission(self):
        self.client.force_authenticate(self.user)

        for row in (self.find_in_list(self.get_list(), self.duplicate), self.get_duplicate(self.duplicate)):
            self.assertNotIn("Amina", json.dumps(row))
            self.assertEqual(row["entity1"]["json"], {"muac": "12.5", "district": "North", "_version": "1"})
            self.assertEqual(row["entity2"]["json"], {"muac": "12.4", "district": "North", "_version": "1"})

    def test_list_and_retrieve_show_pii_with_permission(self):
        self.client.force_authenticate(self.pii_user)

        for row in (self.find_in_list(self.get_list(), self.duplicate), self.get_duplicate(self.duplicate)):
            self.assertEqual(row["entity1"]["json"]["first_name"], "Amina")
            self.assertEqual(row["entity2"]["json"]["first_name"], "Aminata")
            self.assertEqual(row["entity1"]["json"]["muac"], "12.5")

    def test_detail_view_hides_pii_without_permission(self):
        self.client.force_authenticate(self.user)
        fields = self.get_detail_fields(self.duplicate)
        self.assertEqual(fields, {"muac": ("12.5", "12.4"), "district": ("North", "North")})

    def test_detail_view_shows_pii_with_permission(self):
        self.client.force_authenticate(self.pii_user)
        fields = self.get_detail_fields(self.duplicate)
        self.assertEqual(fields["first_name"], ("Amina", "Aminata"))
        self.assertEqual(fields["muac"], ("12.5", "12.4"))

    def test_form_without_pii_configuration_is_not_filtered(self):
        self.client.force_authenticate(self.user)

        row = self.get_duplicate(self.open_duplicate)
        self.assertEqual(row["entity1"]["json"]["first_name"], "Fatou")
        self.assertEqual(row["entity2"]["json"]["first_name"], "Fatoumata")

        fields = self.get_detail_fields(self.open_duplicate)
        self.assertEqual(fields["first_name"], ("Fatou", "Fatoumata"))
