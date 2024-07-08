# Defining shell is necessary in order to modify PATH
SHELL := sh
# Allow running binaries from node_modules without specifying the full path
export PATH := node_modules/.bin/:$(PATH)

PROJECT := $(notdir $(CURDIR))
# On CI servers, use the `npm ci` installer to avoid introducing changes to the package-lock.json
# On developer machines, prefer the generally more flexible `npm install`. 💪
NPM_I_CMD := $(if $(CI), ci, install)
# A list of all TypeScript files in the project. This is used in Make to decide if recompilation is needed.
FILELIST_TS = $(shell make/findfiles.sh ts)

# Default task: this is executed when running `make` without arguments
all: compile

# DEPENDENCY TRACKING

# The purpose of this section is help Make understand when to re-run a target and when it's not needed. Make uses file
# timestamps to determine if targets are up to date. By providing a list of files that a target depends on, Make can
# evaluate all inputs and compare them with the expected output and either re-run or skip the target.

.cache:
	mkdir .cache

node_modules: package-lock.json package.json
	npm $(NPM_I_CMD) && touch $@

package-lock.json: package.json

.cache/tsconfig.tsbuildinfo: .cache node_modules tsconfig.json $(FILELIST_TS)
	tsc && touch $@


# TASK DEFINITIONS

install: node_modules

compile: .cache/tsconfig.tsbuildinfo
compile/watch: force install
	tsc --watch

lint: force install
	eslint --cache --cache-location .cache/ .

test: force compile
	vitest

clean: force
	rm -rf .cache
	git clean -Xf src

.PHONY: force

# Put developer-specific configuration or targets in this file
-include local.mk
