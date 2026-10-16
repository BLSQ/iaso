import React, { FunctionComponent } from 'react';
import {
    CheckCircleOutline,
    InboxOutlined,
    RemoveCircleOutline,
    Schedule,
} from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import {
    STATUS_COLORS,
    STATUS_LATE,
    STATUS_MESSAGES,
    STATUS_MISSING,
    STATUS_ON_TIME,
} from '../constants';
import MESSAGES from '../messages';
import { PromptnessCounts } from '../types';
import { formatPercent } from '../utils';
import { StatCard } from './StatCard';

type Props = {
    totals: PromptnessCounts;
    orgUnitName: string;
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
    const { formatMessage, formatNumber } = useSafeIntl();
    if (!totals.is_applicable) {
        return (
            <Typography color="text.secondary">
                {formatMessage(MESSAGES.notApplicable)}
            </Typography>
        );
    }
    const formatCount = (value: number | null) =>
        value === null ? textPlaceholder : formatNumber(value);

    // Excluded statuses (through the status filter) are returned as null
    const statusCards = [
        {
            status: STATUS_ON_TIME,
            count: totals.on_time,
            percent: totals.on_time_percent,
            icon: <CheckCircleOutline />,
        },
        {
            status: STATUS_LATE,
            count: totals.late,
            percent: totals.late_percent,
            icon: <Schedule />,
        },
        {
            status: STATUS_MISSING,
            count: totals.missing,
            percent: totals.missing_percent,
            icon: <RemoveCircleOutline />,
        },
    ].filter(card => card.count !== null);

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
