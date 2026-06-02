import React from 'react';
import { Alert } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { InstanceValidation } from 'Iaso/domains/instances/components/ValidationWorkflow/InstanceValidation';
import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import MESSAGES from 'Iaso/domains/instances/messages';
import PERMISSIONS_MESSAGES from 'Iaso/domains/users/permissionsMessages';
import {
    userHasAccessToModule,
    userHasAllPermissions,
} from 'Iaso/domains/users/utils';
import { VALIDATION_WORKFLOW_MODULE } from 'Iaso/utils/modules';
import { SUBMISSIONS, VALIDATION_WORKFLOWS } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';

type InstanceValidationWidgetPaperProps = {
    currentInstanceId: number;
};
export const InstanceValidationWidgetPaper = ({
    currentInstanceId,
}: InstanceValidationWidgetPaperProps) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { data: validationWorkflow, isLoading: isLoadingValidationStatus } =
        useGetSubmissionValidationStatus(currentInstanceId);

    if (!userHasAccessToModule(VALIDATION_WORKFLOW_MODULE, currentUser)) {
        return (
            <WidgetPaper
                title={formatMessage(MESSAGES.validation)}
                id="validation"
            >
                <Alert severity={'info'}>
                    {formatMessage(MESSAGES.moduleDisabled)}
                </Alert>
            </WidgetPaper>
        );
    }

    if (
        !userHasAllPermissions(
            [VALIDATION_WORKFLOWS, SUBMISSIONS],
            currentUser,
        ) &&
        !currentUser.is_superuser
    ) {
        return (
            <WidgetPaper
                title={formatMessage(MESSAGES.validation)}
                id="validation"
            >
                <Alert severity={'warning'}>
                    {formatMessage(MESSAGES.missingPermissions, {
                        permissions: [
                            formatMessage(
                                PERMISSIONS_MESSAGES[VALIDATION_WORKFLOWS],
                            ),
                            formatMessage(PERMISSIONS_MESSAGES[SUBMISSIONS]),
                        ].join(', '),
                    })}
                </Alert>
            </WidgetPaper>
        );
    }

    return (
        <WidgetPaper title={formatMessage(MESSAGES.validation)} id="validation">
            {isLoadingValidationStatus ? (
                <LoadingSpinner absolute={false} fixed={false} padding={20} />
            ) : (
                <InstanceValidation
                    instanceId={currentInstanceId}
                    data={validationWorkflow}
                />
            )}
        </WidgetPaper>
    );
};
