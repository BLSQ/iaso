import ntpath
import re
import logging

from collections import defaultdict
from datetime import timedelta

import dateutil
from django.contrib.gis.geos import Point
from django.core.exceptions import MultipleObjectsReturned
from django.db.models import Q

from hat.cases.models import Case
from hat.constants import *
from hat.import_export.mapping import (
    mobile_get_date,
    mobile_get_null_boolean,
    mobile_get_location_from_gps,
)
from hat.patient.models import Test, Patient, Treatment
from hat.sync.models import ImageUpload, VideoUpload, DeviceDB
from hat.users.models import Profile

"""
This file provides the tools to identify patients and tests from Case data
"""

logger = logging.getLogger(__name__)


def name_normalize(name):
    if name is None:
        return None
    stripped_name = name.strip()
    stripped_name = re.sub(r"\s{2,}", " ", stripped_name)

    return stripped_name


def get_or_create_patient_from_case(
    case: Case,
    origin_area,
    origin_village,
    phone,
    phone_date,
    dead=False,
    death_date=None,
    death_device=None,
    death_location=None,
    origin_country=None,
    traveller=False,
):
    if case.age is not None:
        age = case.age
    else:
        if (
            case.year_of_birth is not None
            and case.entry_date is not None
            and case.year_of_birth <= case.entry_date.year
        ):
            age = case.entry_date.year - int(case.year_of_birth)
        else:
            age = None
    if death_device and type(death_device) == str:
        death_device_db = DeviceDB.objects.filter(device_id=death_device).first()
    else:
        death_device_db = death_device

    return get_or_create_patient(
        case.prename,
        case.lastname,
        case.postname,
        case.mothers_surname,
        case.sex,
        case.year_of_birth,
        origin_area,
        origin_village,
        case.ZS if not traveller else None,
        case.AS if not traveller else None,
        case.village if not traveller else None,
        age,
        phone,
        phone_date,
        dead=dead,
        death_date=death_date,
        death_device=death_device_db,
        death_location=death_location,
        origin_country=origin_country,
    )


def get_or_create_patient(
    first_name,
    last_name,
    post_name,
    mothers_surname,
    sex,
    year_of_birth,
    origin_area,
    origin_village,
    origin_raw_zs,
    origin_raw_as,
    origin_raw_village,
    age,
    phone=None,
    phone_date=None,
    dead=None,
    death_date=None,
    death_device=None,
    death_location=None,
    origin_country=None,
):
    first_name = name_normalize(first_name)
    last_name = name_normalize(last_name)
    post_name = name_normalize(post_name)
    mothers_surname = name_normalize(mothers_surname)

    patient_search_params = dict(
        post_name=post_name,
        first_name=first_name,
        last_name=last_name,
        mothers_surname=mothers_surname,
        sex=sex,
        year_of_birth=year_of_birth,
        origin_country=origin_country,
    )

    if origin_area:
        patient_search_params["origin_area"] = origin_area
    else:
        patient_search_params["origin_raw_AS"] = origin_raw_as
        patient_search_params["origin_raw_ZS"] = origin_raw_zs

    if origin_village:
        patient_search_params["origin_village"] = origin_village
    else:
        patient_search_params["origin_raw_village"] = origin_raw_village

    # This should normally return only one result. In case of MultipleObjectsReturned, we want this to fail.
    try:
        # TODO use update or create ?
        patient, patient_created = Patient.objects.get_or_create(
            **patient_search_params,
            defaults={
                "age": age,
                "dead": dead,
                "death_date": death_date,
                "death_device": death_device,
                "death_location": death_location,
                "phone_number": phone,
                "phone_number_date": phone_date,
            },
        )
        if not patient_created and phone and phone != patient.phone_number:
            patient.phone_number = phone
            patient.phone_number_date = phone_date
    except MultipleObjectsReturned as exc:
        print("multiple patients found")
        for p in Patient.objects.filter(**patient_search_params):
            print(
                f"[{p.id}] {p.first_name} {p.last_name} {p.post_name} (m: {p.mothers_surname}) in {p.origin_village}"
            )
        raise exc

    return patient, patient_created


