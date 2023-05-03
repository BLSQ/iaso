import logging
import uuid

logger = logging.getLogger(__name__)


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
            if "code" in de:
                code_or_name = de.get("code")
            elif "shortName" in de:
                code_or_name = de.get("shortName")
                missing_data_elements.append(de)
            else:
                code_or_name = de.get("name")
                missing_data_elements.append(de)

            psde["dataElement"]["code"] = code_or_name
            question_mappings[code_or_name] = psde["dataElement"]

    mapping = {"type": "simple_event", "program_id": program_id, "question_mappings": question_mappings}

    return (mapping, missing_data_elements)


def copy_mappings_from_previous_version(form_version, previous_form_version):
    for mapping_version in previous_form_version.mapping_versions.all():
        # clone the mapping_version and assign it the new version
        mapping_version.id = None
        mapping_version.name = uuid.uuid4()
        mapping_version.form_version = form_version

        # preserve all question mappings except the questions that don't exist in the newer version
        questions_by_name = form_version.questions_by_name()

        if "question_mappings" in mapping_version.json:
            filtered_question_mappings = {
                k: v for k, v in mapping_version.json["question_mappings"].items() if k in questions_by_name
            }

            mapping_version.json["question_mappings"] = filtered_question_mappings

        if "aggregations" in mapping_version.json:
            mapping_version.json["aggregations"] = [
                agg for agg in mapping_version.json["aggregations"] if agg["id"] in questions_by_name
            ]

        mapping_version.save()
        logger.debug("cloned " + str(mapping_version))
