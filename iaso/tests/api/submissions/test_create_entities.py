import uuid

from rest_framework import status

from iaso import models as m
from iaso.tests.api.submissions.fixtures import SubmissionsTestCase, create_form_version, requires_odk_cli


REGISTRATION_SURVEY = {
    "type": "survey",
    "name": "data",
    "id_string": "child_registration",
    "title": "Child registration",
    "version": "2026110801",
    "children": [
        {"type": "text", "name": "child_name", "label": "Name", "bind": {"required": "true()"}},
        {
            "type": "group",
            "name": "meta",
            "control": {"bodyless": True},
            "children": [
                {"type": "calculate", "name": "instanceID", "bind": {"readonly": "true()", "jr:preload": "uid"}}
            ],
        },
    ],
}


@requires_odk_cli
class SubmissionsCreateEntitiesTestCase(SubmissionsTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.registration = m.Form.objects.create(name="Child registration")
        cls.registration.projects.add(cls.project)
        cls.registration.org_unit_types.add(cls.district)
        create_form_version(cls.registration, REGISTRATION_SURVEY)
        cls.child = m.EntityType.objects.create(name="Child", account=cls.account, reference_form=cls.registration)
        cls.france_type = m.EntityType.objects.create(name="Enfant", account=cls.france)

    def registering(self, **entity):
        return {
            "ref": "registration",
            "form_id": self.registration.id,
            "org_unit_id": self.antwerp.id,
            "entity": {"entity_type_id": self.child.id, **entity},
            "content": {"child_name": "Bob"},
        }

    def following(self, entity_uuid, **overrides):
        return self.submission(
            ref="follow-up", entity={"uuid": entity_uuid, "entity_type_id": self.child.id}, **overrides
        )

    def errors(self, response, index=0):
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(m.Entity.objects_include_deleted.filter(attributes__isnull=False).exists())
        return [(error["code"], error["field"]) for error in data["results"][index]["errors"]]

    def test_registration_creates_the_entity(self):
        entity_uuid = str(uuid.uuid4())

        data = self.assertJSONResponse(self.post(self.registering(uuid=entity_uuid)), status.HTTP_201_CREATED)

        self.assertResponseCompliantToSwagger(data, "SubmissionsResult")
        self.assertEqual(data["results"][0]["entity_uuid"], entity_uuid)
        entity = m.Entity.objects.get()
        instance = m.Instance.objects.get()
        self.assertEqual(
            (str(entity.uuid), entity.entity_type, entity.account, entity.attributes),
            (entity_uuid, self.child, self.account, instance),
        )
        self.assertEqual(instance.entity, entity)

    def test_registration_without_uuid_gets_one(self):
        data = self.assertJSONResponse(self.post(self.registering()), status.HTTP_201_CREATED)

        self.assertEqual(str(m.Entity.objects.get().uuid), data["results"][0]["entity_uuid"])

    def test_registration_and_follow_up_in_one_request(self):
        entity_uuid = str(uuid.uuid4())

        self.assertJSONResponse(
            self.post(self.registering(uuid=entity_uuid), self.following(entity_uuid)), status.HTTP_201_CREATED
        )

        entity = m.Entity.objects.get()
        self.assertEqual(set(entity.instances.values_list("form_id", flat=True)), {self.registration.id, self.form.id})
        self.assertEqual(entity.attributes.form, self.registration)

    def test_follow_up_of_an_existing_entity(self):
        entity = m.Entity.objects.create(entity_type=self.child, account=self.account)

        self.assertJSONResponse(self.post(self.following(str(entity.uuid))), status.HTTP_201_CREATED)

        self.assertEqual(m.Instance.objects.get().entity, entity)
        entity.refresh_from_db()
        self.assertIsNone(entity.attributes, "a follow-up isn't the entity's registration")

    def test_refused(self):
        existing = m.Entity.objects.create(entity_type=self.child, account=self.account)
        french = m.Entity.objects.create(entity_type=self.france_type, account=self.france)
        cases = [
            # registered twice
            (self.registering(uuid=str(existing.uuid)), [("CONFLICT", "entity.uuid")]),
            # a follow-up doesn't create the entity it follows
            (self.following(str(uuid.uuid4())), [("UNKNOWN_REFERENCE", "entity.uuid")]),
            (
                self.submission(ref="follow-up", entity={"entity_type_id": self.child.id}),
                [("UNKNOWN_REFERENCE", "entity.uuid")],
            ),
            # another account's
            (self.following(str(french.uuid)), [("UNKNOWN_REFERENCE", "entity.uuid")]),
            (
                self.registering(entity_type_id=self.france_type.id),
                [("UNKNOWN_REFERENCE", "entity.entity_type_id")],
            ),
        ]
        for submission, errors in cases:
            with self.subTest(submission=submission):
                self.assertEqual(self.errors(self.post(submission)), errors)
        self.assertEqual(m.Entity.objects_include_deleted.count(), 2)

    def test_registered_twice_in_one_request(self):
        entity_uuid = str(uuid.uuid4())
        second = {**self.registering(uuid=entity_uuid), "ref": "again"}

        self.assertEqual(
            self.errors(self.post(self.registering(uuid=entity_uuid), second), 1), [("CONFLICT", "entity.uuid")]
        )