def should_hide_screening(case, test_date):
    if test_date is None or test_date == "":
        return False
    if type(test_date) == str:
        test_date = dateutil.parser.parse(test_date)
    try:
        other_test = (
            Test.objects.filter(form__normalized_patient=case.normalized_patient)
            .filter(type__in=[CATT, RDT])
            .filter(
                date__range=[
                    test_date - timedelta(days=90),
                    test_date + timedelta(days=1),
                ]
            )
            .exclude(form=case)
        )  # don't find ourself
        return other_test.count() > 0
    except Exception as e:
        print("Exception while computing time difference with", test_date, e)
        return False


def get_devicedb_info_cached(device_id, cache):
    if device_id is None:
        return None, None, None
    devicedb_id, team_id, device_last_profile_id = cache.get(
        device_id, (None, None, None)
    )
    if devicedb_id is None:
        try:
            devicedb = DeviceDB.objects.get(device_id=device_id)
            devicedb_id = devicedb.id
            team = devicedb.get_team()
            team_id = team.id if team else None
            profile = Profile.objects.filter(user_id=devicedb.last_user_id).first()
            device_last_profile_id = profile.id if profile else None
            cache[device_id] = (devicedb_id, team_id, device_last_profile_id)
        except DeviceDB.DoesNotExist:
            logger.warning("Could not find device ID", device_id, "skipping")
            return None, None, None
    return devicedb_id, team_id, device_last_profile_id


def create_test_data(case: Case, patient_area, raw):
    tests = []
    tests_created = 0

    device_cache = (
        {}
    )  # Most cases will have multiple tests from the same device, let's cache it

    test_types = {
        CATT: "test_catt",
        RDT: "test_rdt",
        PG: "test_pg",
        PL: "test_pl",
        CTCWOO: "test_ctcwoo",
        MAECT: "test_maect",
        SF: "test_sf",
        SP: "test_sternal_puncture",
        IFAT: "test_ifat",
        LCR: "test_lcr",
        DIL: "test_dil",
        GE: "test_ge",
        CLINICAL_SICKNESS: "test_clinical_sickness",
        LNP: "test_lymph_node_puncture",
        PARASIT: "test_parasit",
        RESEARCH_PL: "test_research_pl",
    }
    for test_type, test_field in test_types.items():
        test_result = getattr(raw, test_field, None)
        if test_result is not None:
            test_date = raw.get(f"{test_field}_test_time", None)
            # CATT and RDT tests with confirmation tests and another screening tests within 90 days
            # should be automatically hidden
            hidden = (
                should_hide_screening(case, test_date)
                if test_type in [CATT, RDT]
                else False
            )

            (
                devicedb_id,
                device_team_id,
                device_last_profile_id,
            ) = get_devicedb_info_cached(
                raw.get(f"{test_field}_test_device"), device_cache
            )
            test, test_created = get_or_create_test(
                case=case,
                test_type=test_type,
                result=test_result,
                hidden=hidden,
                video=getattr(case, f"{test_field}_video_filename", None),
                image=getattr(case, f"{test_field}_picture_filename", None),
                traveller_area=patient_area,
                test_date=test_date,
                devicedb_id=devicedb_id,
                team_id=device_team_id,
                longitude=raw.get(f"{test_field}_test_longitude"),
                latitude=raw.get(f"{test_field}_test_latitude"),
                tester_id=device_last_profile_id,
                level=get_case_level(
                    case, test_type, test_field
                ),  # CATT level or PL stage
                index=getattr(case, f"{test_field}_index", None),  # CATT only
                comment=getattr(raw, f"{test_field}_comment", None),
            )
            if test_created:
                tests_created += 1
            tests.append(test)

    return tests, tests_created


def get_case_level(case, test_type, test_field):
    level = getattr(case, f"{test_field}_level", None)
    if level is None and test_type == PL:
        if case.test_pl_result == "stage1":
            level = 1
        elif case.test_pl_result == "stage2":
            level = 2
        else:
            level = None
    return level


