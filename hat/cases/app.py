from datetime import datetime
from django.apps import AppConfig
from django.db.models.signals import pre_migrate, post_migrate

class CasesAppConfig(AppConfig):
    name = 'hat.cases'

    def ready(self) -> None:
        pre_migrate.connect(setup_premigration_db, sender=self)
        post_migrate.connect(setup_postmigration_db, sender=self)


def setup_premigration_db(sender, **kwargs):  # type: ignore
    from hat.queries import prepare_premigration
    prepare_premigration()


def setup_postmigration_db(sender, **kwargs):  # type: ignore
    from hat.queries import prepare_postmigration
    prepare_postmigration()
