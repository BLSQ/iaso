from dict2xml import dict2xml
import uuid


def submission2xml(submission_dict, form_id, form_version_id, gen_uuid=False):
    root = "data"
    if gen_uuid:
        if "meta" not in submission_dict:
            submission_dict["meta"] = {}

        submission_dict["meta"]["instanceID"] = "uuid:" + str(uuid.uuid4())
    inner_xml = dict2xml(submission_dict).replace("\n", "").replace("  ", "")
    xml = f'<?xml version=\'1.0\' ?><{root} id="{form_id}" version="{form_version_id}" xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms">{inner_xml}</{root}>'

    return xml
