from django.db import IntegrityError
from django.test import TransactionTestCase

from iaso.models import Account, Form, Instance
from iaso.models.validation_workflow.templates import PositionChoices, ValidationNodeTemplate, ValidationWorkflow


class TestValidationWorkflow(TransactionTestCase):
    def test_ensure_slug_is_not_updating(self):
        d1 = ValidationWorkflow.objects.create(name="test", account=Account.objects.create(name="test"))
        slug_1 = d1.slug
        d1.name = "new test"
        d1.save()
        d1.refresh_from_db()
        self.assertEqual(slug_1, d1.slug)

    def test_slug_is_not_none_with_special_characters(self):
        sentences = [
            ["éééééééééééééöööööööööööööööööööööµ", "eeeeeeeeeeeeeooooooooooooooooooooou"],
            ["Ангажимент към околната среда", "angazhiment-km-okolnata-sreda"],
            ["Το ρολόι είναι δώρο", "to-roloi-einai-doro"],
        ]
        account = Account.objects.create(name="test")
        for sentence in sentences:
            with self.subTest(sentence=sentence[0]):
                d1 = ValidationWorkflow.objects.create(name=sentence[0], account=account)
                self.assertEqual(
                    d1.slug,
                    sentence[1],
                    f"Slugifying with special characters failed, expected {sentence[1]} got {d1.slug}, make sure unidecode is installed",
                )

    def test_ensure_slug_is_unique_with_account(self):
        account = Account.objects.create(name="test")
        other_account = Account.objects.create(name="another account")
        d1 = ValidationWorkflow.objects.create(name="test", account=account)
        d3 = ValidationWorkflow.objects.create(name="test", account=other_account)

        self.assertEqual(d1.slug, "test")
        self.assertEqual(d3.slug, "test")

    def test_is_artifact_allowed(self):
        form = Form.objects.create()
        workflow = ValidationWorkflow.objects.create(name="test", account=Account.objects.create(name="test"))
        workflow.form_set.set([form])

        another_workflow = ValidationWorkflow.objects.create(
            name="another-test", account=Account.objects.create(name="test2")
        )

        another_form = Form.objects.create()

        instance = Instance.objects.create(form=form)
        another_instance = Instance.objects.create(form=another_form)

        self.assertTrue(workflow.is_artifact_allowed(instance))

        self.assertFalse(workflow.is_artifact_allowed(another_instance))

        self.assertFalse(another_workflow.is_artifact_allowed(instance))
        self.assertFalse(another_workflow.is_artifact_allowed(another_instance))

    def test_unique_constraints(self):
        account = Account.objects.create(name="test")
        vf = ValidationWorkflow.objects.create(name="test", account=account)

        with self.assertRaises(IntegrityError):
            ValidationWorkflow.objects.create(name="test", account=account)

        vf.delete()

        vf.refresh_from_db()
        self.assertIsNotNone(vf.deleted_at)

        vf2 = ValidationWorkflow.objects.create(name="test", account=account)

        self.assertEqual(vf.slug, vf2.slug)
        self.assertEqual(vf.name, vf2.name)

    def _add_step(self, workflow, name, can_skip=True, position=PositionChoices.last):
        node = ValidationNodeTemplate.objects.create(workflow=workflow, name=name, can_skip_previous_nodes=can_skip)
        workflow.insert_node_template(node, position)
        return node

    def _can_skip(self, *nodes):
        return [ValidationNodeTemplate.objects.get(pk=node.pk).can_skip_previous_nodes for node in nodes]

    def test_first_step_cannot_skip_previous_nodes(self):
        workflow = ValidationWorkflow.objects.create(name="test", account=Account.objects.create(name="test"))

        with self.subTest("creating the first step"):
            step_1 = self._add_step(workflow, "step 1")
            step_2 = self._add_step(workflow, "step 2")
            self.assertEqual(self._can_skip(step_1, step_2), [False, True])

        with self.subTest("inserting a step in first position"):
            step_0 = self._add_step(workflow, "step 0", position=PositionChoices.first)
            step_1.can_skip_previous_nodes = True
            step_1.save()
            self.assertEqual(self._can_skip(step_0, step_1, step_2), [False, True, True])

        with self.subTest("moving a step in first position"):
            workflow.move_node_template(step_2, position=PositionChoices.first)
            self.assertEqual(workflow.dump_nodes(), [step_2.slug, step_0.slug, step_1.slug])
            self.assertEqual(self._can_skip(step_2, step_0, step_1), [False, False, True])

        with self.subTest("moving the first step away"):
            step_0.can_skip_previous_nodes = True
            step_0.save()
            workflow.move_node_template(step_2, position=PositionChoices.last)
            self.assertEqual(workflow.dump_nodes(), [step_0.slug, step_1.slug, step_2.slug])
            self.assertEqual(self._can_skip(step_0, step_1, step_2), [False, True, False])

        with self.subTest("deleting the first step"):
            workflow.delete_node_template(step_2)
            workflow.delete_node_template(step_0)
            self.assertEqual(self._can_skip(step_1), [False])
