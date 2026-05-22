from rest_framework import serializers

from plugins.polio.models.base import SpreadSheetImport
from plugins.polio.preparedness.parser import get_preparedness
from plugins.polio.preparedness.summary import preparedness_summary


class PreparednessScoreSerializer(serializers.Serializer):
    campaign_details = serializers.SerializerMethodField()
    scores = serializers.SerializerMethodField()

    def get_campaign_details(self, obj: SpreadSheetImport):
        if getattr(obj, "round_id", None) is None:
            return {}
        return {"round_id": obj.round_id, "round_number": obj.round_number, "campaign": obj.campaign}

    def get_scores(self, obj: SpreadSheetImport):
        cached_spreadsheet = obj.cached_spreadsheet
        preparedness_data = get_preparedness(cached_spreadsheet)
        summary = preparedness_summary(preparedness_data)
        score = summary["overall_status_score"]
        return {"score": score, **preparedness_data["totals"]}


class ParamsSerializer(serializers.Serializer):
    url = serializers.CharField(required=True)
    date = serializers.DateField(required=True)
