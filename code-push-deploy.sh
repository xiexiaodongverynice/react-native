#!/usr/bin/env bash

ready="no"
app="crm-ios"
platform="ios"
environment="Dev"
version="v1.1.6"
description=""
isEnvOk="yes"
ensure="no"

read -p "Are you ready to release hot-updating ? please input yes or no: (${ready}) " readyInput
if [[ $readyInput != "" ]]; then
    ready=$readyInput
fi
## what's difference between [] and [[]] ?
if [[ $ready != "yes" ]]; then
    echo "emmmm, you are not ready, break the work flow !!!"
    exit 0
fi

read -p "Which app ? one of [crm-ios, crm-android, jmkx-android, jmkx-ios]: (${app}) " appInput
if [[ $appInput != "" ]]; then
    app=$appInput
fi
echo "app: ${app}"

read -p "Which platform ? one of [ios, android]: (${platform}): " platformInput
if [[ $platformInput != "" ]]; then
    platform=$platformInput
fi
echo "platform: ${platform}"

read -p "Which environment ? one of [Production, Staging, Dev]: (${environment}) " environmentInput
if [[ $environmentInput != "" ]]; then
    environment=$environmentInput
fi
if [[ $environment == "Production" ]]; then
    echo "notice, you are deploying on production environment !!! "
    read -p "Do you wanna continue ? yes or no: (${isEnvOk})" isEnvOk
    if [[ $isEnvOk != "yes" ]]; then
        exit 0
    fi
fi
echo "environment: ${environment}"

read -p "What's version ? : (${version}) " versionInput
if [[ $versionInput != "" ]]; then
    version=$versionInput
fi
echo "version: ${version}"

description_suffix=$(date "+%Y%m%d-%H%M")
description="${version}-${description_suffix}"
read -p "Please input description if necessary? : (${description}) " descInput
if [[ $descInput != "" ]]; then
    description=$descInput
fi
echo "description: ${description}"

echo "Will run following: code-push release-react ${app} ${platform} -d ${environment} --des ${description}"
read -p "Please ensure the command is right, yes or no: (${ensure}) " ensureInput
if [[ $ensureInput != "" ]]; then
    ensure=$ensureInput
fi
if [[ $ensure == "yes" ]]; then
    echo "start deploying ..."
    code-push release-react ${app} ${platform} -d ${environment} --des ${description}
fi