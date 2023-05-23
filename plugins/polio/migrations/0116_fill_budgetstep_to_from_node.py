import logging

from django.db import migrations

from plugins.polio.budget.models import get_workflow
import plugins


def budgetstep_fill_from_to_nodes(apps, schema_editor):
    BudgetStep = apps.get_model("polio", "BudgetStep")
    workflow = get_workflow()
    if not workflow:
        return
    steps_to_fix = BudgetStep.objects.filter(node_key_to__isnull=True, node_key_from__isnull=True)
    logging.info(f"Migration: {steps_to_fix.count()} steps without nodes info")
    step: "plugins.polio.budget.models.BudgetStep"
    for step in steps_to_fix:
        transition = workflow.transitions_dict.get(step.transition_key)
        if transition:
            step.node_key_from = transition.from_node
            step.node_key_to = transition.to_node
            step.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0115_auto_20221222_1330"),
    ]

    operations = [
        migrations.RunPython(budgetstep_fill_from_to_nodes, migrations.RunPython.noop),
    ]
