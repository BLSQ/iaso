from datetime import datetime, timedelta

from iaso.api.common import ModelViewSet
from iaso.models.data_store import JsonDataStore


class LqasAfroViewset(ModelViewSet):
    def compute_reference_dates(self):
        start_date_after = self.request.GET.get("startDate", None)
        end_date_before = self.request.GET.get("endDate", None)
        selected_period = self.request.GET.get("period", None)
        # Enforce 6 months as the default value
        if start_date_after is None and end_date_before is None and selected_period is None:
            selected_period = "6months"
        if selected_period is not None:
            if not selected_period[0].isdigit():
                raise ValueError("period should be 3months, 6months, 9months or 12months")
            # End_date should be None when selecting period, since its "from X months ago until now"
            end_date_before = None
            today = datetime.now()
            interval_in_months = int(selected_period[0])
            if selected_period[1].isdigit():
                interval_in_months = int(f"{selected_period[0]}{selected_period[1]}")
            # months have to be converted in days. using 31 days i.o 30 to avoid missing campaigns
            start_date_after = (today - timedelta(days=interval_in_months * 31)).date()
        else:
            if start_date_after is not None:
                start_date_after = datetime.strptime(start_date_after, "%d-%m-%Y").date()
            if end_date_before is not None:
                end_date_before = datetime.strptime(end_date_before, "%d-%m-%Y").date()
        return start_date_after, end_date_before

    def filter_campaigns_by_date(self, campaigns, reference, reference_date):
        requested_round = self.request.GET.get("round", "latest")
        round_number_to_find = int(requested_round) if requested_round.isdigit() else None
        if requested_round != "penultimate":
            if reference == "start":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_last_round_with_date(reference, round_number_to_find) is not None
                    and campaign.find_last_round_with_date(reference, round_number_to_find).started_at >= reference_date
                ]
            if reference == "end":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_last_round_with_date(reference, round_number_to_find) is not None
                    and campaign.find_last_round_with_date(reference, round_number_to_find).ended_at <= reference_date
                ]
        else:
            if reference == "start":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_rounds_with_date(reference, round_number_to_find).count() > 1
                    and list(campaign.find_rounds_with_date(reference, round_number_to_find))[1].started_at
                    >= reference_date
                ]
            if reference == "end":
                return [
                    campaign
                    for campaign in campaigns
                    if campaign.find_rounds_with_date(reference, round_number_to_find).count() > 1
                    and list(campaign.find_rounds_with_date(reference, round_number_to_find))[1].ended_at
                    <= reference_date
                ]

    # constructs the slug for the required datastore, eg lqas_29702. It follows the naming convention adopted in OpenHExa pipeline
    def get_datastores(self):
        category = self.request.GET.get("category", None)
        queryset = self.get_queryset()
        countries = [f"{category}_{org_unit.id}" for org_unit in list(queryset)]
        return JsonDataStore.objects.filter(slug__in=countries)
