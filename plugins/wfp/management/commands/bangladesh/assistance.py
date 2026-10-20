from plugins.wfp.common import _first_of


RATION_QUANTITY_FIELDS = ("ration_quantity", "_lns_packets", "_wsbp_packets", "_rusf_packets", "manual_quantity")
ASSISTANCE_QUANTITY_FIELDS = ("_cash_total", "_cash_amount", "cash_amount")


def extract_bangladesh_assistance(data):
    """Extract the Bangladesh assistance step items.

    A beneficiary can receive a ration, another assistance (e.g. cash), or both
    during a given assistance step.
    """
    items = []

    ration_given = _first_of(data, "ration_given")
    if ration_given:
        quantity = _first_of(data, *RATION_QUANTITY_FIELDS)
        items.append({"type": ration_given, "quantity": quantity or 0})

    assistance_given = _first_of(data, "assistance_given")
    if assistance_given:
        # ``ration_quantity`` belongs to the ration when one is given in the same step.
        quantity_fields = (
            ASSISTANCE_QUANTITY_FIELDS if ration_given else (*ASSISTANCE_QUANTITY_FIELDS, "ration_quantity")
        )
        quantity = _first_of(data, *quantity_fields)
        items.append({"type": assistance_given, "quantity": quantity or 0})

    return items
