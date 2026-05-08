import React from 'react';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { InstanceValidation } from 'Iaso/domains/instances/components/ValidationWorkflow/InstanceValidation';
import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import MESSAGES from 'Iaso/domains/instances/messages';

type InstanceValidationWidgetPaperProps = {
    currentInstanceId: number;
};
export const InstanceValidationWidgetPaper = ({
    currentInstanceId,
}: InstanceValidationWidgetPaperProps) => {
    const { formatMessage } = useSafeIntl();
    const { data: validationWorkflow, isLoading: isLoadingValidationStatus } =
        useGetSubmissionValidationStatus(currentInstanceId);

    return (
        <WidgetPaper title={formatMessage(MESSAGES.validation)} id="validation">
            {isLoadingValidationStatus ? (
                <LoadingSpinner absolute={false} />
            ) : (
                <InstanceValidation
                    instanceId={currentInstanceId}
                    data={validationWorkflow}
                />
            )}
        </WidgetPaper>
    );
};
