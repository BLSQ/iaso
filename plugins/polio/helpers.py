import json
from datetime import timedelta

import requests
from django.utils.timezone import now

from plugins.polio.models import URLCache


def get_url_content(url, login, password, minutes=60):
    """Get an URL and save the result in prod"""
    cached_response, created = URLCache.objects.get_or_create(url=url)
    delta = now() - cached_response.updated_at
    if created or delta > timedelta(minutes=minutes) or not cached_response.content:
        response = requests.get(url, auth=(login, password))
        response.raise_for_status()
        cached_response.content = response.text
        cached_response.save()
        j = response.json()
    else:
        j = json.loads(cached_response.content)
    return j
