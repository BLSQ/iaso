from typing import Union


def clean_url(dhis2_url: Union[str, None]) -> Union[str, None]:
    if not dhis2_url:
        return None
    cleaned_url = dhis2_url.replace("dhis-web-commons/security/login.action", "")
    cleaned_url = cleaned_url.strip("/")
    return cleaned_url
