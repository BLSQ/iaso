"""
Load data
---------

This module contains the load functions.

The cases load processes are done in batches and using SQL sentences that are
faster and less CPU/memory consuming than the same Django ORM methods.

If the locations load processes experiment low performance in the future they
should also be switched to the same SQL sentences.
"""
import logging
import os
import traceback

import dateutil
import numpy
import pandas
from django.core.exceptions import MultipleObjectsReturned
from django.db import transaction
from django.db.models import Q
from pandas import DataFrame, concat as pandasconcat

from hat.cases.event_log import EventStats
from hat.cases.models import Case, Location, CaseAbstract
from hat.common.utils import is_int, sns_notify, slack_notify
from hat.geo.geo_finder import get_single_as_and_village
from hat.geo.models import Village, AS
from hat.import_export.mapping import (
    CASE_IGNORE,
    mobile_get_location_from_coordinates,
    mobile_get_date,
    historic_get_screening_type,
)
from hat.patient.duplicates import create_potential_duplicates_for_patient
from hat.patient.identify import (
    get_or_create_patient_from_case,
    create_test_data,
    create_or_udpate_treatments,
    PL_STAGE2,
    PL_STAGE1,
    PL_STAGE_UNKNOWN,
)
from hat.patient.models import Test
from hat.sync.models import JSONDocument, DeviceDB
from hat.users.models import Team
from .errors import handle_import_stage, ImportStage

logger = logging.getLogger(__name__)


@handle_import_stage(ImportStage.load)
@transaction.atomic
def load_cases_into_db(df: DataFrame) -> EventStats:
    """
    Loads the dataframe into postgresql cases table but also tests, patients and normalized_village

    Decides if each entry should create a new record or update an old one.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """
    total = len(df)

    # remove rows with existing ids from the data
    ids = list(df["document_id"])
    existing_ids = Case.objects.filter(document_id__in=ids).values_list(
        "document_id", flat=True
    )

    # Filter out items that already exist in database
    duplicate_ids_in_db = df["document_id"].isin(existing_ids)
    duplicates_in_db = df[duplicate_ids_in_db]
    df = df[~duplicate_ids_in_db]

    # Filter out items that are entered 2x in the data to be inserted
    duplicate_ids_in_new_data = df.duplicated("document_id")
    duplicates_in_new_data = df[duplicate_ids_in_new_data]
    df = df[~duplicate_ids_in_new_data]

    # create a dataframe with all duplicate data
    # + drop rows that are exactly the same, since duplicate_ids
    # and duplicate_in_new_data might overlap
    duplicates = pandasconcat(
        [duplicates_in_db, duplicates_in_new_data], axis=0
    ).drop_duplicates(df.columns.difference(CASE_IGNORE))

    df["version_number"] = 0
    create_cases(df)

    # Update duplicates
    if len(duplicates) > 0:
        update_entries(duplicates)

    return EventStats(total=total, created=len(df), updated=len(duplicates), deleted=0)


@transaction.atomic
def load_reconciled_into_db(df: DataFrame) -> EventStats:
    """
    Loads the dataframe into postgresql cases table

    Decides which record should be updated with the extracted and transformed entries.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """

    total = len(df)
    updated = update_cases(df)
    return EventStats(total=total, created=0, updated=updated, deleted=0)


@transaction.atomic
def load_locations_into_db(df: DataFrame) -> EventStats:
    """
    Loads the dataframe into postgresql location table

    Deletes all the previous location data and creates new records with the
    extracted and transformed entries.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """

    total = len(df)

    locations = [Location(**row.dropna().to_dict()) for _, row in df.iterrows()]

    created = len(locations)
    deleted = Location.objects.all().count()

    # Delete all rows from the table and replaced with the new ones
    Location.objects.all().delete()
    Location.objects.bulk_create(locations)

    return EventStats(total=total, created=created, updated=0, deleted=deleted)


@transaction.atomic
def load_locations_areas_into_db(df: DataFrame) -> EventStats:
    """
    Loads the dataframe into postgresql location table

    Updates current records with the entries info.

    The returned dict will contain information about how many entries
    were extracted and transformed and how many records were created, updated or deleted.
    """

    total = len(df)
    updated = 0
    for index, row in df.iterrows():
        num = (
            Location.objects.filter(ZS=row["ZS"])
            .filter(AS=row["AS"])
            .update(**row.dropna().to_dict())
        )
        updated += num

    return EventStats(total=total, created=0, updated=updated, deleted=0)


################################################################################
# Helper functions
################################################################################


def parse_date(d):
    try:
        if hasattr(d, "to_pydatetime"):  # for when d is of the timestamp type of pandas
            return d.to_pydatetime()
        else:
            return dateutil.parser.parse(d)
    except Exception as e:
        import sys

        print("Exception while parsing ", d, type(d), file=sys.stderr)

        print("The exception", e, file=sys.stderr)
        raise


db_type_mapping = {
    "IntegerField": int,
    "PositiveSmallIntegerField": int,
    "PositiveIntegerField": int,
    "DecimalField": int,
    "BooleanField": bool,
    "NullBooleanField": bool,
    "DateTimeField": parse_date,
    "ForeignKey": int,
}


def convert_to_db_type(table, column, value):
    db_type = table._meta.get_field(column).get_internal_type()
    return db_type_mapping.get(db_type, lambda x: x)(value)


def get_case_team(case):
    # if we have a mobile device, we should have a direct mapping to a team, otherwise ignore
    if case.device_id:
        try:
            device = DeviceDB.objects.get(device_id=case.device_id)
            return device.get_team()
        except DeviceDB.DoesNotExist:  # Unique so won't have multiple results
            return None

    # try to guess the mobile unit, with exact match and then aliases
    if case.mobile_unit:
        try:
            return Team.objects.get(name__iexact=case.mobile_unit)
        except Team.MultipleObjectsReturned:
            print("Found multiple teams for mobile_unit", case.mobile_unit)
            return None
        except Team.DoesNotExist:
            try:
                return Team.objects.get(aliases__contains=[case.mobile_unit])
            except Team.DoesNotExist:
                return None
            except Team.MultipleObjectsReturned:
                print("Found multiple teams for mobile_unit", case.mobile_unit)
                return None

    return None


def normalize_location(
    case_zone, case_area, case_village, device_id=None, latitude=None, longitude=None
) -> (AS, Village):
    # If the ZS/AS are numeric, they probably are
    if is_int(case_zone) and is_int(case_area):
        if is_int(case_village):
            try:
                db_village = Village.objects.get(id=int(case_village))
                if db_village.merged_to is not None:
                    # merged_to is supposed to point directly at the correct village
                    db_village = db_village.merged_to
                return db_village.AS, db_village
            except Village.DoesNotExist:
                # We have a numeric village but it doesn't exist, strange but leave as is.
                logger.error(
                    "Received a numeric village id {} but could not find it in the db".format(
                        case_village
                    )
                )
                return None, None
        else:
            # ZS/AS are numeric but village is not (likely created from a device)
            db_as = None
            try:
                db_as = AS.objects.get(id=int(case_area), ZS_id=int(case_zone))
            except AS.DoesNotExist:
                # We have a numeric AS/ZS but it doesn't exist, strange but leave as is.
                logger.error(
                    "Received a numeric ZS {} AS {} but could not find it in the db".format(
                        case_zone, case_area
                    )
                )

            # The village could be in full text because it is a new one or it was created by a previous record but the
            # app doesn't know its ID yet. So let's attempt to find it first
            # First check for an exact name match, then check aliases and follow the merged_to if set
            village_base_qs = Village.objects.filter(AS_id=case_area)
            village_qs = village_base_qs.filter(name=case_village)
            village = village_qs.first()
            if village is None:
                village_qs = village_base_qs.filter(aliases__contains=[case_village])
                village = village_qs.first()
            if village and village.merged_to is not None:
                village = village.merged_to

            if village_qs.count() == 1:
                return db_as, village
            elif village_qs.count() == 0:
                if device_id is not None:
                    try:
                        devicedb = DeviceDB.objects.get(device_id=device_id)
                    except DeviceDB.DoesNotExist:
                        devicedb = None
                    village = Village(
                        name=case_village,
                        AS_id=case_area,
                        village_official="OTHER",
                        village_source="device",
                        creator_device=devicedb,
                    )
                    if latitude and longitude:
                        village.latitude = latitude
                        village.longitude = longitude
                        village.gps_source = "case_geoloc"
                    village.save()
                    return village.AS, village
            else:
                logger.error(
                    "Multiple villages found where only zero or one was expected. Village:",
                    case_zone,
                    case_area,
                    case_village,
                    "found",
                    ", ".join(
                        [
                            f"{x.id}: {x.name}"
                            for x in Village.objects.filter(
                                Q(
                                    Q(AS_id=case_area)
                                    & Q(
                                        Q(name=case_village)
                                        | Q(aliases__contains=[case_village])
                                    )
                                )
                            )
                        ]
                    ),
                )
                raise Exception(
                    f"Multiple villages found where one expected {case_village} {case_area}"
                )
            return db_as, None
    else:
        return get_single_as_and_village(case_zone, case_area, case_village)


def create_cases(df: DataFrame) -> None:
    for _, row in df.iterrows():
        case = Case()
        ignored_columns = {}
        json_document_id = None
        try:
            for index, value in enumerate(row):
                column_name = df.columns[index]
                if not numpy.all(pandas.isnull(value)) and value != "":
                    if column_name in CASE_IGNORE:
                        ignored_columns[column_name] = value
                    else:
                        setattr(
                            case,
                            column_name,
                            convert_to_db_type(Case, column_name, value),
                        )

            case.screening_type = get_screening_type(case, ignored_columns)
            case.test_pl_result = get_pl_stage(case)
            json_document_id = ignored_columns.get("json_document_id", None)
            treatments = ignored_columns.get("treatments", [])
            # Avoid having to check for None, nan, '' etc everywhere in the code
            row = row.dropna()

            # Determine the test and patient location
            (normalized_AS, normalized_village) = normalize_location(
                case.ZS,
                case.AS,
                case.village,
                case.device_id,
                case.latitude,
                case.longitude,
            )
            if normalized_AS:
                case.normalized_AS = normalized_AS
            if normalized_village:
                case.normalized_village = normalized_village

            if (
                "participant_member_type" in row.index
                and row["participant_member_type"] == MEMBER_TYPE_TRAVELER
            ):
                patient_as, patient_village = normalize_location(
                    row.get("participant_origin_zone", None),
                    row.get("participant_origin_area", None),
                    None,
                )
                patient_country = None
                traveler = True
            elif (
                "participant_member_type" in row.index
                and row["participant_member_type"] == MEMBER_TYPE_TRAVELER_OTHER_COUNTRY
            ):
                patient_as = None
                patient_village = None
                patient_country = row.get("participant_origin_country", None)
                traveler = True
            else:
                patient_as = normalized_AS
                patient_village = normalized_village
                patient_country = None
                traveler = False

            extract_infection_location(case, ignored_columns)

            patient, patient_created = get_or_create_patient_from_case(
                case,
                patient_as,
                patient_village,
                phone=ignored_columns.get("phone"),
                phone_date=case.document_date if ignored_columns.get("phone") else None,
                dead=ignored_columns.get("dead", False),
                death_date=mobile_get_date(ignored_columns.get("death_date", None)),
                death_device=ignored_columns.get("death_device", None),
                death_location=mobile_get_location_from_coordinates(
                    ignored_columns.get("death_position_longitude", None),
                    ignored_columns.get("death_position_latitude", None),
                ),
                origin_country=patient_country,
                traveller=traveler,
            )
            case.normalized_patient = patient
            case.normalized_team = get_case_team(case)

            case.save()

            if json_document_id:
                doc = JSONDocument.objects.get(id=json_document_id)
                doc.case = case
                doc.processed = True
                doc.save()

            create_test_data(case, patient_as, row)

            create_or_udpate_treatments(patient, treatments, case.device_id)

            # Check potential patient duplicates
            if patient_created:
                create_potential_duplicates_for_patient(patient)
        except Exception as exc:
            env_name = os.environ.get("ENVIRONMENT_NAME", "unknown env")
            full_exc = traceback.format_exc()
            if json_document_id:
                doc = JSONDocument.objects.filter(id=json_document_id).first()
                if doc:
                    document_ref = f"[id:{json_document_id}, doc_id:{doc.doc_id}, device:{doc.device.device_id}]"
                else:
                    document_ref = f"[id:{json_document_id}]"
            else:
                document_ref = "[id: ?]"
            logger.error(
                "Error importing document %s: %s", document_ref, exc, exc_info=1
            )
            sns_notify(
                "%s: Error importing document %s: %s"
                % (env_name, document_ref, full_exc)
            )
            slack_notify(
                plain_text="%s: Error importing document %s: %s"
                % (env_name, document_ref, full_exc),
                icon="exclamation",
            )
            raise


def update_cases(df: DataFrame) -> int:
    num_updated = 0

    for _, row in df.iterrows():
        cases = Case.objects.filter(document_id=row["document_id"])
        if cases.count() > 0:
            num_updated += 1
            case = cases[0]
            ignored_columns = {}
            for index, value in enumerate(row):
                column_name = df.columns[index]
                if not numpy.all(pandas.isnull(value)) and value != "":
                    if column_name in CASE_IGNORE:
                        ignored_columns[column_name] = value
                    else:
                        setattr(
                            case,
                            column_name,
                            convert_to_db_type(Case, column_name, value),
                        )

            case.screening_type = get_screening_type(case, ignored_columns)
            case.test_pl_result = get_pl_stage(case)
            json_document_id = ignored_columns.get("json_document_id", None)
            treatments = ignored_columns.get("treatments", [])
            # Avoid having to check for None, nan, '' etc everywhere in the code
            row = row.dropna()

            # The case location cannot change on mobile. Even if it does, a new location will produce a different
            # document_id and therefore a new document rather than an update. So we only need to worry about
            # patient_as changes
            if (
                "participant_member_type" in row.index
                and row["participant_member_type"] == "traveller"
            ):
                patient_as, _ = normalize_location(
                    row["participant_origin_zone"], row["participant_origin_area"], None
                )
                # Now update the Test from that case
                if patient_as:
                    Test.objects.filter(form=case).update(traveller_area=patient_as)
            else:
                patient_as = None

            case.save()

            if json_document_id:
                doc = JSONDocument.objects.get(id=json_document_id)
                doc.case = case
                doc.processed = True
                doc.save()

            create_test_data(case, patient_as, row)

            create_or_udpate_treatments(
                case.normalized_patient, treatments, case.device_id
            )

    return num_updated


