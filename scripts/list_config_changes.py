#!/usr/bin/env python
import sys
import re

file_regexp = r"\(?<!`)(?<=file:)*([\n|\r\n|\r])"
admin_regexp = r"\(?<!`)(?<=admin:)*([\n|\r\n|\r])"

file_paths_list = re.findall(file_regexp,sys.argv[1])
admin_paths_list = re.findall(admin_regexp,sys.argv[1])

with open(sys.argv[2]+'.txt', "w") as output_file:
    for index in range (len(file_paths_list)):
        output_file.write("file: "+file_paths_list[index]+"\n"+"admin: "+admin_paths_list[index]+"\n\n")