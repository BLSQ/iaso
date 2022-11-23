import string

import openpyxl
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework import serializers, filters
from rest_framework.viewsets import ModelViewSet

from django.db import connection

import string
from datetime import datetime

from tempfile import NamedTemporaryFile

import openpyxl


from iaso.api.common import DeletionFilterBackend, TimestampField
from iaso.models import Group
from iaso.models.xls_form_template import XlsFormTemplate


class XlsFormTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = XlsFormTemplate
        fields = "__all__"

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


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
        Export a xlsform out using a group as OU source. A template is required. Specific data can be extracted from campaigns by
        starting the name variable by 'insert_' in the xls file in "calculate" row. The data will be saved in the
        calculation column.
        """
        group_id = request.query_params.get("groupid", None)
        group = get_object_or_404(Group, id=group_id)
        form_name = request.query_params.get("form_name", None)

        if not form_name:
            raise serializers.ValidationError({"error": "No form provided."})

        # Check if User has access to Group
        if not group.user_has_access_to(request.user):
            raise serializers.ValidationError({"error": "You don't have the access to this Org Unit group."})

        try:
            path = XlsFormTemplate.objects.get(name=form_name).form_template.path
        except ValueError:
            raise serializers.ValidationError({"error": f"Bad Template Name."})

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

        ou_tree_list = []
        group_ou = group.org_units.all()

        # create list of dictionary with OU tree
        for ou in group_ou:
            ou_tree_dict = {ou.org_unit_type.name: ou}
            ou_parent = ou.parent
            if ou_parent is not None:
                ou_tree_dict[ou_parent.org_unit_type.name] = ou_parent
            while ou_parent is not None:
                ou_tree_dict[ou_parent.org_unit_type.name] = ou_parent
                ou_parent = ou_parent.parent
                if ou_parent is not None:
                    ou_tree_dict[ou_parent.org_unit_type.name] = ou_parent
            print(ou_tree_dict)
            ou_tree_list.append(ou_tree_dict)
            ou_children = ou.descendants()
            for ou_child in ou_children:
                ou_tree_dict[ou_child.org_unit_type.name] = ou_child

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
        sheet[cell[choices_column + 3] + "1"] = "country"
        sheet[cell[choices_column + 4] + "1"] = "region"
        sheet[cell[choices_column + 5] + "1"] = "district"
        sheet[cell[choices_column + 6] + "1"] = "health facility"

        # insert rows to add the org units fields at the top of the file
        ws.insert_rows(3, 5)

        # populate xls with OU
        for ou_dic in ou_tree_list:
            for k, v in ou_dic.items():
                if k == "COUNTRY" and v not in added_countries:
                    added_countries.append(v)
                    q_sheet[cell[0] + str(3)] = "select_one ou_country"
                    q_sheet[cell[1] + str(3)] = "ou_country"
                    q_sheet[cell[2] + str(3)] = "Select Country"
                    q_sheet[cell[3] + str(3)] = "yes"
                    sheet[cell[choices_column - 1] + str(choices_row)] = "ou_country"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    choices_row += 1
                    survey_last_empty_row += 1
                if k == "REGION" and v not in added_regions:
                    survey_last_empty_row += 2
                    added_regions.append(v)
                    if not region_added:
                        q_sheet[cell[0] + str(4)] = "select_one ou_region"
                        q_sheet[cell[1] + str(4)] = "ou_region"
                        q_sheet[cell[2] + str(4)] = "Select a Region"
                        q_sheet[cell[9] + str(4)] = "country=${ou_country}"
                        region_added = True
                    sheet[cell[choices_column - 1] + str(choices_row)] = "ou_region"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    sheet[cell[choices_column + 3] + str(choices_row)] = (
                        ou_dic.get("COUNTRY", None)
                        if ou_dic.get("COUNTRY", None) is None
                        else ou_dic.get("COUNTRY", None).pk
                    )
                    choices_row += 1
                    survey_last_empty_row += 1

                if k == "DISTRICT" and v not in added_district:
                    survey_last_empty_row += 4
                    added_district.append(v)
                    if not district_added:
                        q_sheet[cell[0] + str(5)] = "select_one ou_district"
                        q_sheet[cell[1] + str(5)] = "ou_district"
                        q_sheet[cell[2] + str(5)] = "Select a District"
                        q_sheet[cell[9] + str(5)] = "region=${ou_region}"
                        district_added = True
                    sheet[cell[choices_column - 1] + str(choices_row)] = "ou_district"
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    sheet[cell[choices_column + 3] + str(choices_row)] = (
                        ou_dic.get("COUNTRY", None)
                        if ou_dic.get("COUNTRY", None) is None
                        else ou_dic.get("COUNTRY", None).pk
                    )
                    sheet[cell[choices_column + 4] + str(choices_row)] = (
                        ou_dic.get("REGION", None)
                        if ou_dic.get("REGION", None) is None
                        else ou_dic.get("REGION", None).pk
                    )
                    choices_row += 1
                    survey_last_empty_row += 1

                if k == "HEALTH FACILITY" and v not in added_facilities:
                    survey_last_empty_row += 6
                    added_facilities.append(v)
                    if not facility_added:
                        q_sheet[cell[0] + str(6)] = "select_one ou_facility"
                        q_sheet[cell[1] + str(6)] = "ou_facility"
                        q_sheet[cell[2] + str(6)] = "Select a Health Facility"
                        q_sheet[cell[9] + str(6)] = "district=${ou_district}"
                        district_added = True
                    sheet[cell[choices_column - 1] + str(choices_row)] = ""
                    sheet[cell[choices_column] + str(choices_row)] = v.id
                    sheet[cell[choices_column + 1] + str(choices_row)] = str(v.name)
                    sheet[cell[choices_column + 3] + str(choices_row)] = (
                        ou_dic.get("COUNTRY", None)
                        if ou_dic.get("COUNTRY", None) is None
                        else ou_dic.get("COUNTRY", None).pk
                    )
                    sheet[cell[choices_column + 4] + str(choices_row)] = (
                        ou_dic.get("REGION", None)
                        if ou_dic.get("REGION", None) is None
                        else ou_dic.get("REGION", None).pk
                    )
                    sheet[cell[choices_column + 5] + str(choices_row)] = (
                        ou_dic.get("DISTRICT", None)
                        if ou_dic.get("DISTRICT", None) is None
                        else ou_dic.get("DISTRICT", None).name
                    )
                    choices_row += 1
                    survey_last_empty_row += 1

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

        # Insert data as calculation
        # FIXME: Use to be relevant when we were extracting data from campaign but now ?
        for i in range(2, row + 1):
            cell_obj = q_sheet.cell(row=i, column=2)
            cell_value_start = cell_obj.value[:7] if cell_obj.value is not None else ""
            if cell_value_start == "insert_":
                str_request = cell_obj.value[7:]
                cell_obj = q_sheet.cell(row=i, column=calculation_index)
                cell_obj.value = form_name
                # cell_obj.value = str(getattr(campaign, str_request))

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
