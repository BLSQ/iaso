import React, { FC } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Breadcrumbs, Typography } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

const styles = {
    breadcrumbs: {
        mb: 2,
    },
} satisfies SxStyles;

type Props = {
    workflowName?: string;
};

export const WorkflowBreadcrumbs: FC<Props> = ({ workflowName }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            sx={styles.breadcrumbs}
            data-test="workflow-breadcrumbs"
        >
            <Typography variant="body2">
                <LinkWithLocation
                    to={`/${baseUrls.validationWorkflowsConfiguration}`}
                    data-test="validation-workflows-link"
                >
                    {formatMessage(MESSAGES.validationWorkflows)}
                </LinkWithLocation>
            </Typography>
            <Typography variant="body2" color="text.primary">
                {workflowName ||
                    formatMessage(MESSAGES.addInstancesValidationWorkflow)}
            </Typography>
        </Breadcrumbs>
    );
};
