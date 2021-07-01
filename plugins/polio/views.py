from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Config
import requests


@login_required
def index(request):
    return render(request, "polio/base.html")


@login_required
def lqas(request, slug):
    """
    Endpoint used to transform lqas data from existing ODK forms stored in ONA. Very custom to the polio project.
    """
    config = get_object_or_404(Config, slug=slug)
    res = []
    failure_count = 0
    for config in config.content:
        keys = config["keys"]
        prefix = config["prefix"]
        response = requests.get(config["url"], auth=(config["login"], config["password"]))
        forms = response.json()

        for form in forms:
            try:
                reduced_form = {}
                for key in keys.keys():
                    value = form.get(key, None)
                    if value is None:
                        value = form[prefix][0]["%s/%s" % (prefix, key)]
                    reduced_form[keys[key]] = value
                    reduced_form["type"] = prefix

                res.append(reduced_form)
            except Exception as e:
                print("failed on ", e, form, prefix)
                failure_count += 1
    print("parsed:", len(res), "failed:", failure_count)

    return JsonResponse(res, safe=False)


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
