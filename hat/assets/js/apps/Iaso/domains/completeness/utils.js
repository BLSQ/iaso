import React from 'react';
import _ from 'lodash';

import Period, { PERIOD_TYPE_QUARTERLY } from './periods';
import { formatThousand } from '../../../../utils';

// eslint-disable-next-line import/prefer-default-export
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
        if (!_.has(groupCompletenessData, formPath)) {
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

        _.update(groupedCompletenessData, `${formPath}.months.${period.month}.ready`, ready => ready + dataEntry.counts.ready);
        _.update(groupedCompletenessData, `${formPath}.months.${period.month}.error`, error => error + dataEntry.counts.duplicated);
        _.update(groupedCompletenessData, `${formPath}.months.${period.month}.exported`, exported => exported + dataEntry.counts.exported);
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

export const getColumns = (
    formatMessage,
    months,
    classes,
    instanceStatus,
    onSelect,
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
            columns: instanceStatus.filter(status => status.isVisible).map(status => ({
                Header: (
                    <span className={classes.capitalize}>
                        {formatMessage({
                            defaultMessage: status.key,
                            id: `iaso.completeness.${status.key}`,
                        })}
                    </span>
                ),
                key: status.key,
                Cell: (settings) => {
                    const value = settings.original.months[month][status.key];
                    return (
                        <span
                            role="button"
                            tabIndex="0"
                            className={`${classes.cell} ${value ? classes[status.key] : ''}`}
                            onClick={() => onSelect(settings.original, status.key, settings.original.months[month])}
                        >
                            {value || '-'}
                        </span>
                    );
                },
                Footer: (info) => {
                    const counts = info.data.map(row => row._original.months[month][status.key]);
                    const total = counts.reduce((sum, count) => count + sum, 0);

                    return <span>{formatThousand(total)}</span>;
                },
            })),
        };
        columns.push(monthColumn);
    });
    return columns;
};