def update_entries(duplicates: DataFrame) -> int:
    # remove unwanted columns
    # we only want to add test results:
    duplicates.drop(
        [
            # meta fields, keep original
            "source",
            # already the same
            "village",
            "hat_id",
            "name",
            "lastname",
            "prename",
            "sex",
            "mothers_surname",
        ],
        inplace=True,
        axis=1,
        # ignore if some columns don't exist
        errors="ignore",
    )
    return update_cases(duplicates)


def get_pl_stage(case):
    """
    test_pl_result contains stage1, stage2 or unknown, directly imported from historic data.
    The mobile data on the other hand needs to determine this information from the white cells count.
    """
    if case.test_pl_result is None:
        # We do set test_pl_result even if there is no PL test performed, it is then "unknown".
        if case.test_pl is not None and case.test_pl >= 2:
            return PL_STAGE2
        elif case.test_pl_gb_mm3 is not None and int(case.test_pl_gb_mm3) > 5:
            return PL_STAGE2
        elif case.test_pl_gb_mm3 is not None and int(case.test_pl_gb_mm3) <= 5:
            return PL_STAGE1
        else:
            return PL_STAGE_UNKNOWN
    else:
        return case.test_pl_result


def get_screening_type(case, ignored_columns):
    if case.source in (CaseAbstract.SOURCE_PV, CaseAbstract.SOURCE_HISTORIC):
        return historic_get_screening_type(ignored_columns)
    else:
        device = DeviceDB.objects.filter(device_id=case.device_id).first()
        if device and device.last_user and hasattr(device.last_user, "profile"):
            return device.last_user.profile.screening_type
        else:
            return None


MEMBER_TYPE_RESIDENT = "resident"
MEMBER_TYPE_TRAVELER = "traveller"
MEMBER_TYPE_TRAVELER_OTHER_COUNTRY = "traveller-other-country"
# v2.0.45 of the mobile app inverted testLocation and residenceLocation
INFECTION_RESIDENT = ["testLocation", "residenceLocationNew"]
INFECTION_TEST = ["residenceLocation", "testLocationNew"]
INFECTION_OTHER = ["otherLocation", "otherLocationNew"]


def extract_infection_location(case, ignored_columns):
    if ignored_columns.get("infection_location_village"):
        infection_as, infection_village = normalize_location(
            ignored_columns.get("infection_location_zone", None),
            ignored_columns.get("infection_location_area", None),
            ignored_columns.get("infection_location_village", None),
            device_id=case.device_id,
            latitude=case.latitude,
            longitude=case.longitude,
        )
        if infection_village:
            case.infection_location = infection_village

    infection_location_type = ignored_columns.get("infection_location_type")
    participant_member_type = ignored_columns.get("participant_member_type")
    if participant_member_type == MEMBER_TYPE_RESIDENT:
        if infection_location_type in INFECTION_RESIDENT:
            case.infection_location = case.normalized_village
            case.infection_location_type = Case.INFECTION_LOCATION_TYPE_RESIDENCE
        elif infection_location_type in INFECTION_TEST:
            case.infection_location_type = Case.INFECTION_LOCATION_TYPE_TEST
        elif infection_location_type in INFECTION_OTHER:
            case.infection_location_type = Case.INFECTION_LOCATION_TYPE_OTHER
    elif (
        participant_member_type == MEMBER_TYPE_TRAVELER
        or participant_member_type == MEMBER_TYPE_TRAVELER_OTHER_COUNTRY
    ):
        if infection_location_type in INFECTION_RESIDENT:
            case.infection_location = case.normalized_village
            case.infection_location_type = Case.INFECTION_LOCATION_TYPE_RESIDENCE
        elif infection_location_type in INFECTION_TEST:
            case.infection_location = case.normalized_village
            case.infection_location_type = Case.INFECTION_LOCATION_TYPE_TEST
        elif infection_location_type in INFECTION_OTHER:
            case.infection_location_type = Case.INFECTION_LOCATION_TYPE_OTHER
    else:
        if participant_member_type:
            raise Exception(
                f"Participant member type {participant_member_type} is none of the expected choices: "
                f"resident or traveller"
            )
