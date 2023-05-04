#!/usr/bin/env python
import argparse
import sys
import subprocess
import json

# Fetch the data from iaso's /api/datastore/ endpoint and copy it to a local DB
# By default it will fetch from staging.poliooutbreaks.com but you can change the source by passing the -s arg
# It will write to localhost:8081 but you can change the destination by passing the -t arg
# You can also save the json in a file by passing the -- f arg with the file name and the -d arg for the destination directpry. if no value is passed to -d, it will save in the current dir
# If you don't want to save on a local Db but want to save the json file,  just don't pass the -lu and -lpwd args


parser = argparse.ArgumentParser(description="Provide credentials to fetch datastore")

parser.add_argument("-u", "--user", help="User name")  # User name for the source url
parser.add_argument("-p", "--pwd", help="Password")
parser.add_argument("-lu", "--localuser", help="Local User name")  # User name for the destination/local url
parser.add_argument("-lp", "--localpwd", help="Local Password")
parser.add_argument("-f", "--file", type=str, help="Output to file")
parser.add_argument("-d", "--dir", type=str, help="Destination directory for file (with end backslash)")
parser.add_argument("-s", "--source", help="Source URL (with end backslash)")
parser.add_argument("-t", "--to", help="Destination URL (with end backslash)")

args = parser.parse_args()
auth_data = {"username": args.user, "password": args.pwd}
local_auth_data = {"username": args.localuser, "password": args.localpwd}

source = args.source if args.source else "https://staging.poliooutbreaks.com/"
# Get access token
auth_response = subprocess.check_output(
    [
        "curl",
        "-I",
        "-H",
        "Content-Type: application/json",
        f"{source}login/",
    ]
)
auth_response = auth_response.decode("UTF-8") # type: ignore
token = auth_response.split("csrftoken=")[1].split(";")[0] # type: ignore

# Get all data from datastore endpoint
curl_output = subprocess.check_output(
    [
        "curl",
        "-s",
        "-X",
        "GET",
        "-H",
        f"Authorisation: Bearer {token}", # type: ignore
        "-H",
        f"Content-Type: application/json",
        "-u",
        f"{args.user}:{args.pwd}",
        f"{source}api/datastore/?format=json",
    ],
    stderr=subprocess.STDOUT,
)

# Parse the results
response = json.loads(curl_output.decode("UTF-8"))["results"]

if args.file:
    print(f"writing to file {args.file}.json")
    destination = args.dir if args.dir else "./"
    with open(f"{destination}{args.file}.json", "w") as file_to_save:
        file_to_save.write(json.dumps(response))


if args.localuser and args.localpwd:
    to = args.to if args.to else "http://localhost:8081/"
    # Login into the local DB
    local_auth_response = subprocess.check_output(
        [
            "curl",
            "-I",
            "-H",
            "Content-Type: application/json",
            f"{to}login/",
        ]
    )
    local_auth_response = local_auth_response.decode("UTF-8") # type: ignore
    local_token = local_auth_response.split("csrftoken=")[1].split(";")[0] # type: ignore

    not_created = []
    created = []

    # Make a post request for each of the json entries
    for store in response:
        data = {"key": store["key"], "data": store["data"]}
        key = store["key"]
        command = [
            "curl",
            "-s",
            "-X",
            "POST",
            "-H",
            f"Authorisation: Bearer {local_token}", # type: ignore
            "-H",
            "Content-Type: application/json",
            "-u",
            f"{args.localuser}:{args.localpwd}",
            "-d",
            json.dumps(data),
            "-w",  # This can probaly be deleted
            "%{http_code}",  # This as well
            f"{to}api/datastore/",
        ]
        post_output = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if post_output.returncode != 0:
            print("COULD NOT CREATE", key)
            not_created.append(key)
        else:
            created.append(key)
            print("CREATED", key)

    print(f"TOTAL CREATED: {len(created)} data store entries: {created}")
    print(f"TOTAL NOT CREATED  {len(not_created)} data store entries: {not_created}")

sys.exit()
