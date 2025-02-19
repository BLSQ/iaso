#!/usr/bin/env python
import json
import sys


def load_json(path_to_file):
    file = open(path_to_file)
    result = json.load(file)
    file.close()
    return result


def generate_diff(keys, source_dict):
    diff = []
    for key in keys:
        if key not in source_dict:
            diff.append(key)
    return diff


if len(sys.argv) < 4:
    sys.exit("scan-translation <original_file> <new_file> <lang_key>")

detected_translations = load_json(sys.argv[2])
detected_keys = sorted(detected_translations.keys())

existing_translations = load_json(sys.argv[1])
existing_keys = sorted(existing_translations.keys())

unused_keys = generate_diff(existing_keys, detected_translations)

missing_keys = generate_diff(detected_keys, existing_translations)

with open(
    "./hat/assets/js/apps/Iaso/domains/app/translations/extracted/missingKeys" + sys.argv[3] + ".txt", "w"
) as missing_keys_output_file:
    missing_keys_output_file.write("Missing keys: \n")
    for key in missing_keys:
        missing_keys_output_file.write(key + " \n")


with open(
    "./hat/assets/js/apps/Iaso/domains/app/translations/extracted/unusedKeys" + sys.argv[3] + ".txt", "w"
) as unused_keys_output_file:
    unused_keys_output_file.write("Unused keys " + sys.argv[3] + ": \n")
    for key in unused_keys:
        unused_keys_output_file.write(key + " \n")
