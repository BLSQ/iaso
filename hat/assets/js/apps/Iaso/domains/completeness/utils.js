import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@material-ui/core';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ErrorOutline from '@material-ui/icons/ErrorOutline';

import Period, {
    PERIOD_TYPE_QUARTERLY, PERIOD_TYPE_MONTHLY, PERIOD_TYPE_YEARLY, PERIOD_TYPE_SIX_MONTHLY,
} from './periods';
import { formatThousand } from '../../../../utils';


/**
 * This function takes a flat list of completeness data, as returned by the API, and transforms it into
 * a structured object, grouped by period first, form second
 *
 * @param completenessData
 * @param periodType
 * @return {{}}
 */
export function groupCompletenessData(completenessData, periodType = PERIOD_TYPE_QUARTERLY) {
    const groupedCompletenessData = {};
    completenessData.forEach((dataEntry) => {
        const period = new Period(dataEntry.period);
        const groupPeriod = period.asPeriodType(periodType);

        // create period group if not exist
        const periodPath = groupPeriod.periodString;
        if (!_.has(groupedCompletenessData, periodPath)) {
            _.set(groupedCompletenessData, periodPath, {
                period: groupPeriod,
                forms: {},
            });
        }

        // create form group if not exist
        const formPath = `${periodPath}.forms.${dataEntry.form.id}`;
        if (!_.has(groupedCompletenessData, formPath)) {
            _.set(groupedCompletenessData, formPath, {
                id: dataEntry.form.id,
                name: dataEntry.form.name,
                months: Object.fromEntries(groupPeriod.monthRange.map(month => [month, {
                    ready: 0,
                    error: 0,
                    exported: 0,
                }])),
            });
        }

        const monthPath = `${formPath}.months.${period.month}`;
        _.update(groupedCompletenessData, `${monthPath}.ready`, ready => ready + dataEntry.counts.ready);
        _.update(groupedCompletenessData, `${monthPath}.error`, error => error + dataEntry.counts.error);
        _.update(groupedCompletenessData, `${monthPath}.exported`, exported => exported + dataEntry.counts.exported);
    });

    return groupedCompletenessData;
}

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

const STATUS_COLUMN_ICONS = {
    ready: HourglassEmpty,
    error: ErrorOutline,
    exported: CheckCircleOutline,
};

function StatusIcon({ status, title }) {
    const IconComponent = STATUS_COLUMN_ICONS[status];

    return (
        <Tooltip title={title}>
            <IconComponent />
        </Tooltip>
    );
}
StatusIcon.propTypes = {
    status: PropTypes.oneOf(Object.keys(STATUS_COLUMN_ICONS)).isRequired,
    title: PropTypes.string.isRequired,
};

const STATUS_COLUMN_SIZES = {
    [PERIOD_TYPE_MONTHLY]: undefined,
    [PERIOD_TYPE_QUARTERLY]: undefined,
    [PERIOD_TYPE_SIX_MONTHLY]: 75,
    [PERIOD_TYPE_YEARLY]: 50,
};

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
                Header: <StatusIcon
                    status={status}
                    title={formatMessage({
                        defaultMessage: status,
                        id: `iaso.completeness.${status}`,
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
                            onClick={() => onSelect(settings.original, status, settings.original.months[month])}
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
