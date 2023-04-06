#!python3
"""Update the translation json files

Run the npm formats command to extract the translation from the code
Add them to the traduction file if not present.
Add a CHECKME on the new added traduction so they can be found easily
Count the number of CHECKME and missing trad so we can check the translation is complete.

To use:
 - run it
 - search for CHECKME in your editor. Check these string, remove the CHECKME
 - re run it. If it's say it's ok that's good.
 - commit
 - success

TODO: Remove old trad?
TODO: Add the check in CI
"""

import json
import sys
from collections import OrderedDict, defaultdict
import os


def extract_translations(path, trad_dir):
    print(f"Extracting translations for {path}...")
    extracted_name = "extracted_translation.json"
    extracted_path = trad_dir + extracted_name

    extract_cmd = (
        f"./node_modules/.bin/formatjs extract --out-file '{extracted_path}' '{path}**/*.{{js,tsx,ts}}' --format=simple"
    )
    os.system(extract_cmd)

    extracted = json.load(open(extracted_path, encoding="utf8"))
    print(f"Translations extracted {len(extracted)}")
    return extracted


# command to manually extracd trad
# ./node_modules/.bin/formatjs extract --out-file 'extracted.json' './hat/assets/js/apps/Iaso/**/*.[js]sx?' --format=simple


# expect the "main" dir to be before the plugin
paths = [
    {
        "source_files": "./hat/assets/js/apps/Iaso/",
        "translations_dir": "hat/assets/js/apps/Iaso/domains/app/translations/",
    },
    {"source_files": "./plugins/polio/js/", "translations_dir": "plugins/polio/js/src/constants/translations/"},
]
if __name__ == "__main__":
    if os.getcwd().endswith("scripts"):  # we are in the script directory, go up a level
        os.chdir("..")

    missing_translations = 0

    # keep trace of what we set in previous traduction file. so we can detect properly
    # if a plugin reuse a translation from the main file
    previous_trad = defaultdict(dict)
    for path in paths:
        trad_dir = path["translations_dir"]
        extracted = extract_translations(path["source_files"], trad_dir)

        added_trad = 0
        for lang in ["en", "fr"]:
            original_name = trad_dir + lang + ".json"
            original = json.load(open(original_name, encoding="utf8"))
            previous_trad_for_lang = previous_trad[lang]

            for new_key, value in extracted.items():
                if (
                    new_key not in original.keys()
                    and not new_key.startswith("blsq")
                    and new_key not in previous_trad_for_lang
                ):
                    added_trad += 1
                    missing_translations += 1
                    # ADD CHECKME so we can see the new strings easily
                    original[new_key] = value + " CHECKME"
                elif "CHECKME" in original.get(new_key, ""):
                    missing_translations += 1

            print(f"Translations added: {added_trad} for {lang}")
            previous_trad_for_lang.update(original)
            # somehow try to replicate VSCODE bizarre keys ordering
            sorted_dict = OrderedDict(sorted(original.items(), key=lambda x: x[0].lower().replace("_", "!")))
            with (open(original_name, "w+", encoding="utf8")) as file_write:
                # ensure_ascii is necessary othewhise it didn't properly encode unicode, not sure why.
                json.dump(sorted_dict, fp=file_write, indent=4, ensure_ascii=False)
    if missing_translations:
        print("Please translate the translation containing CHECKME and remove it.")
        sys.exit(f"Translations to check : {missing_translations}")
    else:
        print("All translations are up to date")
