# make field name less "django" by replacing __ with _ for ex
def normalize_field_name(field_name):
    return field_name.replace("__", "_")
