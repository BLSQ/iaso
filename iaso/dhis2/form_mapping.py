import json


def seed_mapping(self, api, program_id):
    program = api.get(
        "programs/" + program_id,
        params={
            "fields": ":all,programStages[id,name,programStageDataElements[dataElement[id,code,name,valueType,optionSet[id,name,options[id,name,code]]]]]"
        },
    )
    question_mappings = {}
    for program_stage in program.json()["programStages"]:
        for psde in program_stage["programStageDataElements"]:
            question_mappings[psde["dataElement"]["code"]] = psde["dataElement"]

    mapping = {
        "type": "simple_event",
        "program_id": program_id,
        "question_mappings": question_mappings,
    }
    print(json.dumps(mapping, indent=4))
    return mapping
