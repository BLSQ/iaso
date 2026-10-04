"""The health world the GraphQL tests run on: what most tests build the same way - an account with its project, data
source and default version. Each test then builds its own org unit types, org units, forms and users on top: its
assertions depend on them."""

from dataclasses import dataclass

from iaso import models as m


@dataclass
class HealthAccount:
    account: m.Account
    project: m.Project
    source: m.DataSource
    version: m.SourceVersion


def health_account(
    name: str = "Ministry of Health",
    project: str = "Health facility monitoring",
    app_id: str = "hf.monitoring",
    source: str = "National health facility registry",
) -> HealthAccount:
    """An account with a project, and a data source of that project whose version 1 is the account's default."""
    account = m.Account.objects.create(name=name)
    health_project = m.Project.objects.create(name=project, app_id=app_id, account=account)
    data_source = m.DataSource.objects.create(name=source)
    data_source.projects.add(health_project)
    version = m.SourceVersion.objects.create(data_source=data_source, number=1)
    account.default_version = version
    account.save()
    return HealthAccount(account, health_project, data_source, version)
