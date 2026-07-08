import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../messages';
import { InstanceValidationParams } from '../../types';
import { ApprovalForm } from './ApprovalForm';
import { StepInfo } from './StepInfo';

type Props = { formName: string };

export const ValidationPaper: FunctionComponent<Props> = ({ formName }) => {
    const params = useParamsObject(
        baseUrls.instanceValidation,
    ) as InstanceValidationParams;
    const { formatMessage } = useSafeIntl();
    const { data: currentWorkflow, isLoading: isLoadingWorkflow } =
        useGetSubmissionValidationStatus(parseInt(params.instanceId, 10));

    return (
        <WidgetPaper title={formatMessage(MESSAGES.validation)}>
            <StepInfo
                formName={formName}
                workflow={currentWorkflow}
                isLoading={isLoadingWorkflow}
            />
            <ApprovalForm
                workflow={currentWorkflow}
                isLoadingWorkflow={isLoadingWorkflow}
            />
        </WidgetPaper>
    );
};
