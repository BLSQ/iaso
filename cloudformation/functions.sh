#!/usr/bin/env bash

function _error {
    echo "${*}"
    exit 1
}

function parse_args {
    if [ -z "${1}" ]; then
        export cf_action='create-stack'
    elif [[ "${1}" == 'update' ]]; then
        export cf_action='update-stack'
    else
        _error 'not recognized parameter'
    fi
}

function validate_template {
    local template_file="${1}"
    echo "validating ${template_file} syntax"
    aws cloudformation validate-template --template-body "file://${template_file}"
}
