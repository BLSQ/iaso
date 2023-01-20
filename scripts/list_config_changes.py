#!/usr/bin/env python
import sys
import re

print("script started")

file_regexp = re.compile("(?<!`)(?<=file:)*([\n])")
admin_regexp = re.compile("(?<!`)(?<=admin:)*([\n])")
print("defined regexes")
file_paths_list = re.findall(file_regexp, sys.argv[1])
admin_paths_list = re.findall(admin_regexp, sys.argv[1])
print("ran findall")

with open(sys.argv[2] + ".txt", "w") as output_file:
    print(sys.argv[2])
    # for index in range(len(file_paths_list)):
    #     print(file_paths_list[index])
    #     print(admin_paths_list[index])
    # output_file.write("file: " + file_paths_list[index] + "\n" + "admin: " + admin_paths_list[index] + "\n\n")
