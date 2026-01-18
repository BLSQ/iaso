from django.contrib.auth.models import User


def get_account_name_based_on_user(user: User):
    account_name = "unknown_account"  # some uploads can be anonymous

    iaso_profile = getattr(user, "iaso_profile", None)
    if iaso_profile:
        account = iaso_profile.account
        account_name = f"{account.short_sanitized_name}_{account.id}"

    return account_name
