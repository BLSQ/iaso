import React from 'react';

import formatPercentage from '../utils';

const screenersColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'main.label.name',
            }),
            accessor: 'tester__user__last_name',
            className: 'small',
            Cell: settings => <span>{`${settings.original.tester__user__first_name} ${settings.original.tester__user__last_name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Coordination',
                id: 'main.label.coordination',
            }),
            className: 'small',
            accessor: 'tester__team__coordination__name',
            Cell: settings => <span>{`${settings.original.tester__team__coordination__name === null ? '--' : settings.original.tester__team__coordination__name}`}</span>,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Total',
                id: 'main.label.totalMin',
            }),
            accessor: 'test_pictures',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        settings.original.test_pictures
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Checked',
                id: 'main.label.checked',
            }),
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked !== undefined) ?
                            `${settings.original.checked} (${formatPercentage(settings.original.checked, settings.original.test_pictures)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Concordant',
                id: 'monitoring.label.checkedOk',
            }),
            accessor: 'checked',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_ok !== undefined) ?
                            `${settings.original.checked_ok} (${formatPercentage(settings.original.checked_ok, settings.original.checked)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'With problem',
                id: 'monitoring.label.withProblem',
            }),
            accessor: 'with_problem',
            className: 'small',
            Cell: (settings) => {
                if (settings.original.checked_invalid === undefined) {
                    return '-';
                }
                const value = settings.original.checked_unreadable + settings.original.checked_invalid + settings.original.checked_mismatch;
                return (
                    <span>
                        {`${value} (${formatPercentage(value, settings.original.checked)})`}
                    </span>
                );
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Not readable',
                id: 'monitoring.label.checked_unreadable',
            }),
            accessor: 'checked_unreadable',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_unreadable !== undefined) ?
                            `${settings.original.checked_unreadable} (${formatPercentage(settings.original.checked_unreadable, settings.original.checked_ko)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Invalid',
                id: 'monitoring.label.checkedInvalid',
            }),
            accessor: 'checked_invalid',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_invalid !== undefined) ?
                            `${settings.original.checked_invalid} (${formatPercentage(settings.original.checked_invalid, settings.original.checked_ko)})`
                            : '-'
                    }
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Non concordants',
                id: 'monitoring.label.checked_mismatch',
            }),
            accessor: 'checked_mismatch',
            className: 'small',
            Cell: settings => (
                <span>
                    {
                        (settings.original.checked_mismatch !== undefined) ?
                            `${settings.original.checked_mismatch} (${formatPercentage(settings.original.checked_mismatch, settings.original.checked_ko)})`
                            : '-'
                    }
                </span>
            ),
        },
    ]
);
export default screenersColumns;
