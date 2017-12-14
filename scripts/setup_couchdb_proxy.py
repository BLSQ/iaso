import os
import sys

COUCHDB_URL = os.environ.get('COUCHDB_URL', '')

file_path = sys.argv[1]

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
else:
    print("Already done!")