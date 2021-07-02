from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Config
import requests


@login_required
def index(request):
    return render(request, "polio/base.html")


# sample Config:
"""
 configs = [
        {
            "keys": {"roundNumber": "roundNumber",
                    "District": "District",
                    "Region": "Region",
                    "Response": "Response",
                    "NumberofSiteVisited": "visited",
                    "Child_Checked": "children",
                    "Child_FMD": "fm",
                    "today": "today"},
            "prefix": "OHH",
            "url": 'https://brol.com/api/v1/data/5888',
            "login": "qmsdkljf",
            "password": "qmsdlfj"
        },
        {
            "keys": {'roundNumber': "roundNumber",
                    "District": "District",
                    "Region": "Region",
                    "Response": "Response",
                    "HH_count": "visited",
                    "Total_U5_Present": "children",
                    "TotalFM": "fm",
                    "today": "today"},
            "prefix": "HH",
            "url":  'https://brol.com/api/v1/data/5887',
            "login": "qmsldkjf",
            "password": "qsdfmlkj"
        }
    ]
"""
