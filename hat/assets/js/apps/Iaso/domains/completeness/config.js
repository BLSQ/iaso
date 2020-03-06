import React from 'react';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';

import HeaderRowIcon from '../../components/tables/HeaderRowIconComponent';
import {
    PERIOD_TYPE_MONTH, PERIOD_TYPE_QUARTER, PERIOD_TYPE_SIX_MONTH, PERIOD_TYPE_YEAR, PERIOD_TYPES,
} from '../periods/constants';
import { formatThousand } from '../../../../utils';
import { INSTANCE_STATUSES } from '../instances/constants';

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

const getBaseColumns = formatMessage => ([
    {
        Header: formatMessage({
            defaultMessage: 'Forms',
            id: 'iaso.forms.title',
        }),
        accessor: 'name',
        width: 300,
    },
]);

export const getColumns = (
    formatMessage,
    months,
    classes,
    activeInstanceStatuses,
    onSelect,
    activePeriodType,
) => {
    const columns = getBaseColumns(formatMessage);
    months.forEach((month) => {
        const monthColumn = {
            Header: (
                <span className={classes.capitalize}>
                    {formatMessage({
                        defaultMessage: `Month ${month}`,
                        id: `main.label.months.${month}`,
                    })}
                </span>
            ),
            columns: activeInstanceStatuses.map(status => status.toLowerCase()).map(status => ({
                Header: <HeaderRowIcon
                    IconComponent={STATUS_COLUMN_ICONS[status]}
                    title={formatMessage({
                        defaultMessage: status,
                        id: `iaso.label.instanceStatus.${status}`,
                    })}
                />,
                key: status.key,
                Cell: (settings) => {
                    const value = settings.original.months[month][status];
                    return (
                        <span
                            role="button"
                            tabIndex="0"
                            className={`${classes.cell} ${value ? classes[status] : ''}`}
                            onClick={() => onSelect(settings.original, status)}
                        >
                            {value || '-'}
                        </span>
                    );
                },
                Footer: (info) => {
                    const counts = info.data.map(row => row._original.months[month][status]);
                    const total = counts.reduce((sum, count) => count + sum, 0);

                    return <span>{formatThousand(total)}</span>;
                },
                width: STATUS_COLUMN_SIZES[activePeriodType],
            })),
        };
        columns.push(monthColumn);
    });

    return columns;
};

export const instanceStatusOptions = INSTANCE_STATUSES.map(instanceStatus => (
    {
        value: instanceStatus,
        label: {
            id: `iaso.label.instanceStatus.${instanceStatus.toLowerCase()}Multi`,
            defaultMessage: instanceStatus,
        },
    }
));

export const periodTypeOptions = PERIOD_TYPES.map(periodType => ({
    value: periodType,
    label: {
        id: `iaso.label.periodType.${periodType.toLowerCase()}`,
        defaultMessage: periodType,
    },
}));
