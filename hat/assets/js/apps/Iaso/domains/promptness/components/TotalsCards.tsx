import React, { FunctionComponent, ReactNode } from 'react';
import {
    CheckCircleOutline,
    InboxOutlined,
    RemoveCircleOutline,
    Schedule,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFormatCount } from 'Iaso/hooks/useFormatCount';
import { SxStyles } from 'Iaso/types/general';
import {
    PROMPTNESS_STATUSES,
    STATUS_COLORS,
    STATUS_FIELDS,
    STATUS_MESSAGES,
} from '../constants';
import MESSAGES from '../messages';
import { PromptnessCounts, PromptnessStatus } from '../types';
import { formatPercent } from '../utils';
import { StatCard } from './StatCard';

type Props = {
    totals: PromptnessCounts;
    orgUnitName: string;
};

const STATUS_ICONS: Record<PromptnessStatus, ReactNode> = {
    ON_TIME: <CheckCircleOutline />,
    LATE: <Schedule />,
    MISSING: <RemoveCircleOutline />,
};

const styles: SxStyles = {
    root: {
        display: 'grid',
        gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)',
        },
        gap: 2,
    },
};

export const TotalsCards: FunctionComponent<Props> = ({
    totals,
    orgUnitName,
}) => {
    const { formatMessage } = useSafeIntl();
    const formatCount = useFormatCount();
    if (!totals.is_applicable) {
        return (
            <Typography color="text.secondary">
                {formatMessage(MESSAGES.notApplicable)}
            </Typography>
        );
    }
    // Excluded statuses (through the status filter) are returned as null
    const statusCards = PROMPTNESS_STATUSES.map(status => ({
        status,
        count: totals[STATUS_FIELDS[status]],
        percent: totals[`${STATUS_FIELDS[status]}_percent`],
        icon: STATUS_ICONS[status],
    })).filter(card => card.count !== null);

    return (
        <Box sx={styles.root}>
            <StatCard
                title={formatMessage(MESSAGES.expectedSubmissions)}
                value={formatCount(totals.expected)}
                details={formatMessage(MESSAGES.expectedDetails, {
                    orgUnit: orgUnitName,
                })}
            />
            <StatCard
                title={formatMessage(MESSAGES.completeness)}
                icon={<InboxOutlined />}
                value={formatPercent(totals.completeness_percent)}
                details={formatMessage(MESSAGES.completenessDetails, {
                    received: formatCount(totals.received),
                })}
            />
            {statusCards.map(({ status, count, percent, icon }) => (
                <StatCard
                    key={status}
                    title={formatMessage(STATUS_MESSAGES[status])}
                    icon={icon}
                    color={STATUS_COLORS[status]}
                    value={formatCount(count)}
                    details={formatMessage(MESSAGES.ofExpected, {
                        percent: formatPercent(percent),
                    })}
                />
            ))}
        </Box>
    );
};
