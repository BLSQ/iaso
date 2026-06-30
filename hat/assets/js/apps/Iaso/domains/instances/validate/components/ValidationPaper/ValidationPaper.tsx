import React, { FunctionComponent } from 'react';
import { UrlParams, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetSubmissionValidationStatus } from 'Iaso/domains/instances/components/ValidationWorkflow/useGetSubmissionValidationStatus';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../messages';
import { ApprovalForm } from './ApprovalForm';
import { PreviousRejection } from './PreviousRejection';
import { StepInfo } from './StepInfo';

type Props = { formName: string; instanceId: number };

type Params = {
    accountId: string;
    instanceId: string;
    selectedStep?: string;
} & Partial<UrlParams>;

export const ValidationPaper: FunctionComponent<Props> = ({
    formName,
    instanceId,
}) => {
    const params: Params = useParamsObject(
        baseUrls.instanceValidation,
    ) as Params;
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
            <PreviousRejection instanceId={instanceId} />
            <ApprovalForm workflow={currentWorkflow} />
        </WidgetPaper>
    );
};
