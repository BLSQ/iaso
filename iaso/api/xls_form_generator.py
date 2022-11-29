from pprint import pprint

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework import serializers, filters
from rest_framework.viewsets import ModelViewSet
import string
from datetime import datetime
from tempfile import NamedTemporaryFile
import openpyxl
from iaso.api.common import DeletionFilterBackend, TimestampField
from iaso.models import Group
from iaso.models.xls_form_template import XlsFormTemplate
from plugins.polio.models import Campaign


class XlsFormTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = XlsFormTemplate
        fields = "__all__"

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


def get_data_from_campaigns(campaign_id, row, q_sheet, calculation_index):
    """This function get the data from a campaign and insert it in the calculation row
    of the xlsform. It's tagged as 'insert_field' in the xlsform.
    """
    authorized_fields = [
        "id",
        "epid",
        "obr_name",
        "gpei_email",
        "description",
        "creation_email_send_at",
        "onset_at",
        "three_level_call_at",
        "cvdpv_notified_at",
        "cvdpv2_notified_at",
        "pv_notified_at",
        "pv2_notified_at",
        "virus",
        "detection_status",
        "detection_responsible",
        "detection_first_draft_submitted_at",
        "detection_rrt_oprtt_approval_at",
        "risk_assessment_status",
        "risk_assessment_responsible",
        "investigation_at",
        "risk_assessment_first_draft_submitted_at",
        "risk_assessment_rrt_oprtt_approval_at",
        "ag_nopv_group_met_at",
        "dg_authorized_at",
        "verification_score",
        "doses_requested",
        "preperadness_spreadsheet_url",
        "preperadness_sync_status",
        "surge_spreadsheet_url",
        "country_name_in_surge_spreadsheet",
        "budget_status",
        "budget_responsible",
        "created_at",
        "updated_at",
        "district_count",
        "round_one",
        "round_two",
        "vacine",
        "obr_name",
    ]
    campaign = get_object_or_404(Campaign, id=campaign_id)
    for i in range(2, row + 1):
        cell_obj = q_sheet.cell(row=i, column=2)
        cell_value_start = cell_obj.value[:7] if cell_obj.value is not None else ""
        if cell_value_start == "insert_":
            str_request = cell_obj.value[7:]
            if str_request in authorized_fields:
                cell_obj = q_sheet.cell(row=i, column=calculation_index)
                cell_obj.value = str(getattr(campaign, str_request))


def create_ou_tree_list(group_ou):
    # create list of dictionary with OU tree
    ou_tree_list = []
    for ou in group_ou:
        ou_tree_dict = {ou.org_unit_type.name: ou for ou in ou.create_ou_tree()}
        ou_tree_list.append(ou_tree_dict)
    return ou_tree_list


