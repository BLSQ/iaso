#!/usr/bin/env bash
#

set -e -x

script_dir="$(cd "$(dirname "$0")"; pwd)"
source "${script_dir}/configrc"

echo "validating templates syntax"
aws cloudformation validate-template --template-body file://${script_dir}/cloudformation.json
aws cloudformation validate-template --template-body file://${script_dir}/cloudformation-env.json

args_1="${1}"

# if the script is executed without args create a new stack
if [ -z $args_1 ]; then
    if [ -z "${created_by}" ] || [ -z "${requested_by}" ]; then
        echo 'created_by and requested_by envs expected to be set in the env'
        exit 1
    fi
    cf_action='create-stack'
    # define array of parameters which can only be passed while creating stack
    create_parameters=(--tags)
    create_parameters+=(Key=StackName,Value="${stack_name}")
    create_parameters+=(Key=BILLING_PROJECT,Value="${billing_project}")
    create_parameters+=(Key=RequestedBy,Value="${requested_by}")
    create_parameters+=(Key=CreatedBy,Value="${created_by}" )

# if the script is executed with args == 'update' update an existing stack
elif [[ $args_1 == 'update' ]]; then
    cf_action='update-stack'
else
    echo 'not recognized parameter'
    exit 1
fi

aws s3 cp "cloudformation-env.json" "s3://${cf_s3_bucket}/${stack_name}-cloudformation-env.json"

echo "starting stack ${cf_action} operation"
aws cloudformation ${cf_action} \
    --stack-name "${stack_name}" \
    --template-body "file://${script_dir}/cloudformation.json" \
    --capabilities CAPABILITY_IAM \
    --parameters \
    ParameterKey=ProjectName,ParameterValue="${stack_name}" \
    ParameterKey=HostedZone,ParameterValue="${hosted_zone_name}" \
    ParameterKey=KeyName,ParameterValue="${ssh_key_name}" \
    ParameterKey=S3Bucket,ParameterValue="${cf_s3_bucket}" \
    ParameterKey=S3ZipFile,ParameterValue="${cf_s3_zip_file}" \
    ParameterKey=RenameResourcesLambda,ParameterValue="${rename_lambda}" \
    ParameterKey=SNSTopic,ParameterValue="${sns_topic}" \
    ParameterKey=SSLCertARN,ParameterValue="${ssl_cert}" \
    ParameterKey=ImageId,ParameterValue="${image_id}" \
    ${create_parameters[*]}
