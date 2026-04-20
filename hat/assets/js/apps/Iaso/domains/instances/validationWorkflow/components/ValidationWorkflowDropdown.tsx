import React from 'react';
import { InputWithInfos, useSafeIntl } from 'bluesquare-components';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';
import MESSAGES from 'Iaso/constants/messages';
import { useGetWorkflowOptions } from 'Iaso/domains/instances/validationWorkflow/api/Get';
import { userHasPermission } from 'Iaso/domains/users/utils';
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

    const { data: workflowOptions, isFetching: isFetchingWorkflows } =
        useGetWorkflowOptions(hasPermission);
    const { formatMessage } = useSafeIntl();
    const { loading, disabled, value, ...newProps } = props;

    const isLoading = loading || isFetchingWorkflows;
    const isDisabled = disabled || !hasPermission;

    const inputComponent = (
        <InputComponent
            dataTestId={'validation-workflow-dropdown-input'}
            type="select"
            options={workflowOptions || []}
            loading={isLoading}
            disabled={isDisabled}
            value={hasPermission ? value : null}
            {...newProps}
        />
    );

    return hasPermission ? (
        inputComponent
    ) : (
        <InputWithInfos
            infos={formatMessage(MESSAGES.missingPermissions, {
                permissions: VALIDATION_WORKFLOWS,
            })}
        >
            {inputComponent}
        </InputWithInfos>
    );
};
