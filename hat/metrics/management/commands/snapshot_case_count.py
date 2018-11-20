from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.metrics.models import Metric, DataPoint
from hat.patient.models import Patient, Test


class Command(BaseCommand):
    help = 'Count the number of lines of cases_case, patient_patient and patient_test, with a patient/case ratio'

    def handle(self, *args, **options):
        case_count = Case.objects.count()
        patient_count = Patient.objects.count()
        test_count = Test.objects.count()
        patient_case_ratio = patient_count / case_count

        case_metric, _ = Metric.objects.get_or_create(name="Cases_case count",
                                                      description="Number of records in the database",
                                                      abbreviation="casecount")
        DataPoint(value=case_count, metric=case_metric).save()

        patient_metric, _ = Metric.objects.get_or_create(name="Patient_patient count",
                                                         description="Number of unique patients in the database",
                                                         abbreviation="patientcount")
        DataPoint(value=patient_count, metric=patient_metric).save()

        test_metric, _ = Metric.objects.get_or_create(name="Patient_test count",
                                                      description="Number of tests in the database",
                                                      abbreviation="testtcount")
        DataPoint(value=test_count, metric=test_metric).save()

        patient_case_ratio_metric, _ = Metric.objects.get_or_create(name="Patient_case ratio",
                                                                    description="Ratio of patients per case",
                                                                    abbreviation="patientcaseratio")
        DataPoint(value=patient_case_ratio, metric=patient_case_ratio_metric).save()
