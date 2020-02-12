from datetime import datetime, date
from random import random, randint
from django.core.management.base import BaseCommand
from django.db import transaction
from iaso.models import (
    User,
    Instance,
    OrgUnit,
    Form,
    FormVersion,
    Mapping,
    MappingVersion,
    DataSource,
    SourceVersion,
    ExternalCredentials,
    Account,
    ExportLog,
    ExportRequest,
    ExportStatus,
)
from django.core import management

from iaso.dhis2.aggregate_exporter import (
    handle_exception,
    map_to_aggregate,
    AggregateExporter,
    InstanceExportError,
)
from iaso.dhis2.export_request_builder import ExportRequestBuilder


class Command(BaseCommand):
    def handle(self, *args, **options):
        form, created = Form.objects.get_or_create(
            form_id="quality_pca",
            name="Quality PCA form",
            period_type="month",
            single_per_period=True,
        )
        self.form = form
        form_version, created = FormVersion.objects.get_or_create(
            form=form, version_id=1
        )

        self.form = form
        self.form_version = form_version

        account, account_created = Account.objects.get_or_create(
            name="Organisation Name"
        )

        user, user_created = User.objects.get_or_create(
            username="Test User Name", email="testemail@bluesquarehub.com"
        )
        self.user = user

        credentials, creds_created = ExternalCredentials.objects.get_or_create(
            name="Test export api",
            url="https://play.dhis2.org/2.30",
            login="admin",
            password="district",
            account=account,
        )

        datasource, _ds_created = DataSource.objects.get_or_create(
            name="reference_play_test", credentials=credentials
        )
        source_version, _created = SourceVersion.objects.get_or_create(
            number=1, data_source=datasource
        )

        mapping, _mapping_created = Mapping.objects.get_or_create(
            form=form, data_source=datasource, mapping_type="AGGREGATE"
        )
        self.mapping = mapping

        mapping_version_json = {
            "data_set_name": "ART monthly summary",
            "data_set_id": "lyLU2wR22tC",
            "question_mappings": {
                "de374662": {"id": "ksGURIlASZB", "valueType": "NUMBER"},
                "de374607": {"id": "VZPWjoT6Iyb", "valueType": "NUMBER"},
                "de374616": {"id": "YX1MQLgAD92", "valueType": "NUMBER"},
                "de374671": {"id": "lznF009R6XI", "valueType": "NUMBER"},
                "de374677": {"id": "LJBV91hapop", "valueType": "NUMBER"},
                "de374590": {"id": "FQhY9n5Ft7t", "valueType": "NUMBER"},
                "de365337__male_25_49y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de365337__female_25_49y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de365337__male_49y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de365337__male_15_24y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de365337__female_15_24y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de365337__female_49y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de365337__male_15y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de365337__female_15y": {
                    "id": "gVfwyHBGWec",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374627": {"id": "YIDKw3om85t", "valueType": "NUMBER"},
                "de374617": {"id": "tZLjsE0VXrL", "valueType": "NUMBER"},
                "de374658": {"id": "zTWitarSrae", "valueType": "NUMBER"},
                "de374655": {"id": "DlZORv7kWSl", "valueType": "NUMBER"},
                "de374613": {"id": "xUNvvqqhNwz", "valueType": "NUMBER"},
                "de374642": {"id": "PNlOOplRNOp", "valueType": "NUMBER"},
                "de8248__male_25_49y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8248__female_25_49y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8248__male_49y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8248__male_15_24y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8248__female_15_24y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8248__female_49y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8248__male_15y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8248__female_15y": {
                    "id": "vJSPn2R6gVe",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374612": {"id": "o44j6gPqFlA", "valueType": "NUMBER"},
                "de374669": {"id": "a7Pue4ht1n1", "valueType": "NUMBER"},
                "de374660": {"id": "mmHNj6THZNH", "valueType": "NUMBER"},
                "de374605": {"id": "ReljOufQV11", "valueType": "NUMBER"},
                "de8245__male_25_49y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8245__female_25_49y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8245__male_49y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8245__male_15_24y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8245__female_15_24y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8245__female_49y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8245__male_15y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8245__female_15y": {
                    "id": "FTy5pcJZ3yX",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de475167": {"id": "jYYxzqd1dqM", "valueType": "NUMBER"},
                "de374646": {"id": "hUSSNufoUQz", "valueType": "NUMBER"},
                "de374620": {"id": "hoj1wTJT6ZW", "valueType": "NUMBER"},
                "de374622": {"id": "PxT44IblPCq", "valueType": "NUMBER"},
                "de8251__male_25_49y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8251__female_25_49y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8251__male_49y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8251__male_15_24y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8251__female_15_24y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8251__female_49y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8251__male_15y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8251__female_15y": {
                    "id": "CxlYcbqio4v",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374661": {"id": "dAnZOL5kxlK", "valueType": "NUMBER"},
                "de374599": {"id": "obbSEvaKTyW", "valueType": "NUMBER"},
                "de374640": {"id": "kxcIr99QcAO", "valueType": "NUMBER"},
                "de374664": {"id": "pSHgU0Wf4ir", "valueType": "NUMBER"},
                "de374593": {"id": "rFkRvm5Ns4a", "valueType": "NUMBER"},
                "de374683": {"id": "HmBwa7GWGRG", "valueType": "NUMBER"},
                "de8257__male_25_49y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8257__female_25_49y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8257__male_49y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8257__male_15_24y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8257__female_15_24y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8257__female_49y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8257__male_15y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8257__female_15y": {
                    "id": "wfKKFhBn0Q0",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374675": {"id": "iCGDtgPA28k", "valueType": "NUMBER"},
                "de374604": {"id": "yXZd6HTew4q", "valueType": "NUMBER"},
                "de374674": {"id": "tlSucW8wn23", "valueType": "NUMBER"},
                "de374628": {"id": "xrbIG3L9DdO", "valueType": "NUMBER"},
                "de374645": {"id": "yB3qDR4Mlqk", "valueType": "NUMBER"},
                "de374649": {"id": "aJ9oon0aJ87", "valueType": "NUMBER"},
                "de8256__male_25_49y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8256__female_25_49y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8256__male_49y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8256__male_15_24y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8256__female_15_24y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8256__female_49y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8256__male_15y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8256__female_15y": {
                    "id": "ibL7BD2vn2C",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374633": {"id": "pVImQlMAla4", "valueType": "NUMBER"},
                "de374673": {"id": "oJLoUSMs3Ud", "valueType": "NUMBER"},
                "de374647": {"id": "PBXQFnb2AOk", "valueType": "NUMBER"},
                "de374611": {"id": "CUVDjGzRmmU", "valueType": "NUMBER"},
                "de8249__male_25_49y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8249__female_25_49y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8249__male_49y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8249__male_15_24y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8249__female_15_24y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8249__female_49y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8249__male_15y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8249__female_15y": {
                    "id": "HDZOFvdXsqE",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de475165": {"id": "deGkTqbpTlS", "valueType": "NUMBER"},
                "de8253__male_25_49y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8253__female_25_49y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8253__male_49y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8253__male_15_24y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8253__female_15_24y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8253__female_49y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8253__male_15y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8253__female_15y": {
                    "id": "NJnhOzjaLYk",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374589": {"id": "Sdfo0RBu1W3", "valueType": "NUMBER"},
                "de374679": {"id": "Jw8BIUYVMGE", "valueType": "NUMBER"},
                "de374653": {"id": "AyLbN9fhY4W", "valueType": "NUMBER"},
                "de374621": {"id": "SLcj0Swq8rD", "valueType": "NUMBER"},
                "de374637": {"id": "C6yhZddXLCX", "valueType": "NUMBER"},
                "de374595": {"id": "FOWABOOZtPg", "valueType": "NUMBER"},
                "de475166": {"id": "supsI55QU7E", "valueType": "NUMBER"},
                "de8242__male_25_49y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8242__female_25_49y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8242__male_49y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8242__male_15_24y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8242__female_15_24y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8242__female_49y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8242__male_15y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8242__female_15y": {
                    "id": "eRwOwCpMzyP",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374678": {"id": "Z5uEjG9zJNK", "valueType": "NUMBER"},
                "de374666": {"id": "gSD3Znye1hY", "valueType": "NUMBER"},
                "de8240__male_25_49y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8240__female_25_49y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8240__male_49y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8240__male_15_24y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8240__female_15_24y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8240__female_49y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8240__male_15y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8240__female_15y": {
                    "id": "BOSZApCrBni",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de365336__male_25_49y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de365336__female_25_49y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de365336__male_49y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de365336__male_15_24y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de365336__female_15_24y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de365336__female_49y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de365336__male_15y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de365336__female_15y": {
                    "id": "aIJZ2d2QgVV",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374598": {"id": "D33rH8UHKlZ", "valueType": "NUMBER"},
                "de374602": {"id": "YknvQAH4LnL", "valueType": "NUMBER"},
                "de374603": {"id": "gyudBBtgGCv", "valueType": "NUMBER"},
                "de374608": {"id": "BI5CBuRJVSV", "valueType": "NUMBER"},
                "de8297__male_25_49y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8297__female_25_49y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8297__male_49y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8297__male_15_24y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8297__female_15_24y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8297__female_49y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8297__male_15y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8297__female_15y": {
                    "id": "rNEpbBxSyu7",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374609": {"id": "e1eDe6JsE9j", "valueType": "NUMBER"},
                "de374594": {"id": "BVU4XA3aL0Y", "valueType": "NUMBER"},
                "de374592": {"id": "pgzNTiQwMES", "valueType": "NUMBER"},
                "de8255__male_25_49y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8255__female_25_49y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8255__male_49y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8255__male_15_24y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8255__female_15_24y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8255__female_49y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8255__male_15y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8255__female_15y": {
                    "id": "GMd99K8gVut",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de8243__male_25_49y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8243__female_25_49y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8243__male_49y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8243__male_15_24y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8243__female_15_24y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8243__female_49y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8243__male_15y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8243__female_15y": {
                    "id": "zYkwbCBALhn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374600": {"id": "n91IylSb1JQ", "valueType": "NUMBER"},
                "de374657": {"id": "YgsAnqU3I7B", "valueType": "NUMBER"},
                "de8241__male_25_49y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8241__female_25_49y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8241__male_49y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8241__male_15_24y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8241__female_15_24y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8241__female_49y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8241__male_15y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8241__female_15y": {
                    "id": "dGdeotKpRed",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374623": {"id": "la1f7sqY9sb", "valueType": "NUMBER"},
                "de8247__male_25_49y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8247__female_25_49y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8247__male_49y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8247__male_15_24y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8247__female_15_24y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8247__female_49y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8247__male_15y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8247__female_15y": {
                    "id": "LVaUdM3CERi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374618": {"id": "xETRo03ZfOM", "valueType": "NUMBER"},
                "de8246__male_25_49y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8246__female_25_49y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8246__male_49y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8246__male_15_24y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8246__female_15_24y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8246__female_49y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8246__male_15y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8246__female_15y": {
                    "id": "kVOiLDV4OC6",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de8244__male_25_49y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8244__female_25_49y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8244__male_49y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8244__male_15_24y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8244__female_15_24y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8244__female_49y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8244__male_15y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8244__female_15y": {
                    "id": "I5MLuG16arn",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374614": {"id": "x98jMXibptT", "valueType": "NUMBER"},
                "de374624": {"id": "tnDQ80ycQus", "valueType": "NUMBER"},
                "de374606": {"id": "iri7NSiuRc3", "valueType": "NUMBER"},
                "de374659": {"id": "un5mkYkVKqV", "valueType": "NUMBER"},
                "de374636": {"id": "V651s5yIbnR", "valueType": "NUMBER"},
                "de374629": {"id": "GgsWqA0YETj", "valueType": "NUMBER"},
                "de374634": {"id": "GNY9KvEmRjy", "valueType": "NUMBER"},
                "de374644": {"id": "YTmhoGBxE2m", "valueType": "NUMBER"},
                "de374681": {"id": "AzwEuYfWAtN", "valueType": "NUMBER"},
                "de374672": {"id": "y6noHe7ltxY", "valueType": "NUMBER"},
                "de475164": {"id": "nvsNqhfSSxd", "valueType": "NUMBER"},
                "de374586__male_25_49y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de374586__female_25_49y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de374586__male_49y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de374586__male_15_24y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de374586__female_15_24y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de374586__female_49y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de374586__male_15y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de374586__female_15y": {
                    "id": "Yf4u4QOIdsi",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374631": {"id": "lmj0xtl5P6C", "valueType": "NUMBER"},
                "de374652": {"id": "vhT3YzTev3B", "valueType": "NUMBER"},
                "de8252__male_25_49y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8252__female_25_49y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8252__male_49y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8252__male_15_24y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8252__female_15_24y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8252__female_49y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8252__male_15y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8252__female_15y": {
                    "id": "QrhlrvV6Xs8",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374680": {"id": "q9CskFaFGE6", "valueType": "NUMBER"},
                "de374668": {"id": "ZGKUt190yEn", "valueType": "NUMBER"},
                "de374630": {"id": "uN64b5MivTO", "valueType": "NUMBER"},
                "de374619": {"id": "wIQ5ugpWYUH", "valueType": "NUMBER"},
                "de374670": {"id": "hI7NM78r3Rg", "valueType": "NUMBER"},
                "de374648": {"id": "ZgIaamZjBjz", "valueType": "NUMBER"},
                "de8250__male_25_49y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8250__female_25_49y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8250__male_49y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8250__male_15_24y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8250__female_15_24y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8250__female_49y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8250__male_15y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8250__female_15y": {
                    "id": "soACnRV9gOI",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374643": {"id": "NV0OXpHu6x4", "valueType": "NUMBER"},
                "de374651": {"id": "EEEu3r8z1Rg", "valueType": "NUMBER"},
                "de374596": {"id": "oYZug9IEm3Q", "valueType": "NUMBER"},
                "de374663": {"id": "BtXmKYNBc3k", "valueType": "NUMBER"},
                "de374597": {"id": "KD5UjA5V16r", "valueType": "NUMBER"},
                "de374650": {"id": "eCIPNNYj9ZM", "valueType": "NUMBER"},
                "de374665": {"id": "jHxFwWMbXT2", "valueType": "NUMBER"},
                "de374615": {"id": "fDkcJaO15aQ", "valueType": "NUMBER"},
                "de374626": {"id": "pq4msirdtpr", "valueType": "NUMBER"},
                "de374601": {"id": "cQxY2T8GenX", "valueType": "NUMBER"},
                "de374638": {"id": "qUY0i7PnaLS", "valueType": "NUMBER"},
                "de374588": {"id": "ZecQS9lx4j9", "valueType": "NUMBER"},
                "de374632": {"id": "ozmEltb5V8d", "valueType": "NUMBER"},
                "de374591": {"id": "XVzfK55tu7h", "valueType": "NUMBER"},
                "de374676": {"id": "t6YgakIbFif", "valueType": "NUMBER"},
                "de374654": {"id": "E7QJ0voitk7", "valueType": "NUMBER"},
                "de374625": {"id": "w1554hhXNcq", "valueType": "NUMBER"},
                "de8258__male_25_49y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8258__female_25_49y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8258__male_49y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8258__male_15_24y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8258__female_15_24y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8258__female_49y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8258__male_15y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8258__female_15y": {
                    "id": "TyQ1vOHM6JO",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
                "de374656": {"id": "IJ4yZ027EmK", "valueType": "NUMBER"},
                "de374635": {"id": "D4PywWuIwy0", "valueType": "NUMBER"},
                "de374682": {"id": "Mow8dnhE6FJ", "valueType": "NUMBER"},
                "de374639": {"id": "a5MxE5H7d3q", "valueType": "NUMBER"},
                "de374641": {"id": "XMsORYe4ZcA", "valueType": "NUMBER"},
                "de374610": {"id": "FDpeT1lFQMM", "valueType": "NUMBER"},
                "de374667": {"id": "MeAvt39JtqN", "valueType": "NUMBER"},
                "de8254__male_25_49y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "uX9yDetTdOp",
                },
                "de8254__female_25_49y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qa0VqgYlgtN",
                },
                "de8254__male_49y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "GuJESuyOCMW",
                },
                "de8254__male_15_24y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "zPpvbvpmkxN",
                },
                "de8254__female_15_24y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "LbeIlyHEhKr",
                },
                "de8254__female_49y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "rCMUTmcreqP",
                },
                "de8254__male_15y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "TkDhg29x18A",
                },
                "de8254__female_15y": {
                    "id": "F53rTVTmSuF",
                    "valueType": "NUMBER",
                    "categoryOptionCombo": "qNCMOhkoQju",
                },
            },
        }

        mapping_version, mapping_version_created = MappingVersion.objects.get_or_create(
            name="aggregate",
            json=mapping_version_json,
            form_version=self.form_version,
            mapping=self.mapping,
        )
        import pdb

        pdb.set_trace()
        print("********* FORM seed done")

        print("******** delete previous instances")
        print(
            Instance.objects.filter(
                org_unit__in=source_version.orgunit_set.all()
            ).delete()
        )

        print("********* Importing orgunits")

        management.call_command(
            "dhis2_ou_importer",
            dhis2_url=credentials.url,
            dhis2_user=credentials.login,
            dhis2_password=credentials.password,
            source_name=datasource.name,
            version_number=source_version.number,
            org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
            force=True,
        )

        print("********* generating instances")
        periods = ["201801", "201802", "201803"]
        self.seed_instances(source_version, form, periods, mapping_version)
        print("generated", form.instance_set.count(), "instances")

        print("********* exporting")
        export_request = ExportRequestBuilder().build_export_request(
            periods, [self.form.id], [], self.user
        )

        print("exporting")
        AggregateExporter().export_instances(export_request, True)

    @transaction.atomic
    def seed_instances(self, source_version, form, periods, mapping_version):
        for org_unit in source_version.orgunit_set.all():
            for period in periods:
                instance = Instance()
                instance.created_at = datetime.strptime(
                    "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
                )
                instance.org_unit = org_unit
                instance.period = period

                test_data = {}

                for key in mapping_version.json["question_mappings"]:
                    test_data[key] = randint(0, 10)

                instance.json = test_data
                instance.form = self.form
                instance.save()
                # force to past creation date
                # looks the the first save don't take it
                instance.created_at = datetime.strptime(
                    "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
                )
                instance.save()
