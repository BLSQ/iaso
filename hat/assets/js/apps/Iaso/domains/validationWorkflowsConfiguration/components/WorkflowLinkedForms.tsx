import React, { FC } from 'react';
import LinkIcon from '@mui/icons-material/Link';
import { Box, Chip, Paper, Typography } from '@mui/material';
import {
    LinkWithLocation,
    makeRedirectionUrl,
    useSafeIntl,
} from 'bluesquare-components';
import { ValidationWorkflowRetrieve } from 'Iaso/api/validationWorkflows';
import { baseUrls } from 'Iaso/constants/urls';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles = {
    paper: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        mb: 2,
    },
    icon: {
        color: 'text.secondary',
    },
    text: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        flex: '1 1 240px',
        minWidth: 0,
    },
    link: {
        flexShrink: 0,
    },
} satisfies SxStyles;

type Props = {
    workflow: ValidationWorkflowRetrieve;
};

export const WorkflowLinkedForms: FC<Props> = ({ workflow }) => {
    const { formatMessage } = useSafeIntl();
    const linkedForms = workflow.forms ?? [];
    return (
        <Paper
            elevation={1}
            sx={styles.paper}
            data-test="workflow-linked-forms"
        >
            <LinkIcon fontSize="small" sx={styles.icon} />
            <Box sx={styles.text}>
                <Typography variant="body2">
                    {linkedForms.length === 0
                        ? formatMessage(MESSAGES.noLinkedForms)
                        : formatMessage(
                              MESSAGES.linkedForms,
                              numericValues({ count: linkedForms.length }),
                          )}
                </Typography>
                {/* Read only: forms are linked in the workflow details */}
                {linkedForms.map(form => (
                    <Chip key={form.id} label={form.label} size="small" />
                ))}
            </Box>
            <Typography variant="body2" sx={styles.link}>
                <LinkWithLocation
                    to={makeRedirectionUrl(baseUrls.forms, {
                        validationWorkflowIds: `${workflow.id}`,
                    })}
                    data-test="go-to-all-forms-link"
                >
                    {formatMessage(MESSAGES.goToAllForms)}
                </LinkWithLocation>
            </Typography>
        </Paper>
    );
};
