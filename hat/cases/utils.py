import re


def create_list_from_restrict_to_zs(restrict_to_zs):
    restrict_to_zs = re.sub(r'[ ]{2,}', r' ', restrict_to_zs)
    if restrict_to_zs.find(", "):
        restrict_to_zs = restrict_to_zs.replace(", ", ",")
    return restrict_to_zs.split(',')
