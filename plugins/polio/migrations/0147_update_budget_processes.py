from django.db import migrations, models


def migrate_old_budgets_to_process(apps, schema_editor):
    BudgetProcess = apps.get_model("polio", "BudgetProcess")
    BudgetStep = apps.get_model("polio", "BudgetStep")

    budget_steps = BudgetStep.objects.all()

    for step in budget_steps:
        process = BudgetProcess.objects.create(
            created_by_team=step.created_by_team,
        )

        process.rounds.set([step.campaign.rounds])
        process.teams.set([step.created_by_team])

        process.save()


class Migration(migrations.Migration):
    dependencies = [("polio", "0146_budgetprocess")]

    operations = [
        migrations.RunPython(migrate_old_budgets_to_process),
    ]
