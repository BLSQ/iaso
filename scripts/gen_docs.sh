#!/bin/bash

DOCS_DEST=./hat/dashboard/static/docs

# delete previous docs
rm -r $DOCS_DEST

# sphinx-build -b <builder>  -c <conf>         <docs_source>  <dest>
sphinx-build   -b html       -c ./docs/source  ./hat          $DOCS_DEST

# copy Lato fonts into "_static" folder
cp -r ./hat/assets/fonts $DOCS_DEST/_static/
