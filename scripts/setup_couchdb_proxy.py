import os
import sys

file_path = sys.argv[1]
COUCHDB_URL = sys.argv[2]

f = open(file_path, "rt")

t = f.read()
f.close()

already_done = "_couchdb" in t

if not already_done and COUCHDB_URL:
    to_insert = """
ProxyPass "/_couchdb" "%s"
ProxyPassReverse "/_couchdb"  "%s"
WSGIScriptAlias"""
    to_insert = to_insert % (COUCHDB_URL, COUCHDB_URL)
    t = t.replace("WSGIScriptAlias", to_insert)

    f = open(file_path, "wt")
    f.write(t)
    f.close()
    print("Inserting proxypass done!")
else:
    print("Already done!")