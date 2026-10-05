import React from 'react';
import { useApiValidationWorkflowsDropdownList } from 'Iaso/api/validationWorkflows';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';
import {
    useCurrentUserHasAccessToModule,
    useCurrentUserHasPermission,
} from 'Iaso/domains/users/utils';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
import { VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';

type ValidationWorkflowDropdownProps = Omit<
    InputComponentProps,
    'type' | 'options'
>;

export const ValidationWorkflowDropdown = ({
    ...props
}: ValidationWorkflowDropdownProps) => {
    const hasPermission = useCurrentUserHasPermission(VALIDATION_WORKFLOWS);
    const userHasModule = useCurrentUserHasAccessToModule(
        VALIDATION_WORKFLOW_MODULE,
    );

    const { data: workflowOptions, isFetching: isFetchingWorkflows } =
        useApiValidationWorkflowsDropdownList(undefined, {
            query: { enabled: hasPermission && userHasModule },
        });
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
