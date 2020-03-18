import json


def seed_event_mapping(api, program_id):
    program = api.get(
        "programs/" + program_id,
        params={
            "fields": ":all,programStages[id,name,programStageDataElements[dataElement[id,code,name,shortName,valueType,optionSet[id,name,options[id,name,code]]]]]"
        },
    )
    question_mappings = {}
    missing_data_elements = []
    for program_stage in program.json()["programStages"]:
        for psde in program_stage["programStageDataElements"]:
            de = psde["dataElement"]
            code_or_name = None
            if "code" in de:
                code_or_name = de.get("code")
            elif "shortName":
                code_or_name = de.get("shortName")
                missing_data_elements.append(de)
            else:
                code_or_name = de.get("name")
                missing_data_elements.append(de)

            psde["dataElement"]["code"] = code_or_name
            question_mappings[code_or_name] = psde["dataElement"]

    mapping = {
        "type": "simple_event",
        "program_id": program_id,
        "question_mappings": question_mappings,
    }

    return (mapping, missing_data_elements)
