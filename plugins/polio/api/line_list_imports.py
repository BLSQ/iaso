import logging
from datetime import datetime

import pandas as pd
from django.db import transaction
from django.http import FileResponse
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import serializers
from rest_framework.decorators import action

from iaso.api.common import ModelViewSet
from plugins.polio.models import VIRUSES, Campaign, LineListImport

LINE_LIST_TEMPLATE_PATH = "plugins/polio/fixtures/linelist_template.xls"


def _error(message, exc=None):
    errors = {"file": [message]}
    if exc:
        errors["debug"] = [str(exc)]
    return errors


@transaction.atomic
def campaign_from_files(file, account):
    try:
        df = pd.read_excel(file)
    except Exception as exc:
        print(exc)
        raise serializers.ValidationError(_error("Invalid Excel file", exc))
    mapping = {"EPID Number": "epid", "VDPV Category": "virus", "Onset Date": "onset_at"}
    for key in mapping.keys():
        if key not in df.columns:
            raise serializers.ValidationError(_error(f"Missing column {key}"))
    known_viruses = [v[0] for v in VIRUSES]
    created_campaigns = []
    skipped_campaigns = []

    for ind in df.index:
        epid = df["EPID Number"][ind]
        if not epid:
            break
        onset_date = df["Onset Date"][ind]
        virus = df["VDPV Category"][ind]
        print(epid, onset_date, type(onset_date), virus)
        c, created = Campaign.objects.get_or_create(epid=epid, account=account)
        if not created:
            skipped_campaigns.append(epid)
            print(f"Skipping existing campaign {c.epid}")
            continue

        c.obr_name = epid
        if virus in known_viruses:
            c.virus = virus
        else:
            raise serializers.ValidationError(_error(f"wrong format for virus on line {ind}"))
        if isinstance(onset_date, datetime):
            print(onset_date, type(onset_date))
            c.onset_at = onset_date
        else:
            raise serializers.ValidationError(_error(f"wrong format for onset_date on line {ind}"))

        created_campaigns.append({"id": str(c.id), "epid": c.epid})
        c.save()

    res = {"created": len(created_campaigns), "campaigns": created_campaigns, "skipped_campaigns": skipped_campaigns}
    print(res)
    return res


class LineListImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineListImport
        fields = ["file", "import_result", "created_by", "created_at"]
        read_only_fields = ["import_result", "created_by", "created_at"]

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        line_list_import = LineListImport(
            file=validated_data.get("file"),
            import_result="pending",
            created_by=self.context["request"].user,
        )

        line_list_import.save()

        # Tentatively created campaign, will transaction.abort in case of error
        try:
            res = campaign_from_files(line_list_import.file, account)
        except Exception as exc:
            logging.exception(exc)
            if isinstance(exc, serializers.ValidationError):
                res = {"error": exc.get_full_details()}
            else:
                res = {"error": str(exc)}
            line_list_import.import_result = res
            line_list_import.save()
            raise

        line_list_import.import_result = res
        line_list_import.save()
        return line_list_import


class LineListImportViewSet(ModelViewSet):
    serializer_class = LineListImportSerializer
    results_key = "imports"

    def get_queryset(self):
        return LineListImport.objects.all()

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="getsample")
    def download_sample_csv(self, request):
        return FileResponse(open(LINE_LIST_TEMPLATE_PATH, "rb"))
