from hat.constants import CATT, RDT, CTCWOO, MAECT, PG
from hat.patient.models import Test, Patient


class Identify:
    """
    This class provides the tools to identify patients and tests from Case data
    """

    @staticmethod
    def name_normalize(name):
        if name is None:
            return None

        return name.strip()

    def get_or_create_patient(self, case):
        first_name = self.name_normalize(case.prename)
        last_name = self.name_normalize(case.lastname)
        post_name = self.name_normalize(case.name)
        mothers_surname = self.name_normalize(case.mothers_surname)

        patient, patient_created = Patient.objects.get_or_create(
            post_name=post_name, first_name=first_name, last_name=last_name, mothers_surname=mothers_surname,
            sex=case.sex, year_of_birth=case.year_of_birth)

        if patient_created:
            if case.age is not None:
                patient.age = case.age
            else:
                if case.year_of_birth is not None and case.year_of_birth <= case.entry_date.year:
                    patient.age = case.entry_date.year - int(case.year_of_birth)
            patient.save()

        return patient, patient_created

    def create_test_data(self, case):
        tests = []
        tests_created = 0
        if case.test_catt is not None:
            test, test_created = self.get_or_create_test(
                case, test_type=CATT, result=case.test_catt)
            if test_created:
                tests_created += 1
            tests.append(test)

        if case.test_rdt is not None:
            test, test_created = self.get_or_create_test(
                case, test_type=RDT, result=case.test_rdt)
            if test_created:
                tests_created += 1
            tests.append(test)

        if case.test_pg is not None:
            test, test_created = self.get_or_create_test(
                case, test_type=PG, result=case.test_pg)
            if test_created:
                tests_created += 1
            tests.append(test)

        if case.test_ctcwoo is not None:
            test, test_created = self.get_or_create_test(
                case, test_type=CTCWOO, result=case.test_ctcwoo)
            if test_created:
                tests_created += 1
            tests.append(test)

        if case.test_maect is not None:
            test, test_created = self.get_or_create_test(
                case, test_type=MAECT, result=case.test_maect)
            if test_created:
                tests_created += 1
            tests.append(test)

        return tests, tests_created

    @staticmethod
    def get_or_create_test(case, test_type, result, note=None, image=None, video=None):
        # index will need to be added to the cases_case and the test
        test, test_created = Test.objects.get_or_create(type=test_type, date=case.document_date, index=None,
                                                        village=case.normalized_village, form=case)
        if test_created:
            test.result = result
            test.note = note
            test.image = image
            test.video = video
            test.save()

        return test, test_created
