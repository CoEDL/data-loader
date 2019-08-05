#!/bin/bash

read -p 'Please enter an appropriate GitHub personal access token so that the release can be pushed. > ' token

if [ -z $token ] ; then
    echo "A token was not provided. Exiting."
    exit -1
fi

read -p 'Should I bump the minor version number? [y/N] ' resp
if [ "$resp" == 'y' ] ; then
    npm version minor
fi

export GH_TOKEN="${token}"
npm run build:mac

PACKAGE_VERSION=$(awk '/version/{gsub(/("|",)/,"",$2);print $2};' package.json)
git tag -a "v${PACKAGE_VERSION}" -e
  
npm run publish

cat <<EOF

    You can now go to https://github.com/marcolarosa/pdsc-librarybox-installer/releases
    to verify the draft and release it.

EOF