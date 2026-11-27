import React, { FunctionComponent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ReplayIcon from '@mui/icons-material/Replay';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { LinkTo } from 'Iaso/components/nav/LinkTo';
import { SxStyles } from 'Iaso/types/general';
import { getLocaleDateFormat } from 'Iaso/utils/dates';
import MESSAGES from '../messages';
import {
    ValidationWorkflowInstanceCurrentStep,
    ValidationWorkflowInstanceListResponseItem,
} from '../types';
import { daysSince, getSubmissionLabel, getSubmissionUrl } from '../utils';
import { StatusChip } from './StatusChip';

type Item = ValidationWorkflowInstanceListResponseItem;

const styles = {
    secondary: {
        color: 'text.secondary',
        fontSize: '0.8rem',
    },
    stepRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
    },
    stepChip: {
        px: 0.75,
        py: 0.25,
        borderRadius: 0.5,
        backgroundColor: 'action.hover',
        fontSize: '0.7rem',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    line: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: '0.8rem',
        mt: 0.5,
        '& svg': { fontSize: '1rem' },
    },
} satisfies SxStyles;

const formatDate = (date?: string | null, format = 'L'): string =>
    date ? moment(date).format(getLocaleDateFormat(format)) : textPlaceholder;

type TwoLinesProps = {
    primary: React.ReactNode;
    secondary?: React.ReactNode;
};
const TwoLines: FunctionComponent<TwoLinesProps> = ({ primary, secondary }) => (
    <Box textAlign="left">
        <Typography variant="body2">{primary}</Typography>
        {secondary && (
            <Typography variant="body2" sx={styles.secondary}>
                {secondary}
            </Typography>
        )}
    </Box>
);

export const SubmissionCell: FunctionComponent<{
    item: Item;
    accountId?: number;
}> = ({ item, accountId }) => (
    <TwoLines
        primary={
            <LinkTo
                condition
                url={getSubmissionUrl({ item, accountId })}
                text={getSubmissionLabel(item)}
            />
        }
        secondary={[item.workflow?.name, formatDate(item.submitted_at)]
            .filter(Boolean)
            .join(' · ')}
    />
);

export const OrgUnitCell: FunctionComponent<{ item: Item }> = ({ item }) =>
    item.org_unit ? (
        <TwoLines
            primary={item.org_unit.name}
            secondary={item.org_unit.parent?.name}
        />
    ) : (
        <>{textPlaceholder}</>
    );

// Full name only ("Jean Mbala"), the username is shown only when the user has no name
const getFullName = (user: NonNullable<Item['submitted_by']>): string =>
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username;

export const SubmittedByCell: FunctionComponent<{ item: Item }> = ({
    item,
}) => (
    <Box textAlign="left">
        <Typography variant="body2">
            {item.submitted_by
                ? getFullName(item.submitted_by)
                : textPlaceholder}
        </Typography>
    </Box>
);

const StepLine: FunctionComponent<{
    step: ValidationWorkflowInstanceCurrentStep;
    stepCount: number | null;
}> = ({ step, stepCount }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.stepRow}>
            {step.position && stepCount && (
                <Box component="span" sx={styles.stepChip}>
                    {formatMessage(MESSAGES.step, {
                        position: `${step.position}`,
                        count: `${stepCount}`,
                    })}
                </Box>
            )}
            <Typography variant="body2" component="span">
                {step.name}
            </Typography>
        </Box>
    );
};

const LastUserActionLine: FunctionComponent<{ item: Item }> = ({ item }) => {
    const { formatMessage } = useSafeIntl();
    const action = item.last_user_action;
    if (!action) return null;
    const isApproval = action.status === 'ACCEPTED';
    const date = formatDate(action.date);
    let message;
    if (action.position) {
        message = isApproval
            ? MESSAGES.youApprovedStep
            : MESSAGES.youRejectedStep;
    } else {
        message = isApproval
            ? MESSAGES.youApprovedNamedStep
            : MESSAGES.youRejectedNamedStep;
    }
    return (
        <Box sx={{ ...styles.line, ...styles.secondary }}>
            {isApproval ? <CheckIcon /> : <CloseIcon />}
            {formatMessage(message, {
                position: `${action.position ?? ''}`,
                name: action.name,
                date,
            })}
        </Box>
    );
};

export const ValidationCell: FunctionComponent<{ item: Item }> = ({ item }) => {
    const { formatMessage } = useSafeIntl();
    const isPending = item.validation_status === 'PENDING';

    if (!isPending) {
        return (
            <Box textAlign="left">
                <StatusChip status={item.validation_status} />
                <LastUserActionLine item={item} />
            </Box>
        );
    }

    return (
        <Box textAlign="left" data-testid="validation-cell">
            {item.current_steps.map(step => (
                <StepLine
                    key={step.id}
                    step={step}
                    stepCount={item.step_count}
                />
            ))}
            {item.pending_since && (
                <Box sx={styles.line}>
                    {item.requires_user_action ? (
                        <PersonIcon />
                    ) : (
                        <ScheduleIcon />
                    )}
                    {formatMessage(
                        item.requires_user_action
                            ? MESSAGES.waitingOnYou
                            : MESSAGES.waitingOnOthers,
                        { days: `${daysSince(item.pending_since)}` },
                    )}
                </Box>
            )}
            <LastUserActionLine item={item} />
            {item.is_resubmission && (
                <Box sx={{ ...styles.line, ...styles.secondary }}>
                    <ReplayIcon />
                    {formatMessage(MESSAGES.resubmittedAfterRejection)}
                </Box>
            )}
        </Box>
    );
};
