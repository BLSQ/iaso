import React, { FC } from 'react';
import { Typography } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import { ValidationWorkflowList } from 'Iaso/api/validationWorkflows';
import { convertToDate } from 'Iaso/components/Cells/DateTimeCell';
import { baseUrls } from 'Iaso/constants/urls';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import MESSAGES from '../messages';

type CellProps = { workflow: ValidationWorkflowList };

export const WorkflowNameCell: FC<CellProps> = ({ workflow }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Typography variant="body2">
                <LinkWithLocation
                    to={`/${baseUrls.validationWorkflowsConfigurationDetail}/slug/${workflow.slug}`}
                >
                    {workflow.name}
                </LinkWithLocation>
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {formatMessage(
                    MESSAGES.linkedFormsCount,
                    numericValues({ count: workflow.linked_forms_count }),
                )}
            </Typography>
        </>
    );
};

export const WorkflowStepsCell: FC<CellProps> = ({ workflow }) => {
    const { formatMessage } = useSafeIntl();
    // Each step is shown by the user roles validating it, or its name when it has none
    const chain = workflow.steps
        .map(
            step =>
                step.roles_required.map(role => role.name).join(', ') ||
                step.name,
        )
        .join(' → ');
    return (
        <>
            <Typography variant="body2">
                {formatMessage(
                    MESSAGES.stepsCount,
                    numericValues({ count: workflow.steps.length }),
                )}
            </Typography>
            {chain && (
                <Typography variant="body2" color="text.secondary">
                    {chain}
                </Typography>
            )}
        </>
    );
};

export const WorkflowLastUpdatedCell: FC<CellProps> = ({ workflow }) => (
    <>
        <Typography variant="body2">
            {convertToDate(workflow.updated_at)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
            {workflow.updated_by ?? workflow.created_by}
        </Typography>
    </>
);
