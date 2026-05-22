import React from 'react';
import { Alert, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/instances/messages';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { SubmissionAccordion } from './timeline/SubmissionAccordion';

type Props = { instanceId: number; data?: ValidationNodeRetrieveResponse };

export const InstanceValidation = ({ instanceId, data }: Props) => {
    const { formatMessage } = useSafeIntl();

    if (!data?.validation_status) {
        return (
            <Alert severity={'info'}>{formatMessage(MESSAGES.noData)}</Alert>
        );
    }
    return (
        <Box
            sx={{
                width: '100%',
                padding: theme => theme.spacing(2),
                margin: 0,
                overflow: 'auto',
            }}
        >
            {data?.submissions?.map((submission, idx, list) => {
                return (
                    <SubmissionAccordion
                        instanceId={instanceId}
                        totalSteps={data.total_steps}
                        isMostRecent={idx === 0}
                        submission={submission}
                        order={list.length - idx}
                        createdAt={submission.created_at}
                        createdBy={submission.created_by}
                        key={`submission-${submission?.created_at}`}
                    />
                );
            })}
        </Box>
    );
};
