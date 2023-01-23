#!/usr/bin/env python
import sys
import re

print("hello world", sys.argv[1], sys.argv[2])

file_regexp = re.compile("(?<!`file:)(?<=file:).+(?=\n)")
admin_regexp = re.compile("(?<!`admin:)(?<=admin:).+(?=\n)")
file_paths_list = re.findall(file_regexp, sys.argv[1])
admin_paths_list = re.findall(admin_regexp, sys.argv[1])
title = sys.argv[2]

# test code
if not title:
    title = "title"
if len(file_paths_list) == 0:
    file_paths_list = ["test file path"]
if len(admin_paths_list) == 0:
    admin_paths_list = ["test admin path"]
print(file_paths_list, admin_paths_list)
print(len(file_paths_list), len(admin_paths_list))
# end test code


with open("updated_configs.txt", "w") as output_file:
    print("saving changes")
    output_file.write(title)
    for index in range(len(file_paths_list)):
        print(file_paths_list[index])
        print(admin_paths_list[index])
        if file_paths_list[index] and admin_paths_list[index]:
            output_file.write("file: " + file_paths_list[index] + "\n" + "admin: " + admin_paths_list[index] + "\n\n")