class XlsFormGeneratorViewSet(ModelViewSet):
    results_key = "xlsformgenerator"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, DeletionFilterBackend]

    def get_serializer_class(self):
        return XlsFormTemplateSerializer

    def get_queryset(self):
        queryset = XlsFormTemplate.objects.filter(account=self.request.user.iaso_profile.account)
        return queryset

    @action(methods=["GET"], detail=False)
    def xlsform_generator(self, request) -> HttpResponse:
        """
        Export a xlsform by using a group as OU source. A template is required. Specific data can be extracted from campaigns by
        starting the name variable by 'insert_' in the xls file in "calculate" row. The data will be saved in the
        calculation column.
        """
        group_id = request.query_params.get("groupid", None)
        form_name = request.query_params.get("form_name", None)
        campaign_id = request.query_params.get("campaignid", None)
        org_unit_type_list = request.GET.get("outypelist", None).split(",")
        ou_hierarchy_list = request.GET.get("ouhierarchy", None).split(",")

        if not form_name:
            raise serializers.ValidationError({"error": "No form provided."})

        group = get_object_or_404(Group, id=group_id)

        # Check if User has access to Group
        if not group.user_has_access_to(request.user):
            raise serializers.ValidationError({"error": "You don't have the access to this Org Unit group."})

        if not ou_hierarchy_list:
            raise serializers.ValidationError({"error": "You must provied an Org unit hierarchy."})

        try:
            path = XlsFormTemplate.objects.get(name=form_name).form_template.path
        except ValueError:
            raise serializers.ValidationError({"error": f"Bad Template Name."})

        group_ou = group.org_units.all()

        ou_tree_list = create_ou_tree_list(group_ou)

        wb = openpyxl.load_workbook(path)
        ws = wb.active
        sheet = wb.get_sheet_by_name("choices")
        choices_row = 2
        choices_column = 1
        cell = list(string.ascii_uppercase)
        q_sheet = wb.get_sheet_by_name("survey")
        survey_columns = []
        survey_last_empty_row = len(list(q_sheet.rows))
        for l in cell:
            survey_columns.append(q_sheet[f"{l}1"].value)

        added_countries = []
        added_regions = []
        added_district = []
        added_facilities = []
        region_added = False
        district_added = False
        facility_added = False

        # create xls columns
        sheet[cell[choices_column - 1] + "1"] = "list name"
        sheet[cell[choices_column] + "1"] = "name"
        sheet[cell[choices_column + 1] + "1"] = "label"
        sheet[cell[choices_column + 2] + "1"] = "id"
        i = 2
        for ou_type in org_unit_type_list:
            sheet[cell[choices_column + i] + "1"] = ou_type
            i += 1

        # insert rows to add the org units fields at the top of the file
        ws.insert_rows(3, 5)

        added_ou_list = []
        key_added_to_choice_list = []
        starting_row = 3
        ou_hierarchy_list = [d.lower() for d in ou_hierarchy_list]

        # populate xls with OU
        for ou_dic in ou_tree_list:
            for k, v in ou_dic.items():
                if v.id not in added_ou_list:
                    added_ou_list.append(v.id)
                    if k not in key_added_to_choice_list:
                        # Add the ou type to the select choices of the xls form
                        key_added_to_choice_list.append(k)
                        q_sheet[cell[0] + str(starting_row)] = f"select_one ou_{str(k).lower()}"
                        q_sheet[cell[1] + str(starting_row)] = f"ou_{str(k).lower()}"
                        q_sheet[cell[2] + str(starting_row)] = f"Select {k}"
                        q_sheet[cell[3] + str(starting_row)] = "yes"
                    sheet[cell[choices_column - 1] + str(choices_row)] = f"ou_{str(k).lower()}"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)

                    index_hierarchy = ou_hierarchy_list.index(str(k.lower()))
                    ou_dic = {k.lower(): v for k, v in ou_dic.items()}

                    calculation_index = 0
                    print(index_hierarchy)
                    if index_hierarchy > 0:
                        index_hierarchy -= 1
                        for row_calc in sheet.rows:
                            iterator = 0
                            for s_cell in row_calc:
                                iterator += 1
                                print(f"CELL : {s_cell.value}")
                                print(f"OU : {ou_hierarchy_list[index_hierarchy].lower()}")
                                if str(s_cell.value).lower() == ou_hierarchy_list[index_hierarchy].lower():
                                    print("fOUND ?")
                                    calculation_index += iterator
                                    break
                    parent_ou_id = ou_dic.get(ou_hierarchy_list[index_hierarchy].lower()).id
                    sheet[cell[choices_column + calculation_index - 1] + str(choices_row)] = str(parent_ou_id)

                    choices_row += 1
                    starting_row += 1
                    survey_last_empty_row += 1

                # if k == "COUNTRY" and v not in added_countries:
                #     sheet[cell[choices_column - 1] + str(choices_row)] = "ou_country"
                #     sheet[cell[choices_column] + str(choices_row)] = v.id
                #     sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                #     choices_row += 1
                #     survey_last_empty_row += 1
                # if k == "REGION" and v not in added_regions:
                #     survey_last_empty_row += 2
                #     added_regions.append(v)
                #     if not region_added:
                #         q_sheet[cell[0] + str(4)] = "select_one ou_region"
                #         q_sheet[cell[1] + str(4)] = "ou_region"
                #         q_sheet[cell[2] + str(4)] = "Select a Region"
                #         q_sheet[cell[9] + str(4)] = "country=${ou_country}"
                #         region_added = True
                #     sheet[cell[choices_column - 1] + str(choices_row)] = "ou_region"
                #     sheet[cell[choices_column] + str(choices_row)] = v.id
                #     sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                #     sheet[cell[choices_column + 3] + str(choices_row)] = (
                #         ou_dic.get("COUNTRY", None)
                #         if ou_dic.get("COUNTRY", None) is None
                #         else ou_dic.get("COUNTRY", None).pk
                #     )
                #     choices_row += 1
                #     survey_last_empty_row += 1

                # if k == "DISTRICT" and v not in added_district:
                #     survey_last_empty_row += 4
                #     added_district.append(v)
                #     if not district_added:
                #         q_sheet[cell[0] + str(5)] = "select_one ou_district"
                #         q_sheet[cell[1] + str(5)] = "ou_district"
                #         q_sheet[cell[2] + str(5)] = "Select a District"
                #         q_sheet[cell[9] + str(5)] = "region=${ou_region}"
                #         district_added = True
                #     sheet[cell[choices_column - 1] + str(choices_row)] = "ou_district"
                #     sheet[cell[choices_column] + str(choices_row)] = v.id
                #     sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                #     sheet[cell[choices_column + 3] + str(choices_row)] = (
                #         ou_dic.get("COUNTRY", None)
                #         if ou_dic.get("COUNTRY", None) is None
                #         else ou_dic.get("COUNTRY", None).pk
                #     )
                #     sheet[cell[choices_column + 4] + str(choices_row)] = (
                #         ou_dic.get("REGION", None)
                #         if ou_dic.get("REGION", None) is None
                #         else ou_dic.get("REGION", None).pk
                #     )
                #     choices_row += 1
                #     survey_last_empty_row += 1
                #
                # if k == "HEALTH FACILITY" and v not in added_facilities:
                #     survey_last_empty_row += 6
                #     added_facilities.append(v)
                #     if not facility_added:
                #         q_sheet[cell[0] + str(6)] = "select_one ou_facility"
                #         q_sheet[cell[1] + str(6)] = "ou_facility"
                #         q_sheet[cell[2] + str(6)] = "Select a Health Facility"
                #         q_sheet[cell[9] + str(6)] = "district=${ou_district}"
                #         district_added = True
                #     sheet[cell[choices_column - 1] + str(choices_row)] = ""
                #     sheet[cell[choices_column] + str(choices_row)] = v.id
                #     sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                #     sheet[cell[choices_column + 3] + str(choices_row)] = (
                #         ou_dic.get("COUNTRY", None)
                #         if ou_dic.get("COUNTRY", None) is None
                #         else ou_dic.get("COUNTRY", None).pk
                #     )
                #     sheet[cell[choices_column + 4] + str(choices_row)] = (
                #         ou_dic.get("REGION", None)
                #         if ou_dic.get("REGION", None) is None
                #         else ou_dic.get("REGION", None).pk
                #     )
                #     sheet[cell[choices_column + 5] + str(choices_row)] = (
                #         ou_dic.get("DISTRICT", None)
                #         if ou_dic.get("DISTRICT", None) is None
                #         else ou_dic.get("DISTRICT", None).name
                #     )
                #     choices_row += 1
                #     survey_last_empty_row += 1

        row = q_sheet.max_row

        # Get Calculation column position
        calculation_index = 0
        for row_calc in q_sheet.rows:
            iterator = 0
            for cell in row_calc:
                iterator += 1
                if cell.value == "calculation":
                    calculation_index = iterator
                    break

        # Insert data as calculation from campaigns
        if campaign_id and request.user.has_perm("iaso_polio"):
            get_data_from_campaigns(campaign_id, row, q_sheet, calculation_index)

        filename = f"FORM_{form_name}_{datetime.now().date()}.xlsx"

        with NamedTemporaryFile() as tmp:
            wb.save(tmp.name)
            tmp.seek(0)
            stream = tmp.read()

            response = HttpResponse(
                stream, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response
