import React from 'react';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';
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
    const { loading, disabled, ...newProps } = props;

    const isLoading = loading || isFetchingWorkflows;
    const isDisabled = disabled || !hasPermission || !userHasFeatureFlag;

    return hasPermission && userHasFeatureFlag ? (
        <InputComponent
            dataTestId={'validation-workflow-dropdown-input'}
            type="select"
            options={workflowOptions || []}
            loading={isLoading}
            disabled={isDisabled}
            {...newProps}
        />
    ) : null;
};
