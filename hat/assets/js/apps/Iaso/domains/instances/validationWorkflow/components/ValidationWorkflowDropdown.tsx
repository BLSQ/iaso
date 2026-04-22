import React from 'react';
import { InputWithInfos, useSafeIntl } from 'bluesquare-components';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';
import MESSAGES from 'Iaso/constants/messages';
import { useGetWorkflowOptions } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { userHasPermission } from 'Iaso/domains/users/utils';
import {
    hasFeatureFlag,
    SUBMISSION_VALIDATION_WORKFLOW,
} from 'Iaso/utils/featureFlags';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

type ValidationWorkflowDropdownProps = {} & Omit<
    InputComponentProps,
    'type' | 'options'
>;

export const ValidationWorkflowDropdown = ({
    ...props
}: ValidationWorkflowDropdownProps) => {
    const currentUser = useCurrentUser();
    const hasPermission = userHasPermission(VALIDATION_WORKFLOWS, currentUser);
    const userHasFeatureFlag = hasFeatureFlag(
        currentUser,
        SUBMISSION_VALIDATION_WORKFLOW,
    );

    const { data: workflowOptions, isFetching: isFetchingWorkflows } =
        useGetWorkflowOptions(hasPermission && userHasFeatureFlag);
    const { formatMessage } = useSafeIntl();
    const { loading, disabled, value, ...newProps } = props;

    const isLoading = loading || isFetchingWorkflows;
    const isDisabled = disabled || !hasPermission || !userHasFeatureFlag;

    const inputComponent = (
        <InputComponent
            dataTestId={'validation-workflow-dropdown-input'}
            type="select"
            options={workflowOptions || []}
            loading={isLoading}
            disabled={isDisabled}
            value={hasPermission && userHasFeatureFlag ? value : null}
            {...newProps}
        />
    );

    return hasPermission && userHasFeatureFlag ? (
        inputComponent
    ) : (
        <InputWithInfos
            infos={
                !userHasFeatureFlag
                    ? formatMessage(MESSAGES.featureDisabled)
                    : formatMessage(MESSAGES.missingPermissions, {
                          permissions: VALIDATION_WORKFLOWS,
                      })
            }
        >
            {inputComponent}
        </InputWithInfos>
    );
};
