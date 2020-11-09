#!/bin/bash

DOCS_BUILD=./docs/build
DOCS_DEST=./hat/dashboard/static/docs

# delete previous docs
rm -r $DOCS_BUILD
rm -r $DOCS_DEST

# sphinx-build -b <builder>  -c <conf>         <docs_source>  <dest>
sphinx-build   -b html       -c ./docs/source  ./hat          $DOCS_BUILD

# copy Lato fonts into "_static" folder
cp -r ./hat/assets/fonts $DOCS_BUILD/_static/

# copy docs to web folder
cp -r $DOCS_BUILD $DOCS_DEST
