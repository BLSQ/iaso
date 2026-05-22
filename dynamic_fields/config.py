from appconf import AppConf


class DynamicFieldsAppConf(AppConf):
    QUERY_PARAM_NAME = "fields"
    DEFAULT_FIELDS_PARAM_VALUE = ":default"
    ALL_FIELDS_PARAM_VALUE = ":all"
    DEFAULT_FIELDS_META_PARAM = "default_fields"
    ALL_FIELDS_META_PARAM = "fields"

    class Meta:
        prefix = "DYNAMIC_FIELDS"
