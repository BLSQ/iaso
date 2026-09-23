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
/**
 * Whether the validation workflow is available to the current user, and why not
 * when it is unavailable. The detail rail uses this to label its collapsed row
 * without having to duplicate the gating rules.
 */
export const useValidationAvailability = ():
    | 'available'
    | 'moduleDisabled'
    | 'missingPermissions' => {
    const currentUser = useCurrentUser();
    if (!userHasAccessToModule(VALIDATION_WORKFLOW_MODULE, currentUser)) {
        return 'moduleDisabled';
    }
    if (
        !userHasAllPermissions(
            [VALIDATION_WORKFLOWS, SUBMISSIONS],
            currentUser,
        ) &&
        !currentUser.is_superuser
    ) {
        return 'missingPermissions';
    }
    return 'available';
};

/**
 * Body of the validation panel, without any surrounding paper, so it can be
 * dropped either in a WidgetPaper or in an accordion row of the detail rail.
 */
export const InstanceValidationContent = ({
    currentInstanceId,
}: InstanceValidationWidgetPaperProps) => {
    const { formatMessage } = useSafeIntl();
    const availability = useValidationAvailability();
    const { data: validationWorkflow, isLoading: isLoadingValidationStatus } =
        useGetSubmissionValidationStatus(currentInstanceId);

    if (availability === 'moduleDisabled') {
        return (
            <Alert severity="info">
                {formatMessage(MESSAGES.moduleDisabled)}
            </Alert>
        );
    }

    if (availability === 'missingPermissions') {
        return (
            <Alert severity="warning">
                {formatMessage(MESSAGES.missingPermissions, {
                    permissions: [
                        formatMessage(
                            PERMISSIONS_MESSAGES[VALIDATION_WORKFLOWS],
                        ),
                        formatMessage(PERMISSIONS_MESSAGES[SUBMISSIONS]),
                    ].join(', '),
                })}
            </Alert>
        );
    }

    return isLoadingValidationStatus ? (
        <LoadingSpinner absolute={false} fixed={false} padding={20} />
    ) : (
        <InstanceValidation
            instanceId={currentInstanceId}
            data={validationWorkflow}
        />
    );
};

export const InstanceValidationWidgetPaper = ({
    currentInstanceId,
}: InstanceValidationWidgetPaperProps) => {
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper title={formatMessage(MESSAGES.validation)} id="validation">
            <InstanceValidationContent currentInstanceId={currentInstanceId} />
        </WidgetPaper>
    );
};
