import React, { FunctionComponent } from 'react';
import { DoneAll, VisibilityOff } from '@mui/icons-material';
import { Box, Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import { STATUS_FILTER_MESSAGES } from '../../config';
import MESSAGES from '../../messages';
import { ALL_STATUSES, getMappingProgress } from '../../questionTree';
import { QuestionStatus } from '../../types';
import { QuestionStatusIcon } from '../QuestionStatusIcon';

const styles: SxStyles = {
    root: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
    },
};

type Props = {
    statuses: QuestionStatus[];
    counts: Record<QuestionStatus, number>;
    onChange: (statuses: QuestionStatus[]) => void;
};

export const StatusFilterChips: FunctionComponent<Props> = ({
    statuses,
    counts,
    onChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const allShown = statuses.length === ALL_STATUSES.length;
    const { total } = getMappingProgress(counts);
    const handleToggle = (status: QuestionStatus) => {
        onChange(
            statuses.includes(status)
                ? statuses.filter(shown => shown !== status)
                : ALL_STATUSES.filter(
                      shown => shown === status || statuses.includes(shown),
                  ),
        );
    };
    return (
        <Box sx={styles.root}>
            <Chip
                size="small"
                icon={<DoneAll />}
                label={`${formatMessage(MESSAGES.statusAll)} (${total})`}
                color={allShown ? 'primary' : 'default'}
                variant={allShown ? 'filled' : 'outlined'}
                aria-pressed={allShown}
                onClick={() => onChange(ALL_STATUSES)}
            />
            {ALL_STATUSES.map(status => {
                const shown = statuses.includes(status);
                const label = formatMessage(STATUS_FILTER_MESSAGES[status]);
                return (
                    <Chip
                        key={status}
                        size="small"
                        icon={
                            shown ? (
                                <QuestionStatusIcon
                                    status={status}
                                    decorative
                                />
                            ) : (
                                <VisibilityOff />
                            )
                        }
                        label={`${label} (${counts[status]})`}
                        variant={shown ? 'filled' : 'outlined'}
                        title={formatMessage(MESSAGES.showStatus, {
                            status: label,
                        })}
                        aria-pressed={shown}
                        onClick={() => handleToggle(status)}
                    />
                );
            })}
        </Box>
    );
};
