"""Create a synthetic Bangladesh-like WFP account with beneficiaries and visits, then run the ETL on it.

The submissions use the Bangladesh form ids and JSON fields read by the ETL (``plugins/wfp/common.py``), so that
the WFP tables are filled by the real ETL code. All names and identifiers are fake.

Usage:
    docker compose run --rm iaso manage wfp_demo_data --password <password>
"""

import os
import random
import uuid

from datetime import date, datetime, time, timedelta, timezone
from xml.sax.saxutils import escape

from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import Permission, User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from iaso import models as m
from plugins.wfp.aggregator import Aggregator
from plugins.wfp.common import ETL
from plugins.wfp.management.commands.bangladesh.Pbwg import BD_PBWG
from plugins.wfp.management.commands.bangladesh.Under5 import BD_Under5
from plugins.wfp.models import Beneficiary, Journey


ACCOUNT_NAME = "WFP Bangladesh Demo"
PERMISSIONS = ["iaso_entities", "iaso_submissions", "iaso_forms", "iaso_org_units"]

FIRST_NAMES_F = ["Amina", "Fatema", "Rahima", "Nur", "Hasina", "Sumaiya", "Jannat", "Rokeya", "Shamima", "Taslima"]
FIRST_NAMES_M = ["Mohammed", "Abdul", "Rahim", "Karim", "Nurul", "Hossain", "Rashid", "Yusuf", "Anwar", "Jamal"]
LAST_NAMES = ["Begum", "Khatun", "Akter", "Ullah", "Hossain", "Rahman", "Islam", "Uddin", "Alam", "Sultana"]
CAMPS = {
    "Camp 1E": ["INF Kutupalong A", "INF Kutupalong B"],
    "Camp 8W": ["INF Balukhali"],
    "Camp 13": ["INF Thangkhali"],
}

U5_FORMS = {
    "reference": ("Child registration (demo)", "bangladesh_child_registration"),
    "admission": ("BSFP child visit", "bsfp_child_visit"),
    "followup": ("BSFP child follow-up visit", "bsfp_child_followup_visit"),
}
PBWG_FORMS = {
    "reference": ("PBWG registration (demo)", "bangladesh_pbwg_registration"),
    "admission": ("BSFP PBWG visit", "bsfp_pbwg_visit"),
    "followup": ("BSFP PBWG follow-up visit", "bsfp_pbwg_followup_visit"),
}


def _question_type(name):
    if "date" in name or name in ("edd", "child_dob", "actual_birthday__date__"):
        return "date"
    if name in ("muac", "mother_muac", "weight_kgs", "quantity", "age__int__"):
        return "decimal"
    return "text"


def _attach_xml_file(instance):
    """Give the submission the XML file the mobile app would have uploaded.

    The submissions list of the dashboard only shows submissions with a file.
    """
    answers = "".join(
        f"<{name}>{escape(str(value))}</{name}>" for name, value in (instance.json or {}).items() if name != "_version"
    )
    xml = (
        f'<?xml version="1.0" encoding="UTF-8"?><data id="{instance.form.form_id}" version="1">{answers}'
        f"<meta><instanceID>uuid:{instance.uuid}</instanceID></meta></data>"
    )
    instance.file.save(f"{instance.uuid}.xml", ContentFile(xml.encode()), save=False)
    instance.file_name = f"{instance.uuid}.xml"
    m.Instance.objects.filter(id=instance.id).update(file=instance.file.name, file_name=instance.file_name)


def _at_noon(day):
    return datetime.combine(day, time(12, 0), tzinfo=timezone.utc)


