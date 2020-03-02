import React from 'react';
import { formatThousand } from '../../../utils';

const placeholder = '-';

const getBaseColumns = formatMessage => ([
    {
        Header: formatMessage({
            defaultMessage: 'Forms',
            id: 'iaso.forms.title',
        }),
        accessor: 'label',
        width: 300,
    },
]);

export const getColumns = (
    formatMessage,
    months,
    classes,
    instanceStatus,
    onSelect,
    formsTotals,
) => {
    const columns = getBaseColumns(formatMessage);
    months.forEach((month, monthIndex) => {
        const monthColumn = {
            Header: (
                <span className={classes.capitalize}>
                    {formatMessage({
                        defaultMessage: month.label,
                        id: `main.label.months.${month.label}`,
                    })}
                </span>
            ),
            accessor: month.label,
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
                accessor: `months[${monthIndex}].fields.${status.key}`,
                Cell: (settings) => {
                    const value = settings.original.months[monthIndex].fields[status.key];
                    return (
                        <span
                            role="button"
                            tabIndex="0"
                            className={`${classes.cell} ${value ? classes[status.key] : ''}`}
                            onClick={() => onSelect(settings.original, status.key, settings.original.months[monthIndex].id)}
                        >
                            {value || placeholder}
                        </span>
                    );
                },
                Footer: () => (
                    <span>
                        {formatThousand(formsTotals[monthIndex][status.key])}
                    </span>
                ),
            })),
        };
        columns.push(monthColumn);
    });
    return columns;
};

export const getFormsTotal = (forms, instanceStatus) => {
    const totals = [];
    const monthsList = forms[0].months;
    monthsList.forEach(() => {
        const monthTotals = {};
        instanceStatus.forEach((status) => {
            monthTotals[status.key] = 0;
        });
        totals.push(monthTotals);
    });
    forms.forEach((f) => {
        f.months.forEach((m, monthIndex) => {
            instanceStatus.forEach((status) => {
                totals[monthIndex][status.key] += m.fields[status.key];
            });
        });
    });
    return totals;
};
