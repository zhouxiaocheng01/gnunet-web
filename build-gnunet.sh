#!/bin/sh -e

[ -e gnunet-build/scripts/build ] || git submodule update --init
mkdir -p assets/js
cd gnunet-build
export PATH="$PATH":"$(pwd)/scripts"
build -d
cp sysroot/var/lib/gnunet/hostlist ../assets/
cp sysroot/var/lib/gnunet/js/* ../assets/js/
mv ../assets/js/client-lib.js ../src/js/

# vim: set expandtab ts=2 sw=2:
