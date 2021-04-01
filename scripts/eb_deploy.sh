#! /usr/bin/env bash

# Stop on error and output every command before executing it
set -e

#eb_application_name="Trypelim"
#eb_platform="Python 3.6 running on 64bit Amazon Linux"
#eb_environment="Trypelim-dev"

command -v eb >/dev/null 2>&1  || {
    cat <<DESC
Error: Could not find `eb`!
You to need to install the aws eb cli
https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html
Locally, we'll assume you have your credentials setup with 'aws
configure', on Bitbucket an environment variable will be set with the
needed credentials.
Linux  pip3 install awscli --upgrade --user
Mac    pip3 install awscli --upgrade --user
DESC
  exit 1
}

echo "On Github, checking env variables"
[[ -z "${AWS_ACCESS_KEY_ID}" ]] && echo "  AWS_ACCESS_KEY_ID not found"
[[ -z "${AWS_SECRET_ACCESS_KEY}" ]] && echo "  AWS_SECRET_ACCESS_KEY not found"
[[ -z "${AWS_DEFAULT_REGION}" ]] && echo "  AWS_DEFAULT_REGION not found"

if [[ -z "${AWS_ACCESS_KEY_ID}" ]] || [[ -z "${AWS_SECRET_ACCESS_KEY}" ]] || [[ -z "${AWS_DEFAULT_REGION}" ]]; then
  exit 1;
fi

# probably not needed because we copied the config
#eb init "${eb_application_name}" --region "${AWS_DEFAULT_REGION}" --platform "${eb_platform}"

eb deploy "${EB_ENV_WEB}" && eb deplob "${EB_ENV_WORKER}"
