import React from 'react';
import { Box } from '@mui/material';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';
import { SubmissionAccordion } from './timeline/SubmissionAccordion';

type Props = { instanceId: number; data?: ValidationNodeRetrieveResponse };

export const InstanceValidation = ({ instanceId, data }: Props) => {
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
