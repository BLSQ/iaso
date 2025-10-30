from itertools import groupby
from operator import itemgetter


class AggregatedJourney:
    def group_visit_by_admission(self, current_visit, row, org_unit):
        visit_by_admission_type = groupby(list(current_visit), key=itemgetter("visit__journey__admission_type"))
        visit_admission_types = []
        for admission_type, visit_admission_type in visit_by_admission_type:
            visit_types = list(visit_admission_type)
            beneficiary_by_admission_types = set(
                visit_type["visit__journey__beneficiary__entity_id"] for visit_type in visit_types
            )
            row["dhis2_id"] = visit_types[0]["visit__org_unit__source_ref"]
            row["admission_type"] = admission_type
            row["beneficiary_with_admission_type"] = len(visit_types)
            visit_by_admission_criteria = groupby(
                visit_types,
                key=itemgetter("visit__journey__admission_criteria"),
            )
            row["muac_under_11_5"] = 0
            row["muac_above_12_5"] = 0
            row["muac_11_5_12_4"] = 0
            row["muac_under_23"] = 0
            row["muac_above_23"] = 0
            row["given_sachet_rutf"] = 0
            row["given_sachet_rusf"] = 0
            row["given_quantity_csb"] = 0

            row["whz_score_2"] = 0
            row["whz_score_3"] = 0
            row["whz_score_3_2"] = 0
            row["oedema"] = 0

            for (
                admission_criteria,
                visit_admission_criteria,
            ) in visit_by_admission_criteria:
                row["admission_criteria"] = admission_criteria
                all_visits_by_criteria = list(visit_admission_criteria)
                row["programme_type"] = all_visits_by_criteria[0]["visit__journey__programme_type"]
                all_visits_by_ration_size = groupby(all_visits_by_criteria, key=itemgetter("ration_size"))

                row["whz_score_2"] = row["whz_score_2"] + sum(
                    visit.get("whz_score_2", 0) for visit in all_visits_by_criteria
                )
                row["whz_score_3"] = row["whz_score_3"] + sum(
                    visit.get("whz_score_3", 0) for visit in all_visits_by_criteria
                )
                row["whz_score_3_2"] = row["whz_score_3_2"] + sum(
                    visit.get("whz_score_3_2", 0) for visit in all_visits_by_criteria
                )
                row["oedema"] = row["oedema"] + sum(visit.get("oedema", 0) for visit in all_visits_by_criteria)

                journey_by_exit_types = groupby(
                    list(all_visits_by_criteria), key=itemgetter("visit__journey__exit_type")
                )

                for exit_type, journey_by_exit_type in journey_by_exit_types:
                    aggregated_journey_by_exit_type = list(journey_by_exit_type)
                    row["exit_type"] = exit_type
                    distinct_beneficiary = set(
                        journey_by_exit_type["visit__journey__beneficiary__entity_id"]
                        for journey_by_exit_type in aggregated_journey_by_exit_type
                    )
                    row["beneficiary_with_exit_type"] = len(distinct_beneficiary)

                    row["muac_under_11_5"] = row["muac_under_11_5"] + sum(
                        visit.get("muac_under_11_5", 0) for visit in aggregated_journey_by_exit_type
                    )
                    row["muac_above_12_5"] = row["muac_above_12_5"] + sum(
                        visit.get("muac_above_12_5", 0) for visit in aggregated_journey_by_exit_type
                    )
                    row["muac_11_5_12_4"] = row["muac_11_5_12_4"] + sum(
                        visit.get("muac_11_5_12_4", 0) for visit in aggregated_journey_by_exit_type
                    )

                    row["muac_under_23"] = row["muac_under_23"] + sum(
                        visit.get("muac_under_23", 0) for visit in aggregated_journey_by_exit_type
                    )
                    row["muac_above_23"] = row["muac_above_23"] + sum(
                        visit.get("muac_above_23", 0) for visit in aggregated_journey_by_exit_type
                    )

                    row["given_sachet_rutf"] = row["given_sachet_rutf"] + sum(
                        visit.get("quantity_given", 0)
                        for visit in aggregated_journey_by_exit_type
                        if visit.get("assistance_type") == "rutf"
                    )
                    row["given_sachet_rusf"] = row["given_sachet_rusf"] + sum(
                        visit.get("quantity_given", 0)
                        for visit in aggregated_journey_by_exit_type
                        if visit.get("assistance_type") == "rusf"
                    )
                    row["given_quantity_csb"] = row["given_quantity_csb"] + sum(
                        visit.get("csb_quantity", 0)
                        for visit in aggregated_journey_by_exit_type
                        if visit.get("assistance_type") in ["csb", "csb1", "csb2"]
                    )
                    row["org_unit"] = org_unit
                    row["number_visits"] = len(aggregated_journey_by_exit_type)
                    visit_admission_types.append({**row})
        return visit_admission_types

    def group_by_period(self, visits_by_period, org_unit):
        row = None
        monthly = []
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
                    visit_by_admissions = self.group_visit_by_admission(current_visit, row, org_unit)
                    monthly.extend(visit_by_admissions)
        return monthly

    def aggregate_by_field_name(self, rows, field_name):
        total = 0
        total = total + sum(float(row.get(field_name, 0)) for row in rows)
        return int(total)

    def aggregated_rows(self, journeys):
        row = {}
        row["total_beneficiary"] = self.aggregate_by_field_name(journeys, "beneficiary_with_admission_type")
        row["total_with_exit_type"] = self.aggregate_by_field_name(journeys, "beneficiary_with_exit_type")
        row["muac_under_11_5"] = self.aggregate_by_field_name(journeys, "muac_under_11_5")
        row["muac_11_5_12_4"] = self.aggregate_by_field_name(journeys, "muac_11_5_12_4")
        row["muac_above_12_5"] = self.aggregate_by_field_name(journeys, "muac_above_12_5")
        row["muac_under_23"] = self.aggregate_by_field_name(journeys, "muac_under_23")
        row["muac_above_23"] = self.aggregate_by_field_name(journeys, "muac_above_23")
        row["whz_score_3_2"] = self.aggregate_by_field_name(journeys, "whz_score_3_2")
        row["whz_score_2"] = self.aggregate_by_field_name(journeys, "whz_score_2")
        row["whz_score_3"] = self.aggregate_by_field_name(journeys, "whz_score_3")
        row["oedema"] = self.aggregate_by_field_name(journeys, "oedema")
        row["admission_sc_itp_otp"] = self.aggregate_by_field_name(journeys, "admission_sc_itp_otp")
        row["transfer_from_other_tsfp"] = self.aggregate_by_field_name(journeys, "transfer_from_other_tsfp")
        row["transfer_sc_itp_otp"] = self.aggregate_by_field_name(journeys, "transfer_sc_itp_otp")
        return row
