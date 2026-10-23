def clean_url(dhis2_url: str | None) -> str | None:
    if not dhis2_url:
        return ""
    cleaned_url = dhis2_url.replace("dhis-web-commons/security/login.action", "")
    cleaned_url = cleaned_url.strip("/")
    return cleaned_url
