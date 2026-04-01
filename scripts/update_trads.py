#!python3
"""Update the translation json files for React

What it does:
    Run the npm formats command to extract the translations from the code
    Add them to the traduction file if not present.
    Add a CHECKME on the newly added traduction so they can be found easily
    Count the number of CHECKME and missing trad so we can check the translation is complete.

How to use it:
 - run it
 - search for CHECKME in your editor. Check these string, translate them, remove the CHECKME
 - re run it. If it's say it's ok that's good.
 - commit
 - success

This does not handle the django translations. see instructions in main README

TODO: Remove old trad?
"""

import json
import os
import sys
import typing

from collections import OrderedDict, defaultdict


def extract_translations(path, trad_dir):
    print(f"Extracting translations for {path}...")
    extracted_path = trad_dir + "extracted_translation.json"
    os.system(
        f"./node_modules/.bin/formatjs extract --out-file '{extracted_path}' '{path}**/*.{{js,tsx,ts}}' --format=simple"
    )
    extracted = json.load(open(extracted_path, encoding="utf8"))
    print(f"Translations extracted: {len(extracted)}")
    return extracted


def process_translations(path, previous_trad, missing_translations, missing_translations_keys):
    trad_dir = path["translations_dir"]
    extracted = extract_translations(path["source_files"], trad_dir)

    for lang in ["en", "fr"]:
        added_trad = 0
        original_name = trad_dir + lang + ".json"
        original = json.load(open(original_name, encoding="utf8"))
        previous_trad_for_lang = previous_trad[lang]

        for new_key, value in extracted.items():
            if new_key.startswith("blsq") or new_key in previous_trad_for_lang:
                continue
            if new_key not in original:
                added_trad += 1
                missing_translations += 1
                original[new_key] = value + " CHECKME"
                missing_translations_keys.append(new_key)
            elif "CHECKME" in original.get(new_key, ""):
                missing_translations += 1

        print(f"Translations added: {added_trad} for {lang}")
        previous_trad_for_lang.update(original)

        sorted_dict = OrderedDict(sorted(original.items(), key=lambda x: x[0].lower().replace("_", "!")))
        with open(original_name, "w+", encoding="utf8") as f:
            json.dump(sorted_dict, fp=f, indent=4, ensure_ascii=False)

    return missing_translations


paths = [
    {
        "source_files": "./hat/assets/js/apps/Iaso/",
        "translations_dir": "hat/assets/js/apps/Iaso/domains/app/translations/",
    },
    {
        "source_files": "./plugins/polio/js/",
        "translations_dir": "plugins/polio/js/src/constants/translations/",
    },
]

if __name__ == "__main__":
    if os.getcwd().endswith("scripts"):
        os.chdir("..")

    missing_translations = 0
    missing_translations_keys = []
    previous_trad: typing.DefaultDict[str, typing.Dict[str, str]]
    previous_trad = defaultdict(dict)
    for path in paths:
        missing_translations = process_translations(
            path, previous_trad, missing_translations, missing_translations_keys
        )

    if missing_translations:
        print("Please translate the translation containing CHECKME and remove it.")
        for key in missing_translations_keys:
            print(key)
        sys.exit(f"Translations to check : {missing_translations}")
    else:
        print("All translations are up to date")
