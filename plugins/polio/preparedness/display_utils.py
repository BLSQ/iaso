"""Human-readable labels for polio admin and model ``__str__`` (legacy null FKs)."""

MISSING_CAMPAIGN_LABEL = "—"


def format_round_campaign_obr_name(round_obj, *, empty=MISSING_CAMPAIGN_LABEL):
    """OBR name for labels; rounds may exist without a linked campaign (legacy data)."""
    if round_obj is None or not round_obj.campaign_id:
        return empty
    campaign = round_obj.campaign
    if campaign is None:
        return empty
    return campaign.obr_name


def format_campaign_obr_name(campaign=None, *, non_obr_name="", empty=MISSING_CAMPAIGN_LABEL):
    """Campaign OBR or alternative name (Form A may use non_obr_name when campaign is unset)."""
    if campaign is not None:
        return campaign.obr_name
    if non_obr_name:
        return non_obr_name
    return empty


def format_campaign_country(campaign, *, empty=MISSING_CAMPAIGN_LABEL):
    if campaign is None or not campaign.country_id:
        return empty
    country = campaign.country
    if country is None:
        return empty
    return country.name


def format_vaccine_stock_country(vaccine_stock, *, empty=MISSING_CAMPAIGN_LABEL):
    if vaccine_stock is None or not vaccine_stock.country_id:
        return empty
    country = vaccine_stock.country
    if country is None:
        return empty
    return country.name


def format_vaccine_stock_vaccine(vaccine_stock, *, empty=MISSING_CAMPAIGN_LABEL):
    if vaccine_stock is None:
        return empty
    return vaccine_stock.vaccine
