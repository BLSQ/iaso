from itertools import groupby
from operator import itemgetter


class AggregatedJourney:
    def group_visit_by_admission(self, current_visit, row, assistance):
        visit_by_admission_type = groupby(list(current_visit), key=itemgetter("visit__journey__admission_type"))
        for admission_type, visit_admission_type in visit_by_admission_type:
            if admission_type is not None:
                row["admission_type"] = admission_type

            visit_by_admission_criteria = groupby(
                list(visit_admission_type),
                key=itemgetter("visit__journey__admission_criteria"),
            )
            for (
                admission_criteria,
                visit_admission_criteria,
            ) in visit_by_admission_criteria:
                if admission_type is not None:
                    row["admission_criteria"] = admission_criteria

                all_visits = [visit for visit in visit_admission_criteria]
                program_type = all_visits[0]["visit__journey__programme_type"]

                all_visits_by_ration_size = groupby(list(all_visits), key=itemgetter("ration_size"))
                row["programme_type"] = program_type
                for visit, steps in all_visits_by_ration_size:
                    for step in list(steps):
                        if step.get("assistance_type") == "rutf":
                            assistance["rutf_quantity"] = assistance.get("rutf_quantity", 0) + step.get(
                                "quantity_given", 0
                            )
                        if step.get("assistance_type") == "rusf":
                            assistance["rusf_quantity"] = assistance.get("rusf_quantity", 0) + step.get(
                                "quantity_given", 0
                            )
                        if step.get("assistance_type") in ["csb", "csb1", "csb2"]:
                            assistance["csb_quantity"] = assistance.get("csb_quantity", 0) + step.get(
                                "quantity_given", 0
                            )
                        if step.get("assistance_type") == "cbt":
                            assistance["cbt_ration"] = step.get("ration_size")

                        if step.get("visit__journey__exit_type") is not None:
                            row["exit_type"] = step.get("visit__journey__exit_type")

                row["number_visits"] = len(all_visits)
        return row

    def group_by_period(self, visits_by_period, org_unit, all_journeys, assistance):
        row = None
        for period, visit in visits_by_period:
            if period is not None:
                month_year = period.split("/")
                row = {"year": month_year[0], "month": month_year[1]}

            visit_by_gender = groupby(list(visit), key=itemgetter("visit__journey__beneficiary__gender"))
            for gender, current__visit_by_gender in visit_by_gender:
                row["gender"] = gender

                visits_by_nutrition_program = groupby(
                    list(current__visit_by_gender),
                    key=itemgetter("visit__journey__nutrition_programme"),
                )
                for nutrition_program, current_visit in visits_by_nutrition_program:
                    if nutrition_program is not None:
                        row["nutrition_programme"] = nutrition_program
                    row = self.group_visit_by_admission(current_visit, row, assistance)

            row["org_unit"] = org_unit
            row["given_sachet_rusf"] = assistance.get("rusf_quantity", 0)
            row["given_sachet_rutf"] = assistance.get("rutf_quantity", 0)
            row["given_quantity_csb"] = assistance.get("csb_quantity", 0)
            row["given_ration_cbt"] = assistance.get("cbt_ration", "")

            all_journeys.append(row)
        return all_journeys
