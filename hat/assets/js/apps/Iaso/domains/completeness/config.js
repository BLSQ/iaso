import React from 'react';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import { Link } from 'react-router';

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
        style: { justifyContent: 'left' },
        resizable: true,
    },
];

const getFormUrl = (form, status, period) => {
    let url = baseUrls.instances;
    url += `/formId/${form.id}`;
    url += `/periods/${period.asPeriodType(form.period_type).periodString}`;
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
            columns: activeInstanceStatuses
                .map(status => status.toLowerCase())
                .map(status => ({
                    Header: (
                        <HeaderRowIcon
                            IconComponent={STATUS_COLUMN_ICONS[status]}
                            title={formatMessage(MESSAGES[status])}
                        />
                    ),
                    key: status.key,
                    Cell: settings => {
                        const value =
                            settings.cell.row.original.months[month][status];
                        if (!value) return textPlaceholder;
                        return (
                            <Link
                                className={`${classes.linkButton}  
                                ${value ? classes[status] : ''}`}
                                to={getFormUrl(
                                    settings.cell.row.original,
                                    status,
                                    settings.cell.row.original.months[month]
                                        .period,
                                )}
                            >
                                {value || '-'}
                            </Link>
                        );
                    },
                    Footer: info => {
                        const counts = info.data.map(
                            row => row._original.months[month][status],
                        );
                        const total = counts.reduce(
                            (sum, count) => count + sum,
                            0,
                        );

                        return <span>{formatThousand(total)}</span>;
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
        columns: [
            {
                Header: '',
                Cell: settings =>
                    settings.cell.row.original.generate_derived ? (
                        <IconButtonComponent
                            onClick={() =>
                                onGenerateDerivedInstances(
                                    settings.cell.row.original,
                                )
                            }
                            icon="call-merge"
                            tooltipMessage={MESSAGES.generateDerivedInstances}
                        />
                    ) : (
                        ''
                    ),
            },
        ],
        resizable: true,
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
