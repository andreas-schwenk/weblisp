#!/bin/bash
# this script adds the unix timestap to the library (enforces browser to load the current revision of weblisp.min.js)
sed -i.bak "s/<script src=\"weblisp.min.js.*/<script src=\"weblisp.min.js?v=$(date +%s)\"><\/script>/g" index.html
rm index.html.bak