class Command(BaseCommand):
    help = "Create a demo WFP Bangladesh account with synthetic beneficiaries, a user to browse them, and run the ETL"

    def add_arguments(self, parser):
        parser.add_argument("--username", default="wfp_demo")
        parser.add_argument(
            "--password", default=os.environ.get("WFP_DEMO_PASSWORD"), help="Defaults to $WFP_DEMO_PASSWORD"
        )
        parser.add_argument("--children", type=int, default=150)
        parser.add_argument("--women", type=int, default=80)
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument("--etl-only", action="store_true", help="Only rerun the ETL on the existing demo account")
        parser.add_argument(
            "--add",
            action="store_true",
            help="Add submissions to the existing demo account: --children / --women new beneficiaries (default 3 / 2)"
            " and --visits follow-up visits dated today for beneficiaries still in a programme (default 5)",
        )
        parser.add_argument("--visits", type=int, default=5)
        parser.add_argument(
            "--xml-files",
            action="store_true",
            help="Give an XML file to the submissions of the demo account without one",
        )
        parser.add_argument(
            "--form-versions-only",
            action="store_true",
            help="Only (re)create the form versions of the existing demo account, from the answers of its submissions",
        )

    def handle(self, *args, **options):
        if options["form_versions_only"]:
            self._create_form_versions(m.Account.objects.get(name=ACCOUNT_NAME))
            return
        if options["xml_files"]:
            instances = m.Instance.objects.filter(entity__account__name=ACCOUNT_NAME, file="").select_related("form")
            count = 0
            for instance in instances.iterator(chunk_size=500):
                _attach_xml_file(instance)
                count += 1
            self.stdout.write(f"XML files added to {count} submissions")
            return
        if options["add"]:
            self._add_to_existing(options)
            return
        if options["etl_only"]:
            account = m.Account.objects.get(name=ACCOUNT_NAME)
            self._run_etl(account, options["username"])
            return
        if not options["password"]:
            raise CommandError("Provide --password or set WFP_DEMO_PASSWORD")
        if m.Account.objects.filter(name=ACCOUNT_NAME).exists():
            raise CommandError(f"Account '{ACCOUNT_NAME}' already exists")
        if m.EntityType.objects.filter(code__in=["bangladesh_under5", "bangladesh_pbwg"]).exists():
            raise CommandError("Entity types bangladesh_under5 / bangladesh_pbwg already exist in another account")

        self.random = random.Random(options["seed"])
        self.today = date.today()

        with transaction.atomic():
            account, project, infs = self._create_account()
            u5_forms = self._create_forms(project, U5_FORMS)
            pbwg_forms = self._create_forms(project, PBWG_FORMS)
            u5_type = self._create_entity_type(account, "Child under 5 (BSFP/NSEP)", "bangladesh_under5", u5_forms)
            pbwg_type = self._create_entity_type(account, "PBWG (BSFP)", "bangladesh_pbwg", pbwg_forms)
            self._create_user(account, project, options["username"], options["password"])
            for _ in range(options["children"]):
                self._create_child(account, u5_type, u5_forms, infs)
            for _ in range(options["women"]):
                self._create_woman(account, pbwg_type, pbwg_forms, infs)
            self._create_form_versions(account)

        self._run_etl(account, options["username"])

    def _add_to_existing(self, options):
        account = m.Account.objects.get(name=ACCOUNT_NAME)
        self.random = random.Random()
        self.today = date.today()
        # the defaults of --children / --women are for a new account, add a few only
        children = options["children"] if options["children"] != 150 else 3
        women = options["women"] if options["women"] != 80 else 2

        forms = {f.form_id: f for f in m.Form.objects.filter(projects__account=account)}
        u5_forms = {key: forms[form_id] for key, (_, form_id) in U5_FORMS.items()}
        pbwg_forms = {key: forms[form_id] for key, (_, form_id) in PBWG_FORMS.items()}
        u5_type = m.EntityType.objects.get(account=account, code="bangladesh_under5")
        pbwg_type = m.EntityType.objects.get(account=account, code="bangladesh_pbwg")
        infs = list(m.OrgUnit.objects.filter(version=account.default_version, org_unit_type__name="INF"))

        with transaction.atomic():
            first_new_id = (m.Instance.objects.order_by("-id").values_list("id", flat=True).first() or 0) + 1
            for _ in range(children):
                self._create_child(account, u5_type, u5_forms, infs)
            for _ in range(women):
                self._create_woman(account, pbwg_type, pbwg_forms, infs)
            visits = self._add_followup_visits(account, forms, options["visits"])
            new_instances = list(m.Instance.objects.filter(id__gte=first_new_id, entity__account=account))
            for instance in new_instances:
                # the demo forms have a single version, see _create_form_versions
                instance.json = {**instance.json, "_version": "1"}
            m.Instance.objects.bulk_update(new_instances, ["json"])

        self.stdout.write(
            f"Added {children} children, {women} women and {visits} follow-up visits ({len(new_instances)} submissions)"
        )
        self._run_etl(account, options["username"])

    def _add_followup_visits(self, account, forms, count):
        """A follow-up visit today for beneficiaries whose journey is still ongoing."""
        followup_forms = {"U5": forms[U5_FORMS["followup"][1]], "PLW": forms[PBWG_FORMS["followup"][1]]}
        anthropometric_ids = [f.id for key, f in forms.items() if "visit" in key]
        journeys = list(
            Journey.objects.filter(beneficiary__account=account, exit_type__isnull=True)
            .exclude(visit__date__date=self.today)
            .select_related("beneficiary__entity")
            .distinct()
        )
        added = 0
        for journey in self.random.sample(journeys, min(count, len(journeys))):
            entity = journey.beneficiary.entity
            last = (
                m.Instance.objects.filter(entity=entity, form_id__in=anthropometric_ids, deleted=False)
                .order_by("-source_created_at", "-id")
                .first()
            )
            if last is None:
                continue
            json = {
                key: value
                for key, value in (last.json or {}).items()
                if key not in ("admission_type", "admission_criteria", "_version")
            }
            json["visit_date"] = self.today.isoformat()
            if "muac" in json:
                muac = round(float(json["muac"]) + self.random.uniform(-0.3, 0.4), 1)
                json["muac"] = str(muac)
                json["_Xwhz_color"] = "G" if muac >= 12.5 else ("Y" if muac >= 11.5 else "R")
            if "mother_muac" in json:
                json["mother_muac"] = str(round(float(json["mother_muac"]) + self.random.uniform(-0.3, 0.4), 1))
            self._create_submission(entity, followup_forms[journey.programme_type], last.org_unit, self.today, json)
            added += 1
        return added

    def _run_etl(self, account, username):
        # Same steps as the etl_bangladesh task, without its dependency on django_celery_results,
        # which is not installed in every environment.
        for code, runner, programme_type in (
            ("bangladesh_under5", BD_Under5, "U5"),
            ("bangladesh_pbwg", BD_PBWG, "PLW"),
        ):
            self.stdout.write(f"Running the Bangladesh ETL for {code}...")
            etl = ETL(code)
            entity_ids = list(etl.get_updated_entity_ids())
            Beneficiary.objects.filter(account=account, entity_id__in=entity_ids).delete()
            runner().run(entity_ids, code, "wfp_demo_data")
            org_units = etl.get_org_unit_and_period_with_updated_data()
            Aggregator.reset_monthly_statistics(account, programme_type, org_units)
            Aggregator.aggregate_monthly_data_by_org_unit(account, org_units, programme_type)

        self.stdout.write(
            self.style.SUCCESS(
                f"Account '{account.name}' (id {account.id}): "
                f"{m.Entity.objects.filter(account=account).count()} entities, "
                f"{m.Instance.objects.filter(entity__account=account).count()} submissions, "
                f"{Beneficiary.objects.filter(account=account).count()} ETL beneficiaries. "
                f"Log in as '{username}' and open /wfp/beneficiaries/"
            )
        )

    # ------------------------------------------------------------------
    # Setup
    # ------------------------------------------------------------------

    def _create_account(self):
        account = m.Account.objects.create(name=ACCOUNT_NAME, modules=["DEFAULT", "DATA_COLLECTION_FORMS", "ENTITIES"])
        source = m.DataSource.objects.create(name=f"{ACCOUNT_NAME} pyramid")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        source.default_version = version
        source.save()
        account.default_version = version
        account.save()
        project = m.Project.objects.create(name=ACCOUNT_NAME, app_id="wfp_bangladesh_demo", account=account)
        source.projects.add(project)

        camp_type = m.OrgUnitType.objects.create(name="Camp", short_name="Camp")
        inf_type = m.OrgUnitType.objects.create(name="INF", short_name="INF")
        camp_type.projects.add(project)
        inf_type.projects.add(project)
        infs = []
        for camp_name, inf_names in CAMPS.items():
            camp = m.OrgUnit.objects.create(
                name=camp_name, org_unit_type=camp_type, version=version, validation_status="VALID"
            )
            for inf_name in inf_names:
                infs.append(
                    m.OrgUnit.objects.create(
                        name=inf_name, org_unit_type=inf_type, parent=camp, version=version, validation_status="VALID"
                    )
                )
        return account, project, infs

    @staticmethod
    def _create_forms(project, definitions):
        forms = {}
        for key, (name, form_id) in definitions.items():
            form = m.Form.objects.create(name=name, form_id=form_id)
            form.projects.add(project)
            forms[key] = form
        return forms

    @staticmethod
    def _create_entity_type(account, name, code, forms):
        return m.EntityType.objects.create(
            name=name,
            code=code,
            account=account,
            reference_form=forms["reference"],
            is_active=True,
            fields_list_view=["first_name", "last_name", "progress_id", "fcn"],
            fields_detail_info_view=["first_name", "last_name", "progress_id", "fcn", "camp", "block"],
        )

    @staticmethod
    def _create_user(account, project, username, password):
        user = User.objects.create(username=username, first_name="WFP", last_name="Demo")
        user.set_password(password)
        user.save()
        profile = m.Profile.objects.create(user=user, account=account)
        profile.projects.add(project)
        user.user_permissions.set(Permission.objects.filter(codename__in=PERMISSIONS))

    def _create_form_versions(self, account):
        """Give each demo form a version whose questions are the answers found in its submissions.

        The submission details page needs it to show the questions, and the form page to pick questions.
        """
        for form in m.Form.objects.filter(projects__account=account).distinct():
            instances = list(m.Instance.objects.filter(form=form))
            names = []
            for instance in instances:
                for name in instance.json or {}:
                    if name != "_version" and name not in names:
                        names.append(name)
            form.form_versions.all().delete()
            m.FormVersion.objects.create(
                form=form,
                version_id="1",
                file="",
                form_descriptor={
                    "name": form.form_id,
                    "type": "survey",
                    "title": form.name,
                    "children": [
                        {
                            "name": name,
                            "type": _question_type(name),
                            "label": name.strip("_").replace("_", " ").capitalize(),
                        }
                        for name in names
                    ],
                },
            )
            form.update_possible_fields()
            form.save()
            for instance in instances:
                instance.json = {**instance.json, "_version": "1"}
            # bulk_update doesn't touch updated_at, so the ETL doesn't see these submissions as modified
            m.Instance.objects.bulk_update(instances, ["json"])
        self.stdout.write("Form versions created")

    # ------------------------------------------------------------------
    # Beneficiaries
    # ------------------------------------------------------------------

    def _identity(self, gender):
        first_names = FIRST_NAMES_F if gender == "Female" else FIRST_NAMES_M
        return {
            "first_name": self.random.choice(first_names),
            "last_name": self.random.choice(LAST_NAMES),
            "progress_id": f"{self.random.randint(100000, 999999)}",
            "fcn": f"FCN{self.random.randint(1000000, 9999999)}",
            "block": f"Block {self.random.choice('ABCDEFG')}{self.random.randint(1, 30)}",
            "phone_number": f"01{self.random.randint(300000000, 999999999)}",
        }

    def _visit_dates(self, start, max_visits):
        """Monthly visits from *start*, a few days apart from the 1st, never in the future."""
        dates = []
        current = start
        while len(dates) < max_visits and current <= self.today:
            dates.append(current)
            current = current + relativedelta(months=1) + timedelta(days=self.random.randint(-4, 4))
        return dates

    def _create_submission(self, entity, form, org_unit, visit_date, json):
        sync_delay = self.random.choice([0, 0, 0, 1, 1, 2, 3, 5, 12])
        instance = m.Instance.objects.create(
            form=form,
            entity=entity,
            org_unit=org_unit,
            project=form.projects.first(),
            json=json,
            uuid=str(uuid.uuid4()),
            source_created_at=_at_noon(visit_date),
        )
        _attach_xml_file(instance)
        # created_at is the server reception time (the "data synchronisation date")
        synced_at = min(_at_noon(visit_date + timedelta(days=sync_delay)), datetime.now(timezone.utc))
        m.Instance.objects.filter(id=instance.id).update(created_at=synced_at)
        return instance

    def _create_entity(self, account, entity_type, reference_form, org_unit, registration_date, reference_json):
        entity = m.Entity.objects.create(entity_type=entity_type, account=account)
        reference = self._create_submission(entity, reference_form, org_unit, registration_date, reference_json)
        entity.attributes = reference
        entity.save()
        return entity

    def _exit_fields(self, kind):
        if kind == "age_limit":
            return {"_programme": "NONE", "_age_band": "exit"}
        if kind == "transfer_to_tsfp":
            return {"_programme": "NONE", "confirm_tsfp_referral": "1"}
        return {"_programme": "NONE", "reason_not_continue": kind}

    def _create_child(self, account, entity_type, forms, infs):
        rnd = self.random
        gender = rnd.choice(["Male", "Female"])
        age_at_admission = rnd.randint(6, 34)  # months
        admission = self.today - timedelta(days=rnd.randint(20, 210))
        birth_date = admission - relativedelta(months=age_at_admission) - timedelta(days=rnd.randint(0, 27))
        inf = rnd.choice(infs)
        programme = "NSEP" if age_at_admission >= 24 else "BSFP"
        identity = self._identity(gender)

        entity = self._create_entity(
            account,
            entity_type,
            forms["reference"],
            inf,
            admission,
            {
                **identity,
                "gender": gender,
                "actual_birthday__date__": birth_date.isoformat(),
                "caregiver_name": f"{rnd.choice(FIRST_NAMES_F)} {rnd.choice(LAST_NAMES)}",
                "camp": inf.parent.name,
                "registration_date": admission.isoformat(),
            },
        )

        dates = self._visit_dates(admission, rnd.randint(1, 8))
        exit_kind = rnd.choice([None, None, None, "age_limit", "voluntary_withdrawal", "transfer_to_tsfp"])
        muac = round(rnd.uniform(12.2, 14.5), 1)
        weight = round(rnd.uniform(7.0, 12.0), 1)
        for index, visit_date in enumerate(dates):
            muac = round(min(max(muac + rnd.uniform(-0.4, 0.5), 11.3), 15.5), 1)
            weight = round(weight + rnd.uniform(-0.1, 0.4), 1)
            colour = "G" if muac >= 12.5 else ("Y" if muac >= 11.5 else "R")
            json = {
                "visit_date": visit_date.isoformat(),
                "gender": gender,
                "programme": programme,
                "muac": str(muac),
                "_Xwhz_color": colour,
                "weight_kgs": str(weight),
                "ration_to_distribute": "lns_mq" if programme == "BSFP" else "wsb_plus",
                "quantity": "30" if programme == "BSFP" else "6",
                "referrer_name": f"{rnd.choice(FIRST_NAMES_M)} {rnd.choice(LAST_NAMES)}",
            }
            if index == 0:
                json["admission_type"] = "new_case"
                json["admission_criteria"] = "muac"
            is_last = index == len(dates) - 1
            if is_last and exit_kind and len(dates) > 1:
                json.update(self._exit_fields(exit_kind))
                json.pop("ration_to_distribute")
            form = forms["admission"] if index == 0 else forms["followup"]
            self._create_submission(entity, form, inf, visit_date, json)

    def _create_woman(self, account, entity_type, forms, infs):
        rnd = self.random
        status = rnd.choice(["pregnant", "breastfeeding"])
        age = rnd.randint(16, 42)
        admission = self.today - timedelta(days=rnd.randint(20, 210))
        inf = rnd.choice(infs)
        identity = self._identity("Female")

        entity = self._create_entity(
            account,
            entity_type,
            forms["reference"],
            inf,
            admission,
            {
                **identity,
                "age_entry": "years",
                "age__int__": str(age),
                "registration_date": admission.isoformat(),
                "husband_name": f"{rnd.choice(FIRST_NAMES_M)} {rnd.choice(LAST_NAMES)}",
                "camp": inf.parent.name,
            },
        )

        if status == "pregnant":
            extra = {"edd": (admission + timedelta(days=rnd.randint(30, 200))).isoformat()}
        else:
            extra = {"child_dob": (admission - timedelta(days=rnd.randint(10, 300))).isoformat()}

        dates = self._visit_dates(admission, rnd.randint(1, 7))
        exit_kind = rnd.choice([None, None, "voluntary_withdrawal", "transferred_out"])
        muac = round(rnd.uniform(22.5, 27.0), 1)
        for index, visit_date in enumerate(dates):
            muac = round(muac + rnd.uniform(-0.3, 0.4), 1)
            json = {
                "visit_date": visit_date.isoformat(),
                "woman_status": status,
                "programme": "BSFP",
                "mother_muac": str(muac),
                "ration_to_distribute": "wsb_plus",
                "quantity": "8",
                **extra,
            }
            if index == 0:
                json["admission_type"] = "new_case"
                json["admission_criteria"] = "muac"
            if index == len(dates) - 1 and exit_kind and len(dates) > 1:
                json.update(self._exit_fields(exit_kind))
                json.pop("ration_to_distribute")
            form = forms["admission"] if index == 0 else forms["followup"]
            self._create_submission(entity, form, inf, visit_date, json)
