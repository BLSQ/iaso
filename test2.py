#!/usr/bin/env python
import json
def trim_input(file):
    result = []
    for line in file:
        line=line.strip()
        line=line.replace('"','')
        line=line.replace(',','')
        result.append(line)
    result.remove('[')
    result.remove(']')
    return result

def generate_diff(keys,source_dict):
    diff = []
    for key in keys:
        if not key in source_dict:
            diff.append(key)
    return diff

detected_translations_file = open('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/en.json')
detected_translations = json.load(detected_translations_file)
detected_translations_file.close()
# print(detected_translations)

existing_translations_file = open('./hat/assets/js/apps/Iaso/domains/app/translations/en.json')
existing_translations = json.load(existing_translations_file)
existing_translations_file.close()


detected_file = open('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/detectedEnKeys.txt','r') 
detected_keys = trim_input(detected_file);
detected_file.close()
detected_keys.sort()

existing_keys_file = open('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/existingEnKeys.txt','r')
existing_keys = trim_input(existing_keys_file)
existing_keys_file.close()
existing_keys.sort()
# print(existing_keys)
unused_keys = generate_diff(existing_keys,detected_translations)
# print(unused_keys)
missing_keys = generate_diff(detected_keys,existing_translations)
print("MISSING KEYS:",missing_keys)

with open ('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/missingKeys.txt','w') as output_file:
    output_file.write("Missing keys: \n")
    for key in missing_keys:
        output_file.write(key+" \n")






# detectedFile=open('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/detectedEnKeys.txt')
# detectedList= detectedFile.readlines()
# detectedFile.close()
# print(detectedList)


# import csv

# with open('trad.csv','r') as csv_file:
#     reader=csv.reader(csv_file)
#     for row in reader:
#         print(row)

# print("Prout")