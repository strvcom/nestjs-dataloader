#!/bin/sh
# This script is used to find all files with the given extension in the repository, excluding node_modules and hidden
# files.
# It is used in Makefile to build a list of target dependencies.

EXT=$1

find . \
  -name "*.${EXT}" \
  -not -path '*/.*' \
  -not -path './node_modules/*'
