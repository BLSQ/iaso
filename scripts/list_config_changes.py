#!/usr/bin/env python
import sys
import re

print("hello world", sys.argv[1], sys.argv[2])

file_regexp = re.compile("(?<!`file:)(?<=file:).+(?=\n)")
admin_regexp = re.compile("(?<!`admin:)(?<=admin:).+(?=\n)")
file_paths_list = re.findall(file_regexp, sys.argv[1])
admin_paths_list = re.findall(admin_regexp, sys.argv[1])

# test code
if len(file_paths_list) == 0:
    file_paths_list = ["test file path"]
if len(admin_paths_list) == 0:
    file_paths_list = ["test admin path"]

# end test code

if len(file_paths_list) > 0 and len(admin_paths_list) > 0:
    print("file detected")
    with open(sys.argv[2] + ".txt", "w") as output_file:
        print("saving changes")
        for index in range(len(file_paths_list)):
            print(file_paths_list[index])
            print(admin_paths_list[index])
            output_file.write("file: " + file_paths_list[index] + "\n" + "admin: " + admin_paths_list[index] + "\n\n")
