import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';
import { ApprovalForm } from './ApprovalForm';
import { PreviousRejection } from './PreviousRejection';
import { StepInfo } from './StepInfo';

type Props = { formName: string; instanceId: number };

export const ValidationPaper: FunctionComponent<Props> = ({
    formName,
    instanceId,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper title={formatMessage(MESSAGES.validation)}>
            <StepInfo formName={formName} />
            <PreviousRejection instanceId={instanceId} />
            <ApprovalForm />
        </WidgetPaper>
    );
};
