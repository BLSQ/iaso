import React from 'react';
import DraftsIcon from '@mui/icons-material/Drafts';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    IconButton,
    Typography,
} from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import { Box } from '@mui/system';
// import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { SubmissionList } from 'Iaso/domains/instances/components/ValidationWorkflow/timeline/SubmissionList';
import { ValidationNodeRetrieveResponseSubmission } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';

type SubmissionAccordionProps = {
    order: number;
    isMostRecent: boolean;
    submission: any;
    totalSteps: number;
    createdAt: string;
    createdBy: string;
    instanceId: number;
};

const getTextColorFromStatus = (
    status: ValidationNodeRetrieveResponseSubmission['general_validation_status'],
) => {
    switch (status) {
        case 'PENDING':
            return 'warning.main';
        case 'REJECTED':
            return 'error';
        case 'APPROVED':
            return 'success';
    }
};

const getProgressColorFromStatus = (
    status: ValidationNodeRetrieveResponseSubmission['general_validation_status'],
) => {
    switch (status) {
        case 'PENDING':
            return 'warning';
        case 'REJECTED':
            return 'error';
        case 'APPROVED':
            return 'success';
    }
};

export const SubmissionAccordion = ({
    totalSteps,
    submission,
    order,
    isMostRecent,
    createdAt,
    createdBy,
    instanceId,
}: SubmissionAccordionProps) => {
    // const { formatMessage } = useSafeIntl();

    return (
        <Accordion defaultExpanded={isMostRecent}>
            <AccordionSummary
                expandIcon={
                    <IconButton>
                        <ExpandMoreIcon />
                    </IconButton>
                }
                sx={{
                    '& .MuiAccordionSummary-content': {
                        flexDirection: 'column',
                        gap: '1em',
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                    }}
                >
                    {isMostRecent ? (
                        <DraftsIcon color={'action'} />
                    ) : (
                        <EmailIcon color={'action'} />
                    )}
                    <Box
                        sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}
                    >
                        <Typography component={'span'} fontWeight={'bold'}>
                            Submission {order}
                        </Typography>
                        <Typography
                            component={'span'}
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem' }}
                        >
                            by {createdBy} on{' '}
                            {moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </Typography>
                    </Box>
                    <Typography
                        component={'span'}
                        fontWeight={'bold'}
                        color={getTextColorFromStatus(
                            submission.general_validation_status,
                        )}
                    >
                        {submission.general_validation_status}
                    </Typography>
                </Box>
                <Box sx={{ width: '100%' }}>
                    <LinearProgress
                        variant="determinate"
                        color={getProgressColorFromStatus(
                            submission.general_validation_status,
                        )}
                        value={(submission.active_steps / totalSteps) * 100}
                        aria-label="Progress"
                    />
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <SubmissionList
                    timeline={submission.timeline}
                    totalSteps={totalSteps}
                    isMostRecent={isMostRecent}
                    instanceId={instanceId}
                />
            </AccordionDetails>
        </Accordion>
    );
};
