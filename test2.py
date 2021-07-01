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

def load_json(path_to_file):
    file=open(path_to_file)
    result=json.load(file)
    file.close()
    return result

def make_keys_array_from_txt_file(path_to_file):
    file = open(path_to_file,'r')
    result = trim_input(file);
    file.close()
    return result
    

detected_translations = load_json('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/en.json')

detected_keys = make_keys_array_from_txt_file('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/detectedEnKeys.txt') 

existing_translations = load_json('./hat/assets/js/apps/Iaso/domains/app/translations/en.json')

existing_keys = make_keys_array_from_txt_file('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/existingEnKeys.txt')

unused_keys = generate_diff(existing_keys,detected_translations)

missing_keys = generate_diff(detected_keys,existing_translations)

with open('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/missingKeys.txt','w') as missing_keys_output_file:
    missing_keys_output_file.write("Missing keys: \n")
    for key in missing_keys:
        missing_keys_output_file.write(key+" \n")


with open('./hat/assets/js/apps/Iaso/domains/app/translations/extracted/unusedKeys.txt','w') as unused_keys_output_file:
    unused_keys_output_file.write("Unused keys: \n")
    for key in unused_keys:
        unused_keys_output_file.write(key+" \n")



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