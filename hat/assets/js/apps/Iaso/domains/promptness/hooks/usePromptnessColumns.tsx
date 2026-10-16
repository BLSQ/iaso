import React, { useMemo } from 'react';
import { ChevronRight } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import {
    Column,
    IconButton as IconButtonComponent,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { useGenUrl } from 'Iaso/routing/routing';
import { ShareBar } from '../components/ShareBar';
import {
    PROMPTNESS_STATUSES,
    STATUS_COLORS,
    STATUS_MESSAGES,
} from '../constants';
import MESSAGES from '../messages';
import {
    PromptnessRouterParams,
    PromptnessRow,
    PromptnessStatus,
} from '../types';
import { formatPercent, getSelectedStatuses } from '../utils';

type CellProps = { row: { original: PromptnessRow } };

// Keys of the counts in a row, per status
const STATUS_FIELDS: Record<PromptnessStatus, 'on_time' | 'late' | 'missing'> =
    {
        ON_TIME: 'on_time',
        LATE: 'late',
        MISSING: 'missing',
    };

export const usePromptnessColumns = (
    params: PromptnessRouterParams,
    orgUnitTypeNames: Record<number, string>,
): Column[] => {
    const { formatMessage, formatNumber } = useSafeIntl();
    const genUrl = useGenUrl();
    return useMemo(() => {
        const formatCount = (value: number | null) =>
            value === null ? textPlaceholder : formatNumber(value);
        const selectedStatuses = getSelectedStatuses(params.status);

        // Count + percentage columns of the statuses not excluded by the filter
        const statusColumns: Column[] = PROMPTNESS_STATUSES.filter(status =>
            selectedStatuses.includes(status),
        ).flatMap(status => {
            const field = STATUS_FIELDS[status];
            const percentField = `${field}_percent` as const;
            return [
                {
                    Header: formatMessage(STATUS_MESSAGES[status]),
                    id: field,
                    accessor: field,
                    Cell: ({ row: { original } }: CellProps) => (
                        <Box component="span" color={STATUS_COLORS[status]}>
                            {formatCount(original[field])}
                        </Box>
                    ),
                },
                {
                    Header: '%',
                    id: percentField,
                    accessor: percentField,
                    Cell: ({ row: { original } }: CellProps) => (
                        <Typography variant="body2" color="text.secondary">
                            {formatPercent(original[percentField])}
                        </Typography>
                    ),
                },
            ];
        });

        return [
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'name',
                accessor: 'name',
                align: 'left',
                Cell: ({ row: { original } }: CellProps) => (
                    <Box display="flex" alignItems="center">
                        {/* Keep the names aligned when there is no drill down */}
                        <Box width={36} flexShrink={0}>
                            {original.has_children && (
                                <IconButtonComponent
                                    url={genUrl({
                                        orgUnitId: `${original.id}`,
                                        orgUnitTypeIds: undefined,
                                        page: null,
                                    })}
                                    tooltipMessage={MESSAGES.seeChildren}
                                    overrideIcon={ChevronRight}
                                    size="small"
                                />
                            )}
                        </Box>
                        {original.name}
                    </Box>
                ),
            },
            {
                Header: formatMessage(MESSAGES.orgUnitType),
                id: 'org_unit_type__name',
                accessor: 'org_unit_type__name',
                Cell: ({ row: { original } }: CellProps) => (
                    <>
                        {(original.org_unit_type_id &&
                            orgUnitTypeNames[original.org_unit_type_id]) ??
                            textPlaceholder}
                    </>
                ),
            },
            {
                Header: formatMessage(MESSAGES.expected),
                id: 'expected',
                accessor: 'expected',
                Cell: ({ row: { original } }: CellProps) => (
                    <>{formatCount(original.expected)}</>
                ),
            },
            ...statusColumns,
            {
                Header: formatMessage(MESSAGES.received),
                id: 'received',
                accessor: 'received',
                Cell: ({ row: { original } }: CellProps) => (
                    <b>{formatCount(original.received)}</b>
                ),
            },
            {
                Header: formatMessage(MESSAGES.completeness),
                id: 'completeness_percent',
                accessor: 'completeness_percent',
                Cell: ({ row: { original } }: CellProps) => (
                    <>{formatPercent(original.completeness_percent)}</>
                ),
            },
            {
                Header: formatMessage(MESSAGES.share),
                id: 'share',
                accessor: 'share',
                sortable: false,
                width: 200,
                Cell: ({ row: { original } }: CellProps) =>
                    original.is_applicable ? (
                        <ShareBar counts={original} />
                    ) : (
                        <>{textPlaceholder}</>
                    ),
            },
        ];
    }, [formatMessage, formatNumber, genUrl, orgUnitTypeNames, params.status]);
};
