import datetime
import json
import uuid

from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.tests.api.entities.common_base_with_setup import EntityAPITestCase


class MobileEntityAPITestCase(EntityAPITestCase):
    BASE_URL = "/api/mobile/entities/"

    def test_list_entities_empty_does_not_issue_extra_query_for_queryset_truthiness(self):
        self.client.force_authenticate(self.yoda)

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})

        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 0)
        # `filter_for_mobile_entity` must not force early evaluation of an empty
        # queryset (e.g. via `if queryset:`), which would add an extra query.
        self.assertEqual(len(ctx.captured_queries), 7)

    def test_list_entities_page_two_of_empty_result_returns_404(self):
        """MobileEntitiesSetPagination.paginate_queryset special-cases an empty page 1 (total_count=0,
        no fallback count() query needed). Page >1 of a genuinely empty result is the one case that
        still falls back to a real count() query, to tell it apart from a page number past the end of
        a *non-empty* result -- both must still 404, matching DRF's default pagination behaviour."""
        self.client.force_authenticate(self.yoda)

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "page": 2})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        # Same total as the page-1 empty case: one more query than that (the fallback count() to tell
        # "genuinely empty" apart from "page number past the end"), but one fewer because raising
        # NotFound short-circuits before get_serializer_context's FormVersion query ever runs.
        self.assertEqual(len(ctx.captured_queries), 7)

    def test_list_entities_non_integer_page_returns_400(self):
        """MobileEntitiesSetPagination.get_iaso_page_number must reject a non-integer `page` the same
        way DRF's default pagination does -- a clean 400, not an unhandled ValueError -> 500."""
        self.client.force_authenticate(self.yoda)

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "page": "abc"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_entities_pagination_issues_a_single_entity_query_for_count_and_data(self):
        """Guards the count+data merge in MobileEntitiesSetPagination: a non-empty page must produce
        exactly one entity query -- `Window(Count("id"))` annotated onto the same LIMIT/OFFSET query --
        not the two separate queries (a `.count()`, then a data slice) DRF's default paginator would
        issue for the same request."""
        for i in range(3):
            instance = self.create_form_instance(
                project=self.project, org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4()
            )
            entity = m.Entity.objects.create(
                name=f"entity_{i}", entity_type=self.entity_type, attributes=instance, account=self.account
            )
            instance.entity = entity
            instance.save()

        self.client.force_authenticate(self.yoda)
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})

        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 3)

        entity_queries = [q["sql"] for q in ctx.captured_queries if 'FROM "iaso_entity"' in q["sql"]]
        self.assertEqual(
            len(entity_queries),
            1,
            f"expected a single count+data entity query, got {len(entity_queries)}: {entity_queries}",
        )
        self.assertIn("OVER (", entity_queries[0])

    def test_list_entities_with_filtered_out_entities_with_soft_deleted_instances(self):
        uuid_valid_instance = uuid.uuid4()
        valid_instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid_valid_instance,
        )
        entity_with_valid_instance = m.Entity.objects.create(
            name="valid",
            entity_type=self.entity_type,
            attributes=valid_instance,
            account=self.account,
        )
        valid_instance.entity = entity_with_valid_instance
        valid_instance.save()

        uuid_deleted_instance = uuid.uuid4()
        deleted_instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            deleted=True,
            uuid=uuid_deleted_instance,
        )
        entity_with_deleted_instance = m.Entity.objects.create(
            name="deleted",
            entity_type=self.entity_type,
            attributes=deleted_instance,
            account=self.account,
        )
        deleted_instance.entity = entity_with_deleted_instance
        deleted_instance.save()

        self.client.force_authenticate(self.yoda)
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(response_json["count"], 1)  # Only the entity with the valid instance should be returned

        entity = response_json["results"][0]
        self.assertEqual(entity["defining_instance_id"], str(uuid_valid_instance))

    def test_list_entities_no_duplicates_in_response(self):
        """Test that the same entity is not present twice in the API response"""
        # Create entity with single instance
        uuid_instance = uuid.uuid4()
        instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid_instance,
        )
        entity = m.Entity.objects.create(
            name="test_entity",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.account,
        )
        instance.entity = entity
        instance.save()

        # Create a second instance for the same entity
        uuid_instance_2 = uuid.uuid4()
        instance_2 = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid_instance_2,
        )
        instance_2.entity = entity
        instance_2.save()
        self.yoda.iaso_profile.org_units.add(self.ou_country)
        self.client.force_authenticate(self.yoda)
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify only one entity is returned despite having multiple instances
        self.assertEqual(response_json["count"], 1)

        # Extract all entity IDs from response
        entity_ids = [entity["id"] for entity in response_json["results"]]

        # Verify no duplicate entity IDs
        self.assertEqual(len(entity_ids), len(set(entity_ids)), "Found duplicate entities in response")

    def test_list_entities_no_duplicates_when_org_unit_in_multiple_groups(self):
        """Unlike `/api/entities/`, the mobile endpoint has no `groups` query param -- `MobileEntityViewSet`
        sets no `filterset_class`/`filterset_fields`, so DjangoFilterBackend silently ignores one if passed.
        But an org unit belonging to several groups is a real `Group.org_units` m2m regardless of whether
        anything filters on it, and `get_queryset` builds this response with a plain `select_related` (a
        JOIN) rather than the `Exists(...)` pattern `EntityFilterSet.filter_groups` relies on -- so this
        guards that group membership alone can't join-multiply the Entity row in a mobile sync response."""
        group_1 = m.Group.objects.create(name="Group 1", source_version=self.sw_version)
        group_2 = m.Group.objects.create(name="Group 2", source_version=self.sw_version)
        group_1.org_units.add(self.ou_country)
        group_2.org_units.add(self.ou_country)

        instance = self.create_form_instance(
            project=self.project, org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4()
        )
        entity = m.Entity.objects.create(
            name="entity_in_two_groups", entity_type=self.entity_type, attributes=instance, account=self.account
        )
        instance.entity = entity
        instance.save()

        self.yoda.iaso_profile.org_units.add(self.ou_country)
        self.client.force_authenticate(self.yoda)

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        entity_ids = [e["id"] for e in response_json["results"]]
        self.assertEqual(entity_ids, [str(entity.uuid)], f"expected a single entity, got {entity_ids}")
        self.assertEqual(response_json["count"], 1)

    def test_list_entities_filter_by_limit_date_ignores_soft_deleted_instances(self):
        self.client.force_authenticate(self.yoda)

        # context for the serializer
        m.FormVersion.objects.create(form=self.form_1, version_id="1")

        now = timezone.now()
        older_date = now - datetime.timedelta(days=10)
        newer_date = now - datetime.timedelta(days=2)
        limit_date_str = (now - datetime.timedelta(days=5)).strftime("%Y-%m-%d")

        inst_older_1 = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            json={"_version": "1"},
        )
        entity_1 = m.Entity.objects.create(
            name="entity_1",
            entity_type=self.entity_type,
            attributes=inst_older_1,
            account=self.account,
        )
        inst_older_1.entity = entity_1
        inst_older_1.save()
        m.Instance.objects.filter(pk=inst_older_1.pk).update(updated_at=older_date)

        inst_newer_deleted = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            json={"_version": "1"},
            deleted=True,
            entity=entity_1,
        )
        m.Instance.objects.filter(pk=inst_newer_deleted.pk).update(updated_at=newer_date)

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "limit_date": limit_date_str})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 0)

        inst_newer_deleted.deleted = False
        inst_newer_deleted.save()

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "limit_date": limit_date_str})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)

    def test_get_entities_by_type_ignores_soft_deleted_instances(self):
        self.client.force_authenticate(self.yoda)

        # context for the serializer
        m.FormVersion.objects.create(form=self.form_1, version_id="1")

        now = timezone.now()
        older_date = now - datetime.timedelta(days=10)
        newer_date = now - datetime.timedelta(days=2)
        limit_date_str = (now - datetime.timedelta(days=5)).strftime("%Y-%m-%d")

        inst_older = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            json={"_version": "1"},
        )
        entity = m.Entity.objects.create(
            name="type_entity",
            entity_type=self.entity_type,
            attributes=inst_older,
            account=self.account,
        )
        inst_older.entity = entity
        inst_older.save()
        m.Instance.objects.filter(pk=inst_older.pk).update(updated_at=older_date)

        inst_newer_deleted = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            json={"_version": "1"},
            deleted=True,
            entity=entity,
        )
        m.Instance.objects.filter(pk=inst_newer_deleted.pk).update(updated_at=newer_date)

        url = f"/api/mobile/entitytypes/{self.entity_type.pk}/entities/"
        response = self.client.get(url, {"app_id": self.project.app_id, "limit_date": limit_date_str})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 0)

        inst_newer_deleted.deleted = False
        inst_newer_deleted.save()

        response = self.client.get(url, {"app_id": self.project.app_id, "limit_date": limit_date_str})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)

    def test_get_entities_by_type_filtered_by_json_content(self):
        self.client.force_authenticate(self.yoda)

        # context for the serializer
        m.FormVersion.objects.create(form=self.form_1, version_id="1")

        inst_a = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            json={"_version": "1", "name": "Robert", "age__int__": 25},
        )
        entity_a = m.Entity.objects.create(
            name="entity_a",
            entity_type=self.entity_type,
            attributes=inst_a,
            account=self.account,
        )
        inst_a.entity = entity_a
        inst_a.save()

        inst_b = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            json={"_version": "1", "name": "Luke", "age__int__": 19},
        )
        entity_b = m.Entity.objects.create(
            name="entity_b",
            entity_type=self.entity_type,
            attributes=inst_b,
            account=self.account,
        )
        inst_b.entity = entity_b
        inst_b.save()

        url = f"/api/mobile/entitytypes/{self.entity_type.pk}/entities/"

        json_content_filter_1 = json.dumps({"==": [{"var": "age__int__"}, 25]})
        response = self.client.get(url, {"app_id": self.project.app_id, "json_content": json_content_filter_1})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["id"], str(entity_a.uuid))

        json_content_filter_2 = json.dumps({"==": [{"var": "name"}, "Luke"]})
        response = self.client.get(url, {"app_id": self.project.app_id, "json_content": json_content_filter_2})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["id"], str(entity_b.uuid))

        inst_a.deleted = True
        inst_a.save()

        response = self.client.get(url, {"app_id": self.project.app_id, "json_content": json_content_filter_1})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 0)

    def test_list_entities_no_duplicates_when_reference_form_shared_across_projects(self):
        """A reference form linked to several projects must not duplicate entities in the response
        (guards the join -> `entity_type__in=EntityType.objects.filter(...)` subquery rewrite in
        filter_for_app_id: a JOIN through the projects m2m could in principle multiply rows if a form
        matched more than once, an IN-subquery can't, no matter how many projects share the form)."""
        other_project = m.Project.objects.create(name="Other project", app_id="other_project", account=self.account)
        self.form_1.projects.add(other_project)

        instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid.uuid4(),
        )
        entity = m.Entity.objects.create(
            name="shared_form_entity",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.account,
        )
        instance.entity = entity
        instance.save()

        self.client.force_authenticate(self.yoda)
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["id"], str(entity.uuid))

    def test_list_entities_combines_org_unit_scope_and_limit_date_correctly(self):
        """Both the org-unit restriction (filter_for_user) and limit_date (filter_for_mobile_entity)
        must still apply correctly now that they're merged into a single correlated Exists(...)
        against iaso_instance instead of two separate ones, for entities that satisfy only one of the
        two conditions, only the other, both, or neither."""
        ou_other = m.OrgUnit.objects.create(name="Other country", validation_status=m.OrgUnit.VALIDATION_VALID)
        self.yoda.iaso_profile.org_units.add(self.ou_country)

        now = timezone.now()
        limit_date_str = (now - datetime.timedelta(days=5)).strftime("%Y-%m-%d")
        recent_date = now - datetime.timedelta(days=2)
        old_date = now - datetime.timedelta(days=10)

        def make_entity(name, org_unit, updated_at):
            instance = self.create_form_instance(
                project=self.project, org_unit=org_unit, form=self.form_1, uuid=uuid.uuid4()
            )
            entity = m.Entity.objects.create(
                name=name, entity_type=self.entity_type, attributes=instance, account=self.account
            )
            instance.entity = entity
            instance.save()
            m.Instance.objects.filter(pk=instance.pk).update(updated_at=updated_at)
            return entity

        # In scope (ou_country) and recent -> should be the only one returned.
        entity_in_scope_recent = make_entity("in_scope_recent", self.ou_country, recent_date)
        # In scope but stale -> excluded by limit_date.
        make_entity("in_scope_old", self.ou_country, old_date)
        # Recent but outside the user's org unit scope -> excluded by org unit restriction.
        make_entity("out_of_scope_recent", ou_other, recent_date)
        # Neither in scope nor recent -> excluded by both.
        make_entity("out_of_scope_old", ou_other, old_date)

        self.client.force_authenticate(self.yoda)
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "limit_date": limit_date_str})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["id"], str(entity_in_scope_recent.uuid))

    def test_list_entities_full_sync_without_limit_date_includes_stale_entities(self):
        """A full sync (limit_date omitted entirely, as the mobile app does on first install --
        see FetchEntities.kt) must return entities regardless of activity date, including ones an
        incremental sync (limit_date set) would exclude. Exercises filter_for_user's merged
        Exists(...) with only the org-unit condition present (limit_date=None), distinct from
        test_list_entities_combines_org_unit_scope_and_limit_date_correctly above, which only
        covers the case where both conditions are present together."""
        self.yoda.iaso_profile.org_units.add(self.ou_country)

        now = timezone.now()
        old_date = now - datetime.timedelta(days=10)
        excluding_limit_date_str = (now - datetime.timedelta(days=5)).strftime("%Y-%m-%d")
        including_limit_date_str = (now - datetime.timedelta(days=15)).strftime("%Y-%m-%d")

        instance = self.create_form_instance(
            project=self.project, org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4()
        )
        stale_entity = m.Entity.objects.create(
            name="stale", entity_type=self.entity_type, attributes=instance, account=self.account
        )
        instance.entity = stale_entity
        instance.save()
        m.Instance.objects.filter(pk=instance.pk).update(updated_at=old_date)

        self.client.force_authenticate(self.yoda)

        # Full sync: no limit_date param at all -> the stale entity is still returned.
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["id"], str(stale_entity.uuid))

        # Same entity, incremental sync with a cutoff *after* its update: excluded.
        response = self.client.get(
            self.BASE_URL, {"app_id": self.project.app_id, "limit_date": excluding_limit_date_str}
        )
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 0)

        # Same entity, incremental sync with a cutoff *before* its update: still included. Without
        # this, the previous assertion alone couldn't tell "correctly filters by date" apart from
        # "always excludes everything once limit_date is present at all".
        response = self.client.get(
            self.BASE_URL, {"app_id": self.project.app_id, "limit_date": including_limit_date_str}
        )
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["id"], str(stale_entity.uuid))

    def test_list_entities_pagination_matches_count_and_pages(self):
        """The count+data-in-one-query paginator (Window(Count())) must report the same count/
        has_next/has_previous/pages a plain queryset would, across a full page, the true last
        *partial* page, and one page past the end (404, matching DRF's default pagination)."""
        self.client.force_authenticate(self.yoda)

        entities = []
        for i in range(5):
            instance = self.create_form_instance(
                project=self.project, org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4()
            )
            entity = m.Entity.objects.create(
                name=f"entity_{i}", entity_type=self.entity_type, attributes=instance, account=self.account
            )
            instance.entity = entity
            instance.save()
            entities.append(entity)

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "limit": 3, "page": 1})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 5)
        self.assertEqual(response_json["pages"], 2)
        self.assertEqual(len(response_json["results"]), 3)
        self.assertTrue(response_json["has_next"])
        self.assertFalse(response_json["has_previous"])

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "limit": 3, "page": 2})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 5)
        self.assertEqual(response_json["pages"], 2)
        self.assertEqual(len(response_json["results"]), 2)
        self.assertFalse(response_json["has_next"])
        self.assertTrue(response_json["has_previous"])

        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id, "limit": 3, "page": 3})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
