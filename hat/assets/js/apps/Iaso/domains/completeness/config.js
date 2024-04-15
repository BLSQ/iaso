import React from 'react';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import { Link } from 'react-router-dom';

import {
    IconButton as IconButtonComponent,
    formatThousand,
    textPlaceholder,
    HeaderRowIcon,
} from 'bluesquare-components';
import { baseUrls } from '../../constants/urls';

import {
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_SIX_MONTH,
    PERIOD_TYPE_YEAR,
    PERIOD_TYPES,
} from '../periods/constants';
import { INSTANCE_STATUSES } from '../instances/constants';

import MESSAGES from './messages';

const STATUS_COLUMN_SIZES = {
    [PERIOD_TYPE_MONTH]: undefined,
    [PERIOD_TYPE_QUARTER]: undefined,
    [PERIOD_TYPE_SIX_MONTH]: 75,
    [PERIOD_TYPE_YEAR]: 50,
};

const STATUS_COLUMN_ICONS = {
    ready: HourglassEmpty,
    error: ErrorOutline,
    exported: CheckCircleOutline,
};

const getBaseColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.formsTitle),
        accessor: 'name',
        width: 300,
        align: 'left',
        resizable: true,
    },
];

const getFormUrl = (form, status, period) => {
    let url = baseUrls.instances;
    url += `/formIds/${form.id}`;
    // periodType must come before startPeriod or you get a 404
    url += `/periodType/${form.period_type.toUpperCase()}`;
    url += `/startPeriod/${period.asPeriodType(form.period_type).periodString}`;
    url += `/endPeriod/${period.asPeriodType(form.period_type).periodString}`;
    url += `/status/${status.toUpperCase()}`;
    return url;
};

const monthsList = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'jully',
    'august',
    'september',
    'october',
    'november',
    'december',
];

export const getColumns = (
    formatMessage,
    months,
    classes,
    activeInstanceStatuses,
    onSelect,
    onGenerateDerivedInstances,
    activePeriodType,
) => {
    const columns = getBaseColumns(formatMessage);
    months.forEach(month => {
        const monthColumn = {
            Header: (
                <span className={classes.capitalize}>
                    {formatMessage(MESSAGES[monthsList[month - 1]])}
                </span>
            ),
            sortable: false,
            resizable: false,
            accessor: `month-${month}`,
            columns: activeInstanceStatuses
                .map(status => status.toLowerCase())
                .map(status => ({
                    Header: (
                        <HeaderRowIcon
                            IconComponent={STATUS_COLUMN_ICONS[status]}
                            title={formatMessage(MESSAGES[status])}
                        />
                    ),
                    sortable: false,
                    resizable: false,
                    accessor: `month-${month}-${status}`,
                    key: status.key,
                    align: 'center',
                    Cell: settings => {
                        const value =
                            settings.row.original.months[month][status];
                        if (!value) return textPlaceholder;
                        return (
                            <Link
                                className={`${classes.linkButton}
                                ${value ? classes[status] : ''}`}
                                to={getFormUrl(
                                    settings.row.original,
                                    status,
                                    settings.row.original.months[month].period,
                                )}
                            >
                                {value || '-'}
                            </Link>
                        );
                    },
                    Footer: info => {
                        const counts = info?.data?.map(
                            row => row.months[month][status],
                        );
                        const total = counts?.reduce(
                            (sum, count) => count + sum,
                            0,
                        );
                        return <>{total && formatThousand(total)}</>;
                    },
                    width: STATUS_COLUMN_SIZES[activePeriodType],
                })),
        };
        columns.push(monthColumn);
    });

    columns.push({
        Header: (
            <span className={classes.capitalize}>
                {formatMessage(MESSAGES.actions)}
            </span>
        ),
        accessor: 'actions',
        columns: [
            {
                Header: '',
                accessor: 'actions-1',
                Cell: settings => {
                    return settings.row.original.generate_derived ? (
                        <IconButtonComponent
                            onClick={() =>
                                onGenerateDerivedInstances(
                                    settings.row.original,
                                )
                            }
                            icon="call-merge"
                            tooltipMessage={MESSAGES.generateDerivedInstances}
                        />
                    ) : (
                        ''
                    );
                },
            },
        ],
        resizable: false,
        sortable: false,
    });

    return columns;
};

export const instanceStatusOptions = INSTANCE_STATUSES.map(instanceStatus => ({
    value: instanceStatus,
    label: MESSAGES[`${instanceStatus.toLowerCase()}Multi`],
}));

export const periodTypeOptions = PERIOD_TYPES.map(periodType => ({
    value: periodType,
    label: MESSAGES[periodType.toLowerCase()],
}));
