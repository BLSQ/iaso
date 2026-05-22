import React from 'react';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';
import {
    userHasAccessToModule,
    userHasPermission,
} from 'Iaso/domains/users/utils';
import { useGetWorkflowOptions } from 'Iaso/domains/validationWorkflowsConfiguration/api/Get';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
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
    const userHasModule = userHasAccessToModule(
        VALIDATION_WORKFLOW_MODULE,
        currentUser,
    );

    const { data: workflowOptions, isFetching: isFetchingWorkflows } =
        useGetWorkflowOptions(hasPermission && userHasModule);
    const { loading, disabled, ...newProps } = props;

    const isLoading = loading || isFetchingWorkflows;
    const isDisabled = disabled || !hasPermission || !userHasModule;

    return hasPermission && userHasModule ? (
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
