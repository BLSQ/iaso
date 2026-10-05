import React from 'react';
import { useApiValidationWorkflowsDropdownList } from 'Iaso/api/validationWorkflows';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';
import { userHasAccessToModule } from 'Iaso/domains/users/utils';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

type ValidationWorkflowDropdownProps = Omit<
    InputComponentProps,
    'type' | 'options'
>;

export const ValidationWorkflowDropdown = ({
    ...props
}: ValidationWorkflowDropdownProps) => {
    const currentUser = useCurrentUser();
    const userHasModule = userHasAccessToModule(
        VALIDATION_WORKFLOW_MODULE,
        currentUser,
    );

    const { data: workflowOptions, isFetching: isFetchingWorkflows } =
        useApiValidationWorkflowsDropdownList(undefined, {
            query: { enabled: userHasModule },
        });
    const { loading, disabled, ...newProps } = props;

    const isLoading = loading || isFetchingWorkflows;
    const isDisabled = disabled || !userHasModule;

    return userHasModule ? (
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
