import ntpath

from django.db.models import Q

from hat.cases.models import Case
from hat.constants import CATT, RDT, CTCWOO, MAECT, PG, PL
from hat.patient.models import Test, Patient
from hat.sync.models import ImageUpload, VideoUpload

"""
This file provides the tools to identify patients and tests from Case data
"""


def name_normalize(name):
    if name is None:
        return None

    return name.strip()


def get_or_create_patient(case, origin_area, origin_village):
    first_name = name_normalize(case.prename)
    last_name = name_normalize(case.lastname)
    post_name = name_normalize(case.name)
    mothers_surname = name_normalize(case.mothers_surname)

    patient, patient_created = Patient.objects.get_or_create(
        post_name=post_name, first_name=first_name, last_name=last_name, mothers_surname=mothers_surname,
        sex=case.sex, year_of_birth=case.year_of_birth, origin_village=origin_village, origin_area=origin_area)

    if patient_created:
        if case.age is not None:
            patient.age = case.age
        else:
            if case.year_of_birth is not None and case.year_of_birth <= case.entry_date.year:
                patient.age = case.entry_date.year - int(case.year_of_birth)
        patient.save()

    return patient, patient_created


def create_test_data(case: Case, patient_area):
    tests = []
    tests_created = 0
    if case.test_catt is not None:
        test, test_created = get_or_create_test(
            case=case, test_type=CATT, result=case.test_catt, index=case.test_catt_index,
            image=case.test_catt_picture_filename, travaller_area=patient_area)
        if test_created:
            tests_created += 1
        tests.append(test)

    if case.test_rdt is not None:
        test, test_created = get_or_create_test(
            case=case, test_type=RDT, result=case.test_rdt, image=case.test_rdt_picture_filename,
            travaller_area=patient_area)
        if test_created:
            tests_created += 1
        tests.append(test)

    if case.test_pg is not None:
        test, test_created = get_or_create_test(
            case=case, test_type=PG, result=case.test_pg, video=case.test_pg_video_filename,
            travaller_area=patient_area)
        if test_created:
            tests_created += 1
        tests.append(test)

    if case.test_pl is not None:
        test, test_created = get_or_create_test(
            case=case, test_type=PL, result=case.test_pl, video=case.test_pl_video_filename,
            travaller_area=patient_area)
        if test_created:
            tests_created += 1
        tests.append(test)

    if case.test_ctcwoo is not None:
        test, test_created = get_or_create_test(
            case=case, test_type=CTCWOO, result=case.test_ctcwoo, video=case.test_ctcwoo_video_filename,
            travaller_area=patient_area)
        if test_created:
            tests_created += 1
        tests.append(test)

    if case.test_maect is not None:
        test, test_created = get_or_create_test(
            case=case, test_type=MAECT, result=case.test_maect, video=case.test_maect_video_filename,
            travaller_area=patient_area)
        if test_created:
            tests_created += 1
        tests.append(test)

    return tests, tests_created


def get_or_create_test(case, test_type, result, note=None, image=None, video=None, index=None, travaller_area=None):
    # I chose to ignore the filename when searching for the test, not sure that's right
    test, test_created = Test.objects.get_or_create(type=test_type, date=case.document_date, index=index,
                                                    village=case.normalized_village, form=case,
                                                    defaults={
                                                        'image_filename': image,
                                                        'video_filename': video,
                                                        'traveller_area': travaller_area})
    if test_created:
        test.result = result
        test.note = note

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
    images = ImageUpload.objects.filter(image=ImageUpload.UPLOADED_TO + filename) \
        .filter(type=test_type)

    if images.count() == 0:
        return None
    elif images.count() == 1:
        return images[0]
    else:
        return None


def find_video_by_test(filepath, test_type):
    filename = _path_leaf(filepath)
    videos = VideoUpload.objects.filter(video=VideoUpload.UPLOADED_TO + filename) \
        .filter(type=test_type)

    if videos.count() == 0:
        return None
    elif videos.count() == 1:
        return videos[0]
    else:
        return None


def find_tests_by_image(filepath, test_type, include_already_linked=False):
    filename = _path_leaf(filepath)

    tests = Test.objects.filter(
            Q(image_filename=filename) |
            Q(image_filename__endswith=filename)
        ).filter(type=test_type)

    if not include_already_linked:
        tests = tests.filter(image__isnull=True)

    return tests


def find_tests_by_video(filepath, test_type, include_already_linked=False):
    filename = _path_leaf(filepath)

    tests = Test.objects.filter(
            Q(video_filename=filename) |
            Q(video_filename__endswith=filename)
        ).filter(type=test_type)

    if not include_already_linked:
        tests = tests.filter(video__isnull=True)

    return tests


# https://stackoverflow.com/questions/8384737/extract-file-name-from-path-no-matter-what-the-os-path-format
def _path_leaf(path):
    head, tail = ntpath.split(path)
    return tail or ntpath.basename(head)
