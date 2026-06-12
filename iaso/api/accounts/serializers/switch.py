from rest_framework import serializers

from iaso.models import Account


class AccountSwitchSerializer(serializers.Serializer):
    account_id = serializers.PrimaryKeyRelatedField(queryset=Account.objects.none(), write_only=True, required=True)

    def __init__(self, *args, **kwargs):
        account_id_qs = kwargs.pop("account_id_qs", None)
        super(AccountSwitchSerializer, self).__init__(*args, **kwargs)
        if getattr(self.context.get("request", None), "user", None):
            self.fields["account_id"].queryset = (
                account_id_qs if account_id_qs else Account.objects.filter_for_user(self.context["request"].user)
            )