def get_or_create_test(
    case,
    test_type,
    result,
    image=None,
    video=None,
    index=None,
    traveller_area=None,
    test_date=None,
    hidden=False,
    devicedb_id=None,
    device_id=None,
    location=None,
    latitude=None,
    longitude=None,
    team_id=None,
    tester_id=None,
    level=None,
    comment=None,
):
    if test_date:
        test_date = dateutil.parser.parse(test_date)
    else:
        test_date = case.document_date

    if devicedb_id is None and device_id is not None:
        devicedb = DeviceDB.objects.get(device_id=device_id)
        devicedb_id = devicedb.id
        team = devicedb.get_team()
        team_id = team.id if team else None

    if location is None and latitude is not None and longitude is not None:
        location = Point(longitude, latitude, srid=GPS_SRID)

    # I chose to ignore the filename when searching for the test, not sure that's right
    test, test_created = Test.objects.get_or_create(
        type=test_type,
        date__date=test_date,
        index=index,
        village=case.normalized_village,
        form=case,
        image_filename=image,
        video_filename=video,
        device_id=devicedb_id,
        defaults={
            "traveller_area": traveller_area,
            "date": test_date,
            "hidden": hidden,
            "location": location,
            "team_id": team_id,
            "level": level,
            "comment": comment,
        },
    )

    if test_created:
        if test.date and (
            test.form.latest_test_date is None or test.date > test.form.latest_test_date
        ):
            # Use an update to avoid interfering with a .save() of the whole object.
            Case.objects.filter(id=test.form_id).update(latest_test_date=test.date)
        test.result = result
        test.comment = comment
        test.tester_id = tester_id
        if image:
            db_image = find_image_by_test(filepath=image, test_type=test_type)
            if db_image:
                test.image = db_image

        if video:
            db_video = find_video_by_test(filepath=video, test_type=test_type)
            if db_video:
                test.video = db_video

        test.save()

    return test, test_created


def find_image_by_test(filepath, test_type):
    filename = _path_leaf(filepath)
    images = ImageUpload.objects.filter(
        image=ImageUpload.UPLOADED_TO + filename
    ).filter(type=test_type)

    if images.count() == 0:
        return None
    elif images.count() == 1:
        return images[0]
    else:
        return None


def find_video_by_test(filepath, test_type):
    filename = _path_leaf(filepath)
    videos = VideoUpload.objects.filter(
        video=VideoUpload.UPLOADED_TO + filename
    ).filter(type=test_type)

    if videos.count() == 0:
        return None
    elif videos.count() == 1:
        return videos[0]
    else:
        return None


def find_tests_by_image(filepath, test_type, include_already_linked=False):
    filename = _path_leaf(filepath)

    tests = Test.objects.filter(
        Q(image_filename=filename) | Q(image_filename__endswith=filename)
    ).filter(type=test_type)

    if not include_already_linked:
        tests = tests.filter(image__isnull=True)

    return tests


def find_tests_by_video(filepath, test_type, include_already_linked=False):
    filename = _path_leaf(filepath)

    tests = Test.objects.filter(
        Q(video_filename=filename) | Q(video_filename__endswith=filename)
    ).filter(type=test_type)

    if not include_already_linked:
        tests = tests.filter(video__isnull=True)

    return tests


def create_or_udpate_treatments(patient, treatments, device_id):
    for i, dict_treatment in enumerate(treatments):
        treatment = defaultdict(
            lambda: None, dict_treatment
        )  # most elements are optional, avoid get()-frenzy
        Treatment.objects.update_or_create(
            patient=patient,
            index=i,
            defaults={
                "start_date": mobile_get_date(treatment["startDate"]),
                "end_date": mobile_get_date(treatment["endDate"]),
                "entry_date": treatment["testTime"],
                "medicine": treatment["medicine"],
                "lost": mobile_get_null_boolean(treatment["lost"]),
                "dead": mobile_get_null_boolean(treatment["dead"]),
                "complete": mobile_get_null_boolean(treatment["complete"]),
                "adverse_effects": mobile_get_null_boolean(treatment["adverseEffects"]),
                "success": mobile_get_null_boolean(treatment["success"]),
                "event": mobile_get_null_boolean(treatment["event"]),
                "device": DeviceDB.objects.filter(device_id=device_id).first(),
                "location": mobile_get_location_from_gps(treatment["position"]),
                "issues": treatment.get("issues", []),
                "other_issues": treatment.get("otherIssues", ""),
                "incomplete_reasons": treatment.get("incompleteReasons", []),
            },
        )


# https://stackoverflow.com/questions/8384737/extract-file-name-from-path-no-matter-what-the-os-path-format
def _path_leaf(path):
    head, tail = ntpath.split(path)
    return tail or ntpath.basename(head)
