import datetime
from rest_framework.filters import OrderingFilter
from rest_framework.request import Request


def sort_results(request: Request, results: list[dict]) -> list[dict]:
    order = request.query_params.get(OrderingFilter.ordering_param)
    reverse = False

    if order and order.startswith("-"):
        reverse = True
        order = order.removeprefix("-")

    valid_order_keys_and_defaults = {
        "date": datetime.datetime.min,
        "action": "",
        "vials_in": 0,
        "vials_out": 0,
        "doses_in": 0,
        "doses_out": 0,
    }

    if order not in valid_order_keys_and_defaults.keys():
        return sorted(results, key=lambda d: d["date"])

    return sorted(results, key=lambda d: d[order] or valid_order_keys_and_defaults[order], reverse=reverse)
